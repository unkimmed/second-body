import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Text } from "../components/Text";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { RecordCard } from "../components/RecordCard";
import { SymptomRecord } from "@second-body/shared";
import { Colors } from "../constants/theme";
import { useAuth } from "../lib/AuthContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001/api";

export default function HomeScreen() {
  const router = useRouter();
  const { userId, signOut } = useAuth();
  const [records, setRecords] = useState<SymptomRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchRecords();
  }, [userId]);

  async function fetchRecords() {
    try {
      const res = await fetch(`${API_URL}/records`, {
        headers: { "x-user-id": userId! },
      });
      const data = await res.json();
      setRecords(data as SymptomRecord[]);
    } catch (e) {
      console.error("기록 목록 불러오기 실패:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-lowest">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <View className="bg-primary px-5 pb-6 pt-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-surface text-2xl font-bold">내 증상 기록</Text>
          <TouchableOpacity onPress={signOut}>
            <Text className="text-surface/70 text-sm">로그아웃</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-on-surface-variant mt-1">
          총 {records.length}개의 기록
        </Text>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecordCard
            record={item}
            onPress={() => router.push(`/records/${item.id}`)}
          />
        )}
        contentContainerClassName="p-4 gap-3"
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-on-surface-variant text-lg">
              아직 기록된 증상이 없어요
            </Text>
            <Text className="text-on-surface-variant mt-1">
              아래 버튼으로 첫 증상을 기록해보세요!
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        className="absolute bottom-8 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push("/records/new")}
      >
        <Text className="text-surface text-3xl leading-none">+</Text>
      </TouchableOpacity>
    </View>
  );
}
