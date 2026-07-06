import { View } from 'react-native'
import { Text } from '@/components/Text'
import { BodyPartCode, Severity } from '@second-body/shared'
import { BODY_PART_LABELS, SEVERITY_LABELS } from '@/constants/symptom'

type Props = {
  bodyPartCode: BodyPartCode
  severity: Severity
  note?: string | null
}

export function RecordDetailCard({ bodyPartCode, severity, note }: Props) {
  return (
    <View className="rounded overflow-hidden border border-outline-variant">
      <View className="flex-row border-b border-outline-variant">
        <View className="w-20 p-4 bg-surface justify-center">
          <Text className="text-xs text-on-surface-variant">증상부위</Text>
        </View>
        <View className="flex-1 p-4 justify-center">
          <Text className="text-xs text-on-surface">{BODY_PART_LABELS[bodyPartCode]}</Text>
        </View>
      </View>
      <View className="flex-row border-b border-outline-variant">
        <View className="w-20 p-4 bg-surface justify-center">
          <Text className="text-xs text-on-surface-variant">심각도</Text>
        </View>
        <View className="flex-1 p-4 justify-center">
          <Text className="text-xs text-on-surface">
            {severity}/5 · {SEVERITY_LABELS[severity]}
          </Text>
        </View>
      </View>
      <View className="flex-row">
        <View className="w-20 p-4 bg-surface">
          <Text className="text-xs text-on-surface-variant">메모</Text>
        </View>
        <View className="flex-1 p-4">
          <Text className="text-xs text-on-surface-variant">{note || '없음'}</Text>
        </View>
      </View>
    </View>
  )
}
