import { useCallback, useMemo, useRef, useState } from "react";
import { View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Text } from "../../components/Text";
import { BodyMap, BodyMapView } from "../../components/BodyMap";
import { L3Panel } from "../../components/L3Panel";
import { InlineRecordSheet } from "../../components/InlineRecordSheet";
import { BodyPartCode, Severity, SymptomRecord } from "@second-body/shared";
import { Colors } from "../../constants/theme";
import { useAuth } from "../../lib/AuthContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001/api";

function buildSeverityMap(
  records: SymptomRecord[]
): Partial<Record<BodyPartCode, Severity>> {
  const map: Partial<Record<BodyPartCode, Severity>> = {};
  for (const record of records) {
    for (const detail of record.details ?? []) {
      const prev = map[detail.body_part_code];
      if (!prev || detail.severity > prev) {
        map[detail.body_part_code] = detail.severity;
      }
    }
  }
  return map;
}

export default function HomeScreen() {
  const { userId } = useAuth();
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<BodyMapView>("front");
  const [l3Active, setL3Active] = useState<BodyPartCode | null>(null);
  const [records, setRecords] = useState<SymptomRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);

  const inlineSheetRef = useRef<BottomSheetModal>(null);

  const fetchAllRecords = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_URL}/records`, {
        headers: { "x-user-id": userId },
      });
      const data = (await res.json()) as SymptomRecord[];
      setRecords(data);
    } catch (e) {
      // dev에서 API 서버가 꺼져 있거나 폰에서 localhost를 못 잡으면 여기로 옴.
      // 빈 기록은 정상 상태이므로 조용히 처리.
      console.warn("[BodyMap] 기록 불러오기 실패:", e);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        setLoading(true);
        fetchAllRecords();
      }
    }, [userId, fetchAllRecords])
  );

  const severityMap = useMemo(() => buildSeverityMap(records), [records]);
  const hasAnyRecord = records.length > 0;

  const handleViewChange = (newView: BodyMapView) => {
    setL3Active(null);
    setView(newView);
  };

  const handleRequestAdd = () => {
    inlineSheetRef.current?.present();
  };

  const handleSaved = () => {
    inlineSheetRef.current?.dismiss();
    fetchAllRecords();
  };

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <View
        style={{ opacity: isZoomed ? 0 : 1 }}
        pointerEvents={isZoomed ? "none" : "auto"}
      >
        <View className="items-center pt-2 pb-1">
          <Text className="text-on-surface text-lg font-bold">바디맵</Text>
        </View>
        <View className="flex-row justify-center gap-2 mt-2">
          <ToggleButton
            active={view === "front"}
            label="앞면"
            onPress={() => handleViewChange("front")}
          />
          <ToggleButton
            active={view === "back"}
            label="뒷면"
            onPress={() => handleViewChange("back")}
          />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <BodyMap
          view={view}
          severityMap={severityMap}
          selected={l3Active}
          onPartTap={(code) => setL3Active(code)}
          l3Active={l3Active}
          onZoomChange={setIsZoomed}
        />
      )}

      {!loading && (
        <View className="absolute left-0 right-0 items-center px-5"
          style={{ bottom: 8 }} pointerEvents="none">
          <Text className="text-on-surface-variant text-xs text-center">
            두 손가락으로 확대해서 부위를 탭하세요
          </Text>
          {!hasAnyRecord && (
            <Text className="text-on-surface-variant mt-1">
              기록된 증상이 없어요
            </Text>
          )}
        </View>
      )}

      <L3Panel
        activePart={l3Active}
        records={records}
        onClose={() => setL3Active(null)}
        onRequestAdd={handleRequestAdd}
      />

      <InlineRecordSheet
        ref={inlineSheetRef}
        bodyPart={l3Active}
        onSaved={handleSaved}
      />
    </View>
  );
}

function ToggleButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: active ? "#ffffff" : "#f3f4f6",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: active ? 0.1 : 0,
        shadowRadius: 2,
        elevation: active ? 2 : 0,
      }}
    >
      <Text
        style={{
          color: active ? Colors.onSurface : Colors.onSurfaceVariant,
          fontWeight: active ? "700" : "500",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
