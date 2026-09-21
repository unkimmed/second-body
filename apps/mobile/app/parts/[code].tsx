import { View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Text } from '@/components/Text'
import { Colors } from '@/constants/theme'
import { BodyPartCode, SymptomRecord } from '@second-body/shared'
import { BODY_PART_LABELS, SEVERITY_COLOR, SEVERITY_LABELS } from '@/constants/symptom'
import { useAuth } from '@/lib/AuthContext'
import { fetchRecords } from '@/app/api/records'

function byDateDesc(a: SymptomRecord, b: SymptomRecord) {
  return b.record_date.localeCompare(a.record_date) || b.created_at.localeCompare(a.created_at)
}

export default function PartHistoryScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const router = useRouter()
  const { userId } = useAuth()
  const partCode = code as BodyPartCode
  const [records, setRecords] = useState<SymptomRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetchRecords()
      .then((all) => setRecords(all.filter((r) => r.body_part_code === partCode)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [userId, partCode])

  const sorted = useMemo(() => [...records].sort(byDateDesc), [records])
  const active = sorted.find((r) => !r.resolved_at)
  // 추이 sparkline: 오래된 → 최신 (최대 24개)
  const trend = useMemo(() => [...sorted].reverse().slice(-24), [sorted])

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-lowest">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-surface-lowest" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="px-5 pt-4">
        <Text className="text-xl font-bold text-on-surface">{BODY_PART_LABELS[partCode]}</Text>
        <Text className="text-xs text-on-surface-variant mt-1">
          총 {sorted.length}건{active ? ' · 진행중' : ''}
        </Text>
      </View>

      {sorted.length === 0 ? (
        <View className="mx-5 mt-8 bg-surface-low rounded-2xl p-8 items-center">
          <Text className="text-sm text-on-surface-variant">이 부위 기록이 없어요</Text>
        </View>
      ) : (
        <>
          {/* 강도 추이 */}
          <View className="mx-5 mt-6 bg-surface-low rounded-2xl p-5">
            <Text className="text-sm font-semibold text-on-surface mb-3">강도 추이</Text>
            <View className="flex-row items-end gap-1" style={{ height: 60 }}>
              {trend.map((r) => (
                <View
                  key={r.id}
                  className={`flex-1 rounded-sm ${SEVERITY_COLOR[r.severity]} ${r.resolved_at ? 'opacity-40' : ''}`}
                  style={{ height: `${(r.severity / 5) * 100}%`, minWidth: 4 }}
                />
              ))}
            </View>
            <Text className="text-[10px] text-on-surface-variant mt-2">오래된 순 → 최신</Text>
          </View>

          {/* 기록 목록 */}
          <View className="mx-5 mt-6 gap-2">
            {sorted.map((r) => (
              <TouchableOpacity
                key={r.id}
                onPress={() => router.push(`/records/${r.id}`)}
                className="bg-surface-lowest border border-outline-variant rounded-2xl p-4 flex-row items-center gap-3"
                activeOpacity={0.7}
              >
                <View className={`w-2.5 h-2.5 rounded-full ${SEVERITY_COLOR[r.severity]}`} />
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs font-semibold text-on-surface">{r.record_date}</Text>
                    {r.resolved_at && (
                      <View className="bg-primary/10 border border-primary rounded-full px-2 py-0.5">
                        <Text className="text-primary text-[10px] font-semibold">해결됨</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-on-surface-variant mt-0.5">
                    {SEVERITY_LABELS[r.severity]}
                    {r.note ? ` · ${r.note}` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  )
}
