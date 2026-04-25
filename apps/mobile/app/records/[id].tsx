import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Text } from "../../components/Text";
import { Colors } from "../../constants/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SymptomRecord, Severity } from "@second-body/shared";
import {
  BODY_PART_LABELS,
  SEVERITY_COLOR,
  SEVERITY_LABELS,
} from "../../constants/symptom";
import { useAuth } from "../../lib/AuthContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001/api";

export default function RecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useAuth();
  const [record, setRecord] = useState<SymptomRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_URL}/records/${id}`, {
      headers: { "x-user-id": userId },
    })
      .then((r) => r.json())
      .then((data) => setRecord(data as SymptomRecord))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    Alert.alert("삭제 확인", "이 기록을 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          await fetch(`${API_URL}/records/${id}`, {
            method: "DELETE",
            headers: { "x-user-id": userId! },
          });
          router.back();
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!record) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-on-surface-variant">기록을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const maxSeverity = record.details?.length
    ? (Math.max(...record.details.map((d) => d.severity)) as Severity)
    : null;

  return (
    <ScrollView className="flex-1 bg-surface-lowest">
      {/* 헤더 배너 */}
      <View
        className={`px-5 py-6 ${maxSeverity ? SEVERITY_COLOR[maxSeverity] : "bg-primary"}`}
      >
        <Text className="text-surface text-3xl font-bold">{record.record_date}</Text>
        {record.overall_note ? (
          <Text className="text-surface/80 mt-1">{record.overall_note}</Text>
        ) : null}
      </View>

      <View className="p-5 gap-4">
        {/* 부위별 증상 목록 */}
        {record.details && record.details.length > 0 ? (
          <View>
            <Text className="text-sm font-semibold text-on-surface-variant mb-2">
              부위별 증상 ({record.details.length}개)
            </Text>
            <View className="gap-2">
              {record.details.map((d) => (
                <View
                  key={d.id}
                  className="bg-surface-low rounded-xl overflow-hidden"
                >
                  <View className="flex-row">
                    <View className={`w-1 ${SEVERITY_COLOR[d.severity]}`} />
                    <View className="flex-1 p-3">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm font-semibold text-on-surface">
                          {BODY_PART_LABELS[d.body_part_code]}
                        </Text>
                        <Text className="text-xs text-on-surface-variant">
                          {d.severity}/5 · {SEVERITY_LABELS[d.severity]}
                        </Text>
                      </View>
                      {d.note ? (
                        <Text className="text-xs text-on-surface-variant mt-1">
                          {d.note}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View className="bg-surface-low rounded-xl p-4 items-center">
            <Text className="text-on-surface-variant text-sm">
              기록된 부위 증상이 없습니다.
            </Text>
          </View>
        )}

        {/* 삭제 버튼 */}
        <TouchableOpacity
          onPress={handleDelete}
          className="border border-red-200 py-4 rounded-2xl items-center mt-4"
        >
          <Text className="text-danger font-medium">기록 삭제</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
