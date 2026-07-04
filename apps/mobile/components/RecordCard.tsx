import { View, TouchableOpacity } from 'react-native'
import { Text } from './Text'
import { SymptomRecord } from '@second-body/shared'
import { BODY_PART_LABELS, SEVERITY_COLOR, SEVERITY_LABELS } from '../constants/symptom'

interface Props {
  record: SymptomRecord
  onPress: () => void
}

export function RecordCard({ record, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-surface-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden"
      activeOpacity={0.7}
    >
      <View className="flex-row">
        <View className="flex-1 p-4 gap-1">
          <Text className="text-xs font-semibold text-on-surface">{record.record_date}</Text>
          <Text className="text-xs text-on-surface">
            {BODY_PART_LABELS[record.body_part_code]}
            <Text className="text-xs text-on-surface-variant">
              {' '}
              · {SEVERITY_LABELS[record.severity]}
            </Text>
          </Text>
          {record.note ? (
            <Text className="text-xs text-on-surface-variant" numberOfLines={1}>
              {record.note}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  )
}
