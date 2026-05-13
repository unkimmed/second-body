import { useMemo } from "react";
import { View } from "react-native";
import { BodyPartCode, Severity, SymptomRecord } from "@second-body/shared";
import { Text } from "../Text";
import { SEVERITY_FILL } from "../../constants/bodyMapLayout";
import { SEVERITY_LABELS } from "../../constants/symptom";

type Props = {
  records: SymptomRecord[];
  activePart: BodyPartCode | null;
};

type Item = {
  recordId: string;
  detailId: string;
  date: string;
  severity: Severity;
  note: string | null;
};

export function PartRecordList({ records, activePart }: Props) {
  const items = useMemo<Item[]>(() => {
    if (!activePart) return [];
    const out: Item[] = [];
    for (const r of records) {
      for (const d of r.details ?? []) {
        if (d.body_part_code !== activePart) continue;
        out.push({
          recordId: r.id,
          detailId: d.id,
          date: r.record_date,
          severity: d.severity,
          note: d.note ?? null,
        });
      }
    }
    out.sort((a, b) => b.date.localeCompare(a.date));
    return out;
  }, [records, activePart]);

  if (items.length === 0) {
    // 빈 상태: 안내 텍스트 없이 비워둠 (기획 §빈 상태 항목)
    return <View />;
  }

  return (
    <View>
      {items.map((item) => (
        <View
          key={item.detailId}
          className="flex-row items-center py-3"
          style={{ borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}
        >
          <Text className="text-on-surface text-sm" style={{ width: 86 }}>
            {item.date}
          </Text>
          <View className="flex-row items-center" style={{ width: 96 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: SEVERITY_FILL[item.severity],
                marginRight: 6,
              }}
            />
            <Text className="text-on-surface text-sm">
              {SEVERITY_LABELS[item.severity]}
            </Text>
          </View>
          {item.note ? (
            <Text
              className="text-on-surface-variant text-sm flex-1"
              numberOfLines={1}
            >
              {item.note}
            </Text>
          ) : (
            <View style={{ flex: 1 }} />
          )}
        </View>
      ))}
    </View>
  );
}
