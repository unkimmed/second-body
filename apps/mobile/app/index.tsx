import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { Text } from '../components/Text'
import { useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { SymptomRecord, BodyPartCode, Severity } from '@second-body/shared'
import { Colors } from '../constants/theme'
import { useAuth } from '../lib/AuthContext'
import { BodyMapView } from './components/bodyMap'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api'

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

export default function HomeScreen() {
  const router = useRouter()
  const { userId, signOut } = useAuth()
  const [records, setRecords] = useState<SymptomRecord[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      if (userId) fetchRecords()
    }, [userId]),
  )

  async function fetchRecords() {
    try {
      const res = await fetch(`${API_URL}/records`, {
        headers: { 'x-user-id': userId! },
      })
      const data = await res.json()
      setRecords(data as SymptomRecord[])
    } catch (e) {
      console.error('기록 목록 불러오기 실패:', e)
    } finally {
      setLoading(false)
    }
  }

  // Today's record derived from the record list
  const todayRecord = useMemo(
    () => records.find((r) => r.record_date === todayString()) ?? null,
    [records],
  )

  const severityMap = useMemo<Partial<Record<BodyPartCode, Severity>>>(() => {
    if (!todayRecord?.details) return {}
    return Object.fromEntries(todayRecord.details.map((d) => [d.body_part_code, d.severity]))
  }, [todayRecord])

  const handleSaveSymptom = useCallback(
    async (code: BodyPartCode, severity: Severity, note: string) => {
      const today = todayString()
      try {
        if (!todayRecord) {
          // Create a new record for today
          const res = await fetch(`${API_URL}/records`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': userId!,
            },
            body: JSON.stringify({
              record_date: today,
              details: [{ body_part_code: code, severity, note: note || undefined }],
            }),
          })
          const created = await res.json()
          setRecords((prev) => [created, ...prev])
        } else {
          // Merge into existing record (replace same body part, keep others)
          const existingDetails = (todayRecord.details ?? []).filter(
            (d) => d.body_part_code !== code,
          )
          const newDetails = [
            ...existingDetails.map((d) => ({
              body_part_code: d.body_part_code,
              severity: d.severity,
              note: d.note,
            })),
            { body_part_code: code, severity, note: note || undefined },
          ]
          const res = await fetch(`${API_URL}/records/${todayRecord.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': userId!,
            },
            body: JSON.stringify({ details: newDetails }),
          })
          const updated = await res.json()
          setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
        }
      } catch (e) {
        console.error('증상 저장 실패:', e)
      }
    },
    [todayRecord, userId],
  )

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  const today = todayString()
  const recordedCount = todayRecord?.details?.length ?? 0

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
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

      {/* Body map — fills the rest of the screen */}
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
    paddingTop: 16,
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
