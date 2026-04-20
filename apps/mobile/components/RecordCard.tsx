import { View, TouchableOpacity } from "react-native";
import { Text } from "./Text";
import { SymptomRecord, Severity } from "@second-body/shared";
import { BODY_PART_LABELS, SEVERITY_COLOR } from "../constants/symptom";

interface Props {
  record: SymptomRecord;
  onPress: () => void;
}

export function RecordCard({ record, onPress }: Props) {
  const maxSeverity = record.details?.length
    ? (Math.max(...record.details.map((d) => d.severity)) as Severity)
    : undefined;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-surface-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden"
      activeOpacity={0.7}
    >
      <View className="flex-row">
        <View
          className={`w-1.5 ${maxSeverity ? SEVERITY_COLOR[maxSeverity] : "bg-surface-high"}`}
        />
        <View className="flex-1 p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-on-surface">
              {record.record_date}
            </Text>
            {record.details && record.details.length > 0 && (
              <Text className="text-xs text-on-surface-variant">
                {record.details.length}개 부위
              </Text>
            )}
          </View>

          {record.details && record.details.length > 0 && (
            <View className="flex-row flex-wrap gap-1 mt-2">
              {record.details.slice(0, 3).map((d) => (
                <View key={d.id} className="bg-surface-low px-2 py-0.5 rounded-full">
                  <Text className="text-xs text-primary font-medium">
                    {BODY_PART_LABELS[d.body_part_code]}
                  </Text>
                </View>
              ))}
              {record.details.length > 3 && (
                <Text className="text-xs text-on-surface-variant self-center">
                  +{record.details.length - 3}
                </Text>
              )}
            </View>
          )}

          {record.overall_note ? (
            <Text
              className="text-sm text-on-surface-variant mt-2"
              numberOfLines={1}
            >
              {record.overall_note}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}
