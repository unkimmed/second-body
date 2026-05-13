import { forwardRef, useMemo, useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { BodyPartCode, Severity } from "@second-body/shared";
import { Text } from "./Text";
import { BODY_PART_LABELS, SEVERITY_LABELS } from "../constants/symptom";
import { SEVERITY_FILL } from "../constants/bodyMapLayout";
import { Colors } from "../constants/theme";
import { useAuth } from "../lib/AuthContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001/api";

type Props = {
  bodyPart: BodyPartCode | null;
  /** 저장 성공 시 호출 (부모가 시트 dismiss + 데이터 reload). */
  onSaved: () => void;
};

/**
 * L3 패널 위에 띄우는 인라인 증상 추가 시트.
 * 부위는 L3 활성 부위로 고정. 심각도 + 메모만 입력.
 */
export const InlineRecordSheet = forwardRef<BottomSheetModal, Props>(
  function InlineRecordSheet({ bodyPart, onSaved }, ref) {
    const { userId } = useAuth();
    const snapPoints = useMemo(() => ["55%"], []);
    const [severity, setSeverity] = useState<Severity>(3);
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async () => {
      if (!bodyPart || !userId) return;
      setErrorMessage(null);
      setSubmitting(true);
      try {
        const today = new Date().toISOString().split("T")[0];
        const res = await fetch(`${API_URL}/records`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({
            record_date: today,
            details: [
              {
                body_part_code: bodyPart,
                severity,
                note: note.trim() || undefined,
              },
            ],
          }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          setErrorMessage(`저장 실패 (${res.status}): ${text || "원인 불명"}`);
          return;
        }
        // 성공: 폼 리셋 + 부모에 알림
        setSeverity(3);
        setNote("");
        onSaved();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setErrorMessage(`네트워크 오류: ${msg}`);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        backgroundStyle={{ backgroundColor: Colors.surface }}
        handleIndicatorStyle={{ backgroundColor: Colors.onSurfaceVariant }}
      >
        <BottomSheetView style={{ flex: 1 }}>
          <View className="px-5 pt-1 pb-3">
            <Text className="text-lg font-bold text-on-surface">
              증상 추가
            </Text>
            <Text className="text-on-surface-variant text-sm mt-1">
              {bodyPart ? BODY_PART_LABELS[bodyPart] : ""} ·{" "}
              {new Date().toISOString().split("T")[0]}
            </Text>
          </View>

          {/* 심각도 1-5 */}
          <View className="px-5 mt-2">
            <Text className="text-on-surface-variant text-xs mb-2">
              심각도:{" "}
              <Text className="text-on-surface font-semibold">
                {SEVERITY_LABELS[severity]}
              </Text>
            </Text>
            <View className="flex-row gap-2">
              {([1, 2, 3, 4, 5] as Severity[]).map((s) => {
                const isActive = severity === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSeverity(s)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: "center",
                      backgroundColor: isActive
                        ? SEVERITY_FILL[s]
                        : "#f3f4f6",
                    }}
                  >
                    <Text
                      style={{
                        color: isActive ? "#fff" : Colors.onSurface,
                        fontWeight: isActive ? "700" : "500",
                      }}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 메모 */}
          <View className="px-5 mt-4">
            <Text className="text-on-surface-variant text-xs mb-2">
              메모 (선택)
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="예: 아침부터 욱신거림"
              placeholderTextColor={Colors.onSurfaceVariant}
              style={{
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontSize: 14,
                color: Colors.onSurface,
              }}
            />
          </View>

          {errorMessage && (
            <View className="px-5 mt-3">
              <Text className="text-danger text-sm">{errorMessage}</Text>
            </View>
          )}

          {/* 저장 버튼 */}
          <View className="px-5 mt-auto pb-6">
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting || !bodyPart}
              style={{
                paddingVertical: 14,
                borderRadius: 16,
                alignItems: "center",
                backgroundColor: Colors.primary,
                opacity: submitting || !bodyPart ? 0.5 : 1,
              }}
            >
              <Text className="text-surface text-base font-bold">
                {submitting ? "저장 중..." : "저장"}
              </Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);
