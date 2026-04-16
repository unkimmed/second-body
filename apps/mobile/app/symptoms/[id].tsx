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
import { Symptom } from "@second-body/shared";
import { BODY_PART_LABELS, SEVERITY_COLOR } from "../../constants/symptom";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api";
const TEMP_USER_ID = "user-001";

export default function SymptomDetailScreen() {
  /**
   * useLocalSearchParams → Next.js의 useParams()와 동일
   * 파일 이름 [id].tsx의 id 값을 가져옴
   */
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [symptom, setSymptom] = useState<Symptom | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/symptoms/${id}`, {
      headers: { "x-user-id": TEMP_USER_ID },
    })
      .then((r) => r.json())
      .then((data) => setSymptom(data as Symptom))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    Alert.alert("삭제 확인", "이 증상 기록을 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          await fetch(`${API_URL}/symptoms/${id}`, {
            method: "DELETE",
            headers: { "x-user-id": TEMP_USER_ID },
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

  if (!symptom) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-on-surface-variant">증상을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-surface-lowest">
      {/* 심각도 컬러 배너 */}
      <View className={`px-5 py-6 ${SEVERITY_COLOR[symptom.severity]}`}>
        <Text className="text-surface text-3xl font-bold">{symptom.title}</Text>
        <Text className="text-surface/80 mt-1">{symptom.date}</Text>
      </View>

      <View className="p-5 gap-4">
        {/* 메타 정보 */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-surface-low rounded-xl p-4">
            <Text className="text-xs text-on-surface-variant mb-1">신체 부위</Text>
            <Text className="text-base font-semibold text-on-surface">
              {BODY_PART_LABELS[symptom.body_part]}
            </Text>
          </View>
          <View className="flex-1 bg-surface-low rounded-xl p-4">
            <Text className="text-xs text-on-surface-variant mb-1">심각도</Text>
            <Text className="text-base font-semibold text-on-surface">
              {symptom.severity} / 5
            </Text>
          </View>
        </View>

        {/* 상세 설명 */}
        <View className="bg-surface-low rounded-xl p-4">
          <Text className="text-xs text-on-surface-variant mb-2">상세 설명</Text>
          <Text className="text-base text-on-surface leading-relaxed">
            {symptom.description}
          </Text>
        </View>

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
