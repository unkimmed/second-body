import { View, TextInput, TouchableOpacity } from 'react-native'
import { Text } from '@/components/Text'
import { BODY_PART_CODES, BodyPartCode, Severity } from '@second-body/shared'
import { BODY_PART_LABELS, SEVERITY_COLOR, SEVERITY_LABELS } from '@/constants/symptom'

type Props = {
  bodyPartCode: BodyPartCode | null
  onBodyPartChange: (code: BodyPartCode) => void
  severity: Severity
  onSeverityChange: (s: Severity) => void
  note: string
  onNoteChange: (n: string) => void
}

export function RecordEditForm({
  bodyPartCode,
  onBodyPartChange,
  severity,
  onSeverityChange,
  note,
  onNoteChange,
}: Props) {
  return (
    <>
      <View>
        <Text className="text-sm font-medium text-on-surface-variant mb-2">신체 부위</Text>
        <View className="flex-row flex-wrap gap-2">
          {BODY_PART_CODES.map((code) => {
            const isSelected = bodyPartCode === code
            return (
              <TouchableOpacity
                key={code}
                onPress={() => onBodyPartChange(code)}
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

      <View>
        <Text className="text-sm font-medium text-on-surface-variant mb-2">
          심각도: <Text className="text-primary">{SEVERITY_LABELS[severity]}</Text>
        </Text>
        <View className="flex-row gap-2">
          {([1, 2, 3, 4, 5] as Severity[]).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => onSeverityChange(s)}
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

      <View>
        <Text className="text-sm font-medium text-on-surface-variant mb-1">메모 (선택)</Text>
        <TextInput
          className="border border-outline-variant rounded-xl px-4 py-3 text-base bg-surface-low"
          value={note}
          onChangeText={onNoteChange}
          placeholder="예: 아침부터 욱신거림"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>
    </>
  )
}
