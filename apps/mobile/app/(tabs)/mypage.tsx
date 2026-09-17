import { View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { Text } from '@/components/Text'
import { Colors } from '@/constants/theme'
import { BodyPartCode, Severity, SymptomRecord } from '@second-body/shared'
import { BODY_PART_LABELS, SEVERITY_COLOR } from '@/constants/symptom'
import { useAuth } from '@/lib/AuthContext'
import { fetchProfile, Profile } from '@/lib/profile'
import { fetchRecords } from '@/app/api/records'

interface ActivePart {
  code: BodyPartCode
  severity: Severity
}

interface Summary {
  activeParts: ActivePart[]
  total: number
}

/** 같은 부위에 미해결 기록이 여러 개면 가장 최근 것 우선 */
function byRecency(a: SymptomRecord, b: SymptomRecord) {
  return b.record_date.localeCompare(a.record_date) || b.created_at.localeCompare(a.created_at)
}

export default function MyPageScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { userId, signOut } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      if (!userId) return
      let alive = true
      ;(async () => {
        try {
          const [p, records] = await Promise.all([fetchProfile(userId), fetchRecords()])
          if (!alive) return
          setProfile(p)

          // 부위별 최신 미해결 증상
          const byPart: Partial<Record<BodyPartCode, Severity>> = {}
          for (const r of records.filter((x) => !x.resolved_at).sort(byRecency)) {
            if (byPart[r.body_part_code] === undefined) byPart[r.body_part_code] = r.severity
          }
          const activeParts = Object.entries(byPart).map(([code, severity]) => ({
            code: code as BodyPartCode,
            severity: severity as Severity,
          }))
          setSummary({ activeParts, total: records.length })
        } catch (e) {
          console.error('프로필 불러오기 실패:', e)
        } finally {
          if (alive) setLoading(false)
        }
      })()
      return () => {
        alive = false
      }
    }, [userId]),
  )

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-lowest">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  const initial = (profile?.name || profile?.email || '?').trim().charAt(0).toUpperCase()
  const activeParts = summary?.activeParts ?? []

  return (
    <ScrollView
      className="flex-1 bg-surface-lowest"
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 40 }}
    >
      {/* 프로필 헤더 */}
      <View className="items-center px-5">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-3"
          style={{ backgroundColor: Colors.primary }}
        >
          <Text className="text-surface text-3xl font-bold">{initial}</Text>
        </View>
        <Text className="text-lg font-bold text-on-surface">{profile?.name || '이름 없음'}</Text>
        <Text className="text-sm text-on-surface-variant mt-0.5">{profile?.email}</Text>
        {profile?.avatarName ? (
          <Text className="text-xs text-on-surface-variant mt-1">
            제2의 나 · {profile.avatarName}
          </Text>
        ) : null}

        <TouchableOpacity
          onPress={() => router.push('/profile/edit')}
          className="mt-4 px-5 py-2 rounded-full border border-outline-variant"
        >
          <Text className="text-sm font-medium text-on-surface">프로필 수정</Text>
        </TouchableOpacity>
      </View>

      {/* 건강 요약 */}
      <View className="mx-5 mt-8 bg-surface-low rounded-2xl p-5">
        <View className="flex-row">
          <SummaryItem label="통증" value={`${activeParts.length}곳`} />
          <SummaryItem label="총 기록" value={`${summary?.total ?? 0}건`} />
        </View>
      </View>

      {/* 현재 아픈 부위 */}
      <View className="mx-5 mt-6">
        <Text className="text-sm font-semibold text-on-surface mb-3">현재 아픈 부위</Text>
        {activeParts.length === 0 ? (
          <Text className="text-sm text-on-surface-variant">진행중인 증상이 없어요</Text>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {activeParts.map((p) => (
              <View
                key={p.code}
                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-low border border-outline-variant"
              >
                <View className={`w-2 h-2 rounded-full ${SEVERITY_COLOR[p.severity]}`} />
                <Text className="text-xs text-on-surface">{BODY_PART_LABELS[p.code]}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 로그아웃 */}
      <TouchableOpacity
        onPress={signOut}
        className="mx-5 mt-8 py-3.5 rounded-2xl items-center border border-outline-variant"
      >
        <Text className="text-sm font-medium text-on-surface-variant">로그아웃</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View className="items-center flex-1">
      <Text className="text-base font-bold text-on-surface">{value}</Text>
      <Text className="text-xs text-on-surface-variant mt-1">{label}</Text>
    </View>
  )
}
