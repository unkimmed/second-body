import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Text } from "../../components/Text";
import { useRouter } from "expo-router";
import { useState } from "react";
import { BodyPart, CreateSymptomDto, Severity } from "@second-body/shared";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api";
const TEMP_USER_ID = "user-001";

const BODY_PARTS: { value: BodyPart; label: string }[] = [
  { value: "head", label: "머리" },
  { value: "chest", label: "가슴" },
  { value: "abdomen", label: "복부" },
  { value: "back", label: "허리/등" },
  { value: "arm", label: "팔" },
  { value: "leg", label: "다리" },
  { value: "skin", label: "피부" },
  { value: "other", label: "기타" },
];

const SEVERITY_LABELS: Record<Severity, string> = {
  1: "1 - 거의 없음",
  2: "2 - 약함",
  3: "3 - 보통",
  4: "4 - 강함",
  5: "5 - 매우 심함",
};

export default function NewSymptomScreen() {
  const router = useRouter();
  const [form, setForm] = useState<Partial<CreateSymptomDto>>({
    date: new Date().toISOString().split("T")[0], // 오늘 날짜 기본값
    severity: 3,
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!form.body_part || !form.title || !form.description) {
      Alert.alert("입력 오류", "모든 항목을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/symptoms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": TEMP_USER_ID,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("저장 실패");
      Alert.alert("저장 완료", "증상이 기록되었습니다.", [
        { text: "확인", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("오류", "저장 중 문제가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    /**
     * ScrollView → Next.js의 일반 페이지처럼 스크롤 가능한 컨테이너
     * 키보드가 올라올 때 입력 필드가 가려지지 않도록 keyboardShouldPersistTaps 설정
     */
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="p-5 gap-5"
      keyboardShouldPersistTaps="handled"
    >
      {/* 날짜 */}
      <View>
        <Text className="text-sm font-medium text-gray-600 mb-1">날짜</Text>
        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50"
          value={form.date}
          onChangeText={(v) => setForm((p) => ({ ...p, date: v }))}
          placeholder="YYYY-MM-DD"
        />
      </View>

      {/* 신체 부위 선택 */}
      <View>
        <Text className="text-sm font-medium text-gray-600 mb-2">
          신체 부위
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {BODY_PARTS.map(({ value, label }) => (
            <TouchableOpacity
              key={value}
              onPress={() => setForm((p) => ({ ...p, body_part: value }))}
              className={`px-4 py-2 rounded-full border ${
                form.body_part === value
                  ? "bg-primary border-primary"
                  : "bg-white border-gray-200"
              }`}
            >
              <Text
                className={`text-sm ${
                  form.body_part === value
                    ? "text-white font-medium"
                    : "text-gray-600"
                }`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 심각도 */}
      <View>
        <Text className="text-sm font-medium text-gray-600 mb-2">
          심각도:{" "}
          <Text className="text-primary">
            {SEVERITY_LABELS[form.severity as Severity]}
          </Text>
        </Text>
        <View className="flex-row gap-2">
          {([1, 2, 3, 4, 5] as Severity[]).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setForm((p) => ({ ...p, severity: s }))}
              className={`flex-1 py-3 rounded-xl items-center ${
                form.severity === s ? "bg-primary" : "bg-gray-100"
              }`}
            >
              <Text
                className={
                  form.severity === s ? "text-white font-bold" : "text-gray-500"
                }
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 제목 */}
      <View>
        <Text className="text-sm font-medium text-gray-600 mb-1">
          증상 제목
        </Text>
        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50"
          value={form.title}
          onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
          placeholder="예: 두통, 복통, 무릎 통증"
        />
      </View>

      {/* 상세 설명 */}
      <View>
        <Text className="text-sm font-medium text-gray-600 mb-1">
          상세 설명
        </Text>
        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50"
          value={form.description}
          onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
          placeholder="어떤 상황에서 발생했는지, 어떤 느낌인지 기록해보세요"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* 저장 버튼 */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={submitting}
        className={`py-4 rounded-2xl items-center mt-2 ${
          submitting ? "bg-indigo-300" : "bg-primary"
        }`}
      >
        <Text className="text-white text-base font-bold">
          {submitting ? "저장 중..." : "증상 기록 저장"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
