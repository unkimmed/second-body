import { View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { Text } from '@/components/Text'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  BODY_PART_CODES,
  BodyPartCode,
  CreateSymptomDetailDto,
  Severity,
} from '@second-body/shared'
import { BODY_PART_LABELS, SEVERITY_LABELS, SEVERITY_COLOR } from '@/constants/symptom'
import { useAuth } from '@/lib/AuthContext'
import { createRecord } from '../api/records'

export default function NewRecordScreen() {
  const router = useRouter()
  const { userId } = useAuth()
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0])
  const [overallNote, setOverallNote] = useState('')
  const [details, setDetails] = useState<CreateSymptomDetailDto[]>([])

  // 현재 추가 중인 부위
  const [pendingCode, setPendingCode] = useState<BodyPartCode | null>(null)
  const [pendingSeverity, setPendingSeverity] = useState<Severity>(3)
  const [pendingNote, setPendingNote] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function addDetail() {
    if (!pendingCode) {
      Alert.alert('입력 오류', '신체 부위를 선택해주세요.')
      return
    }
    if (details.some((d) => d.body_part_code === pendingCode)) {
      Alert.alert('중복', '이미 추가된 부위입니다.')
      return
    }
    setDetails((prev) => [
      ...prev,
      { body_part_code: pendingCode, severity: pendingSeverity, note: pendingNote || undefined },
    ])
    setPendingCode(null)
    setPendingSeverity(3)
    setPendingNote('')
  }

  function removeDetail(code: BodyPartCode) {
    setDetails((prev) => prev.filter((d) => d.body_part_code !== code))
  }

  async function handleSubmit() {
    setErrorMessage(null)

    if (details.length === 0) {
      setErrorMessage('최소 한 개의 신체 부위를 추가해주세요.')
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
        overall_note: overallNote || undefined,
        details,
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        setErrorMessage(`저장 실패 (${res.status}): ${text || '원인 불명'}`)
        return
      }

      router.back()
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
      contentContainerClassName="p-5 gap-5"
      keyboardShouldPersistTaps="handled"
    >
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

      {/* 전체 메모 */}
      <View>
        <Text className="text-sm font-medium text-on-surface-variant mb-1">전체 메모 (선택)</Text>
        <TextInput
          className="border border-outline-variant rounded-xl px-4 py-3 text-base bg-surface-low"
          value={overallNote}
          onChangeText={setOverallNote}
          placeholder="오늘 컨디션을 자유롭게 기록해보세요"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* 추가된 부위 목록 */}
      {details.length > 0 && (
        <View>
          <Text className="text-sm font-medium text-on-surface-variant mb-2">
            추가된 부위 ({details.length})
          </Text>
          <View className="gap-2">
            {details.map((d) => (
              <View
                key={d.body_part_code}
                className="flex-row items-center bg-surface-low rounded-xl px-4 py-3"
              >
                <View className={`w-2 h-2 rounded-full mr-3 ${SEVERITY_COLOR[d.severity]}`} />
                <Text className="flex-1 text-sm text-on-surface font-medium">
                  {BODY_PART_LABELS[d.body_part_code]}
                </Text>
                <Text className="text-xs text-on-surface-variant mr-3">
                  {SEVERITY_LABELS[d.severity]}
                </Text>
                <TouchableOpacity onPress={() => removeDetail(d.body_part_code)}>
                  <Text className="text-danger text-base">✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 부위 추가 */}
      <View className="bg-surface-low rounded-2xl p-4 gap-4">
        <Text className="text-sm font-semibold text-on-surface">부위 추가</Text>

        {/* 신체 부위 선택 */}
        <View>
          <Text className="text-xs text-on-surface-variant mb-2">신체 부위</Text>
          <View className="flex-row flex-wrap gap-2">
            {BODY_PART_CODES.map((code) => {
              const alreadyAdded = details.some((d) => d.body_part_code === code)
              const isSelected = pendingCode === code
              return (
                <TouchableOpacity
                  key={code}
                  disabled={alreadyAdded}
                  onPress={() => setPendingCode(isSelected ? null : code)}
                  className={`px-3 py-1.5 rounded-full border ${
                    isSelected
                      ? 'bg-primary border-primary'
                      : alreadyAdded
                        ? 'bg-surface-high border-surface-high opacity-40'
                        : 'bg-surface-lowest border-outline-variant'
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      isSelected ? 'text-surface font-medium' : 'text-on-surface-variant'
                    }`}
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
          <Text className="text-xs text-on-surface-variant mb-2">
            심각도: <Text className="text-primary">{SEVERITY_LABELS[pendingSeverity]}</Text>
          </Text>
          <View className="flex-row gap-2">
            {([1, 2, 3, 4, 5] as Severity[]).map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setPendingSeverity(s)}
                className={`flex-1 py-2.5 rounded-xl items-center ${
                  pendingSeverity === s ? 'bg-primary' : 'bg-surface-high'
                }`}
              >
                <Text
                  className={
                    pendingSeverity === s
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

        {/* 부위 메모 */}
        <View>
          <Text className="text-xs text-on-surface-variant mb-1">메모 (선택)</Text>
          <TextInput
            className="border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface-lowest"
            value={pendingNote}
            onChangeText={setPendingNote}
            placeholder="예: 아침부터 욱신거림"
          />
        </View>

        <TouchableOpacity onPress={addDetail} className="bg-primary py-3 rounded-xl items-center">
          <Text className="text-surface text-sm font-semibold">+ 부위 추가</Text>
        </TouchableOpacity>
      </View>

      {/* 에러 메시지 */}
      {errorMessage && (
        <View className="bg-red-50 border border-red-200 rounded-xl p-3">
          <Text className="text-danger text-sm">{errorMessage}</Text>
        </View>
      )}

      {/* 저장 버튼 */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={submitting}
        className={`py-4 rounded-2xl items-center mt-2 ${
          submitting ? 'opacity-50 bg-primary' : 'bg-primary'
        }`}
      >
        <Text className="text-surface text-base font-bold">
          {submitting ? '저장 중...' : '기록 저장'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
