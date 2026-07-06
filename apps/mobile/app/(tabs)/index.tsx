import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@/components/Text'
import { useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { SymptomRecord, BodyPartCode, Severity } from '@second-body/shared'
import { Colors } from '@/constants/theme'
import { useAuth } from '@/lib/AuthContext'
import { BodyMapView } from '@/components/bodyMap'
import { fetchRecords, createRecord, patchRecord } from '../api/records'

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { userId, signOut } = useAuth()
  const [records, setRecords] = useState<SymptomRecord[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      if (userId) loadRecords()
    }, [userId]),
  )

  async function loadRecords() {
    try {
      const data = await fetchRecords(userId!)
      setRecords(data)
    } catch (e) {
      console.error('기록 목록 불러오기 실패:', e)
    } finally {
      setLoading(false)
    }
  }

  const todayRecords = useMemo(
    () => records.filter((r) => r.record_date === todayString()),
    [records],
  )

  const severityMap = useMemo<Partial<Record<BodyPartCode, Severity>>>(
    () => Object.fromEntries(todayRecords.map((r) => [r.body_part_code, r.severity])),
    [todayRecords],
  )

  const handleSaveSymptom = useCallback(
    async (code: BodyPartCode, severity: Severity, note: string) => {
      const existing = todayRecords.find((r) => r.body_part_code === code)
      try {
        if (!existing) {
          const res = await createRecord(userId!, {
            record_date: todayString(),
            body_part_code: code,
            severity,
            note: note || undefined,
          })
          const created = (await res.json()) as SymptomRecord
          setRecords((prev) => [created, ...prev])
        } else {
          const updated = await patchRecord(existing.id, userId!, {
            severity,
            note: note || undefined,
          })
          setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
        }
      } catch (e) {
        console.error('증상 저장 실패:', e)
      }
    },
    [todayRecords, userId],
  )

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  const today = todayString()
  const recordedCount = todayRecords.length

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>내 몸 지도</Text>
          <Text style={styles.headerSub}>
            {today} · {recordedCount > 0 ? `${recordedCount}개 부위 기록됨` : '기록된 증상 없음'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => router.push('/records/new')}
            activeOpacity={0.7}
          >
            <Text style={styles.historyText}>기록 추가</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={signOut} hitSlop={8}>
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </View>

      <BodyMapView severityMap={severityMap} onSaveSymptom={handleSaveSymptom} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerLow,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.surface,
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(251,249,245,0.7)',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  historyBtn: {
    backgroundColor: 'rgba(251,249,245,0.15)',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  historyText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.surface,
  },
  logoutText: {
    fontSize: 11,
    color: 'rgba(251,249,245,0.6)',
  },
})
