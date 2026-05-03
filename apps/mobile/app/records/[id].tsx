import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_URL}/records/${id}`, {
      headers: { "x-user-id": userId },
    })
      .then((r) => r.json())
      .then((data) => setRecord(data as SymptomRecord))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, userId]);

  async function confirmDelete() {
    setErrorMessage(null);
    if (!userId) {
      setErrorMessage("로그인이 필요합니다. 다시 로그인해주세요.");
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/records/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setErrorMessage(`삭제 실패 (${res.status}): ${text || "원인 불명"}`);
        return;
      }
      setConfirmOpen(false);
      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMessage(`네트워크 오류: ${msg}`);
    } finally {
      setDeleting(false);
    }
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

        {/* 에러 메시지 */}
        {errorMessage && (
          <View className="bg-red-50 border border-red-200 rounded-xl p-3">
            <Text className="text-danger text-sm">{errorMessage}</Text>
          </View>
        )}

        {/* 삭제 버튼 */}
        <TouchableOpacity
          onPress={() => setConfirmOpen(true)}
          className="border border-red-200 py-4 rounded-2xl items-center mt-4"
        >
          <Text className="text-danger font-medium">기록 삭제</Text>
        </TouchableOpacity>
      </View>

      {/* 삭제 확인 모달 */}
      <Modal
        visible={confirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !deleting && setConfirmOpen(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-surface-lowest w-full max-w-sm rounded-2xl p-5 gap-4">
            <Text className="text-lg font-bold text-on-surface">삭제 확인</Text>
            <Text className="text-sm text-on-surface-variant">
              이 기록을 정말 삭제할까요? 이 작업은 되돌릴 수 없습니다.
            </Text>
            <View className="flex-row gap-2 mt-2">
              <TouchableOpacity
                onPress={() => setConfirmOpen(false)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl items-center bg-surface-high"
              >
                <Text className="text-on-surface font-medium">취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDelete}
                disabled={deleting}
                className={`flex-1 py-3 rounded-xl items-center bg-red-500 ${
                  deleting ? "opacity-50" : ""
                }`}
              >
                <Text className="text-surface font-bold">
                  {deleting ? "삭제 중..." : "삭제"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
