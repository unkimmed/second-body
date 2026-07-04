import { View, ScrollView, ActivityIndicator } from 'react-native'
import { Text } from '@/components/Text'
import { Colors } from '@/constants/theme'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { SymptomRecord } from '@second-body/shared'
import { useAuth } from '@/lib/AuthContext'
import { fetchRecords } from '../api/records'
import { RecordCard } from '@/components/RecordCard'

export default function RecordsScreen() {
  const router = useRouter()
  const { userId } = useAuth()
  const [records, setRecords] = useState<SymptomRecord[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      if (!userId) return
      setLoading(true)
      fetchRecords(userId)
        .then((data) => {
          const sorted = [...data].sort((a, b) => b.record_date.localeCompare(a.record_date))
          setRecords(sorted)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }, [userId]),
  )

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-lowest">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-surface-lowest">
      <View className="px-5 py-6 ">
        <Text style={{ color: Colors.onSurface }} className="text-l font-bold">
          증상 기록
        </Text>
        <Text style={{ color: Colors.onSurfaceVariant }} className="mt-1 text-xs">
          {records.length > 0 ? `총 ${records.length}개의 기록` : '기록 없음'}
        </Text>
      </View>

      <View className="px-5 gap-3">
        {records.length === 0 ? (
          <View className="bg-surface-low rounded-2xl p-8 items-center">
            <Text className="text-on-surface-variant text-sm">아직 기록된 증상이 없습니다.</Text>
          </View>
        ) : (
          records.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              onPress={() => router.push(`/records/${record.id}`)}
            />
          ))
        )}
      </View>
    </ScrollView>
  )
}
