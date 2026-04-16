import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Text } from "../components/Text";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SymptomCard } from "../components/SymptomCard";
import { Symptom } from "@second-body/shared";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api";

// 임시 유저 ID (나중에 Supabase Auth로 교체)
const TEMP_USER_ID = "user-001";

export default function HomeScreen() {
  const router = useRouter();
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSymptoms();
  }, []);

  async function fetchSymptoms() {
    try {
      const res = await fetch(`${API_URL}/symptoms`, {
        headers: { "x-user-id": TEMP_USER_ID },
      });
      const data = await res.json();
      setSymptoms(data as Symptom[]);
    } catch (e) {
      console.error("증상 목록 불러오기 실패:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    /**
     * React Native에는 div, p, span 대신:
     * - View  → div (레이아웃 컨테이너)
     * - Text  → p, span (텍스트는 반드시 Text 안에)
     * - FlatList → 긴 목록 (virtualized, 브라우저의 ul/li와 달리 성능 최적화)
     * - TouchableOpacity → button (누르면 투명도 효과)
     */
    <View className="flex-1 bg-gray-50">
      {/* 헤더 요약 */}
      <View className="bg-primary px-5 pb-6 pt-4">
        <Text className="text-white text-2xl font-bold">내 증상 기록</Text>
        <Text className="text-indigo-200 mt-1">
          총 {symptoms.length}개의 기록
        </Text>
      </View>

      {/* 증상 목록 */}
      <FlatList
        data={symptoms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SymptomCard
            symptom={item}
            onPress={() => router.push(`/symptoms/${item.id}`)}
          />
        )}
        contentContainerClassName="p-4 gap-3"
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-gray-400 text-lg">
              아직 기록된 증상이 없어요
            </Text>
            <Text className="text-gray-400 mt-1">
              아래 버튼으로 첫 증상을 기록해보세요!
            </Text>
          </View>
        }
      />

      {/* 새 증상 기록 버튼 (우측 하단 고정) */}
      <TouchableOpacity
        className="absolute bottom-8 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push("/symptoms/new")}
      >
        <Text className="text-white text-3xl leading-none">+</Text>
      </TouchableOpacity>
    </View>
  );
}
