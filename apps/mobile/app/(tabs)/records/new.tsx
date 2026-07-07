import { View, TextInput, TouchableOpacity, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@/components/Text'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { BODY_PART_CODES, BodyPartCode, Severity } from '@second-body/shared'
import { BODY_PART_LABELS, SEVERITY_LABELS, SEVERITY_COLOR } from '@/constants/symptom'
import { useAuth } from '@/lib/AuthContext'
import { createRecord } from '@/app/api/records'

export default function NewRecordScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { userId } = useAuth()
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0])
  const [bodyPartCode, setBodyPartCode] = useState<BodyPartCode | null>(null)
  const [severity, setSeverity] = useState<Severity>(3)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit() {
    setErrorMessage(null)

    if (!bodyPartCode) {
      setErrorMessage('신체 부위를 선택해주세요.')
      return
    }
    if (!userId) {
      setErrorMessage('로그인이 필요합니다. 다시 로그인해주세요.')
      return
    }

    setSubmitting(true)
    try {
      const res = await createRecord(userId, {
        record_date: recordDate,
        body_part_code: bodyPartCode,
        severity,
        note: note || undefined,
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        setErrorMessage(`저장 실패 (${res.status}): ${text || '원인 불명'}`)
        return
      }

      router.navigate('/')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setErrorMessage(`네트워크 오류: ${msg}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-surface-lowest"
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingHorizontal: 20,
        paddingBottom: 24,
        gap: 20,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-xl font-bold text-on-surface">증상 기록하기</Text>

      {/* 날짜 */}
      <View>
        <Text className="text-sm font-medium text-on-surface-variant mb-1">날짜</Text>
        <TextInput
          className="border border-outline-variant rounded-xl px-4 py-3 text-base bg-surface-low"
          value={recordDate}
          onChangeText={setRecordDate}
          placeholder="YYYY-MM-DD"
        />
      </View>

      {/* 신체 부위 선택 */}
      <View>
        <Text className="text-sm font-medium text-on-surface-variant mb-2">신체 부위</Text>
        <View className="flex-row flex-wrap gap-2">
          {BODY_PART_CODES.map((code) => {
            const isSelected = bodyPartCode === code
            return (
              <TouchableOpacity
                key={code}
                onPress={() => setBodyPartCode(isSelected ? null : code)}
                className={`px-3 py-1.5 rounded-full border ${
                  isSelected
                    ? 'bg-primary border-primary'
                    : 'bg-surface-lowest border-outline-variant'
                }`}
              >
                <Text
                  className={`text-xs ${isSelected ? 'text-surface font-medium' : 'text-on-surface-variant'}`}
                >
                  {BODY_PART_LABELS[code]}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* 심각도 */}
      <View>
        <Text className="text-sm font-medium text-on-surface-variant mb-2">
          심각도: <Text className="text-primary">{SEVERITY_LABELS[severity]}</Text>
        </Text>
        <View className="flex-row gap-2">
          {([1, 2, 3, 4, 5] as Severity[]).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSeverity(s)}
              className={`flex-1 py-2.5 rounded-xl items-center ${
                severity === s ? SEVERITY_COLOR[s] : 'bg-surface-high'
              }`}
            >
              <Text
                className={
                  severity === s
                    ? 'text-surface font-bold text-sm'
                    : 'text-on-surface-variant text-sm'
                }
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 메모 */}
      <View>
        <Text className="text-sm font-medium text-on-surface-variant mb-1">메모 (선택)</Text>
        <TextInput
          className="border border-outline-variant rounded-xl px-4 py-3 text-base bg-surface-low"
          value={note}
          onChangeText={setNote}
          placeholder="예: 아침부터 욱신거림"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {errorMessage && (
        <View className="bg-red-50 border border-red-200 rounded-xl p-3">
          <Text className="text-danger text-sm">{errorMessage}</Text>
        </View>
      )}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={submitting}
        className={`py-4 rounded-2xl items-center mt-2 ${submitting ? 'opacity-50 bg-primary' : 'bg-primary'}`}
      >
        <Text className="text-surface text-base font-bold">
          {submitting ? '저장 중...' : '기록 저장'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
