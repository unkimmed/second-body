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
import { fetchRecords, createRecord, patchRecord, resolveRecord } from '../api/records'

function todayString() {
  return new Date().toLocaleDateString('en-CA')
}

/** 같은 부위에 미해결 기록이 여러 개면 가장 최근 것을 우선 */
function byRecency(a: SymptomRecord, b: SymptomRecord) {
  return b.record_date.localeCompare(a.record_date) || b.created_at.localeCompare(a.created_at)
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

  // 홈 바디맵은 날짜와 무관하게 '미해결(진행중)' 증상만 표시
  const activeRecords = useMemo(() => records.filter((r) => !r.resolved_at), [records])

  const { severityMap, noteMap } = useMemo(() => {
    const severity: Partial<Record<BodyPartCode, Severity>> = {}
    const notes: Partial<Record<BodyPartCode, string>> = {}
    for (const r of [...activeRecords].sort(byRecency)) {
      if (severity[r.body_part_code] === undefined) {
        severity[r.body_part_code] = r.severity
        notes[r.body_part_code] = r.note ?? ''
      }
    }
    return { severityMap: severity, noteMap: notes }
  }, [activeRecords])

  /** 해당 부위의 진행중 기록 중 가장 최근 것 */
  const findActive = useCallback(
    (code: BodyPartCode) =>
      activeRecords.filter((r) => r.body_part_code === code).sort(byRecency)[0],
    [activeRecords],
  )

  const handleSaveSymptom = useCallback(
    async (code: BodyPartCode, severity: Severity, note: string) => {
      const existing = findActive(code)
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
    [findActive, userId],
  )

  const handleResolveSymptom = useCallback(
    async (code: BodyPartCode) => {
      const existing = findActive(code)
      if (!existing) return
      try {
        const updated = await resolveRecord(existing.id, userId!, true)
        setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      } catch (e) {
        console.error('증상 해결 처리 실패:', e)
      }
    },
    [findActive, userId],
  )

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  const activeCount = Object.keys(severityMap).length

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>내 몸 지도</Text>
          <Text style={styles.headerSub}>
            {activeCount > 0 ? `진행중인 증상 ${activeCount}곳` : '진행중인 증상 없음'}
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

      <BodyMapView
        severityMap={severityMap}
        noteMap={noteMap}
        onSaveSymptom={handleSaveSymptom}
        onResolveSymptom={handleResolveSymptom}
      />
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
