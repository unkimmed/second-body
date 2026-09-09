import { View, TouchableOpacity } from 'react-native'
import { Text } from './Text'
import { SymptomRecord } from '@second-body/shared'
import { BODY_PART_LABELS, SEVERITY_LABELS } from '../constants/symptom'

interface Props {
  record: SymptomRecord
  onPress: () => void
  onResolve?: (resolved: boolean) => void
}

export function RecordCard({ record, onPress, onResolve }: Props) {
  const isResolved = !!record.resolved_at

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-surface-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center">
        <View className="flex-1 p-4 gap-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-xs font-semibold text-on-surface">{record.record_date}</Text>
            {isResolved && (
              <View className="bg-primary/10 border border-primary rounded-full px-2 py-0.5">
                <Text className="text-primary text-[10px] font-semibold">해결됨</Text>
              </View>
            )}
          </View>
          <Text
            className={`text-xs ${isResolved ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}
          >
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

        {onResolve && (
          <TouchableOpacity
            onPress={() => onResolve(!isResolved)}
            hitSlop={8}
            activeOpacity={0.7}
            className={`mr-4 px-3 py-1.5 rounded-full border ${
              isResolved ? 'border-outline-variant' : 'border-primary'
            }`}
          >
            <Text
              className={`text-[11px] font-semibold ${
                isResolved ? 'text-on-surface-variant' : 'text-primary'
              }`}
            >
              {isResolved ? '되돌리기' : '해결'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )
}
