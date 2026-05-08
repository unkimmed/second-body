import { useCallback, useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Text } from "../../components/Text";
import { BodyMap, BodyMapView } from "../../components/BodyMap";
import { BodyPartCode, Severity, SymptomRecord } from "@second-body/shared";
import { BODY_PART_LABELS, SEVERITY_LABELS } from "../../constants/symptom";
import {
  Level2Group,
  LEVEL2_GROUPS,
  ZoomState,
} from "../../constants/bodyMapZoom";
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
  const [view, setView] = useState<BodyMapView>("front");
  const [zoom, setZoom] = useState<ZoomState>({ level: "L1" });
  const [selected, setSelected] = useState<BodyPartCode | null>(null);
  const [severityMap, setSeverityMap] = useState<
    Partial<Record<BodyPartCode, Severity>>
  >({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (userId) fetchAllRecords();
    }, [userId])
  );

  async function fetchAllRecords() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/records`, {
        headers: { "x-user-id": userId! },
      });
      const data = (await res.json()) as SymptomRecord[];
      const map = buildSeverityMap(data);
      setSeverityMap(map);
    } catch (e) {
      console.error("[BodyMap] 기록 불러오기 실패:", e);
      setSeverityMap({});
    } finally {
      setLoading(false);
    }
  }

  const selectedSeverity = selected ? severityMap[selected] : undefined;
  const hasAnyRecord = Object.keys(severityMap).length > 0;

  const handleGroupPress = (group: Level2Group) => {
    setZoom({ level: "L2", group });
  };

  const handleBackgroundPress = () => {
    if (selected) {
      setSelected(null);
    } else {
      setZoom({ level: "L1" });
    }
  };

  const handleBackToL1 = () => {
    setZoom({ level: "L1" });
    setSelected(null);
  };

  const currentGroupLabel =
    zoom.level === "L2" ? LEVEL2_GROUPS[zoom.group].nameKo : null;

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="pb-10">
      <View className="bg-primary px-5 pb-6 pt-4">
        <Text className="text-surface text-2xl font-bold">내 몸 상태</Text>
        <Text className="text-on-surface-variant mt-1">
          기록된 모든 증상이 표시돼요
        </Text>
      </View>

      <View className="flex-row justify-center gap-2 mt-4">
        <ToggleButton
          active={view === "front"}
          label="앞면"
          onPress={() => setView("front")}
        />
        <ToggleButton
          active={view === "back"}
          label="뒷면"
          onPress={() => setView("back")}
        />
      </View>

      {/* L2 진입 시 상단 헤더 */}
      <View className="px-5 mt-3 h-6 justify-center">
        {zoom.level === "L2" && (
          <Pressable onPress={handleBackToL1} hitSlop={8}>
            <Text style={{ color: Colors.onSurfaceVariant, fontSize: 14 }}>
              ← 전신 · {currentGroupLabel}
            </Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View className="items-center justify-center py-20">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <>
          <View className="items-center mt-2">
            <BodyMap
              view={view}
              zoom={zoom}
              severityMap={severityMap}
              selected={selected}
              onGroupPress={handleGroupPress}
              onPartPress={(code) => setSelected(code)}
              onBackgroundPress={handleBackgroundPress}
            />
          </View>

          {!hasAnyRecord && zoom.level === "L1" && (
            <View className="items-center mt-2">
              <Text className="text-on-surface-variant">
                기록된 증상이 없어요
              </Text>
            </View>
          )}

          {zoom.level === "L1" && hasAnyRecord && (
            <View className="items-center mt-2">
              <Text className="text-on-surface-variant text-sm">
                부위 그룹을 탭하면 자세히 볼 수 있어요
              </Text>
            </View>
          )}

          {selected && (
            <View
              className="mx-5 mt-4 p-4 rounded-2xl"
              style={{
                backgroundColor: Colors.surfaceContainerLowest,
                shadowColor: Colors.onSurface,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.06,
                shadowRadius: 20,
                elevation: 2,
              }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-on-surface">
                  {BODY_PART_LABELS[selected]}
                </Text>
                <TouchableOpacity onPress={() => setSelected(null)} hitSlop={8}>
                  <Text className="text-on-surface-variant">닫기</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-on-surface-variant mt-2">
                {selectedSeverity
                  ? `심각도: ${selectedSeverity} (${SEVERITY_LABELS[selectedSeverity]})`
                  : "이 부위는 기록된 증상이 없어요"}
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
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
        backgroundColor: active ? Colors.primary : "#e5e7eb",
      }}
    >
      <Text
        style={{
          color: active ? Colors.surface : Colors.onSurface,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
