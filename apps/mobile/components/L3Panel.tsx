import { useCallback, useEffect, useMemo, useRef } from "react";
import { TouchableOpacity, View } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { BodyPartCode, SymptomRecord } from "@second-body/shared";
import { Text } from "./Text";
import { BODY_PART_LABELS } from "../constants/symptom";
import { Colors } from "../constants/theme";
import { SeverityChart } from "./bodymap/SeverityChart";
import { PartRecordList } from "./bodymap/PartRecordList";

type Props = {
  activePart: BodyPartCode | null;
  records: SymptomRecord[];
  /** 시트가 닫혔을 때 호출 (스와이프 다운 / 닫기 버튼 / 프로그램 close 모두). */
  onClose: () => void;
  /** "+ 증상 추가" 버튼 탭 시 호출 — 부모가 인라인 시트를 띄움. */
  onRequestAdd: () => void;
};

export function L3Panel({
  activePart,
  records,
  onClose,
  onRequestAdd,
}: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["70%"], []);

  useEffect(() => {
    if (activePart) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [activePart]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: Colors.surface }}
      handleIndicatorStyle={{ backgroundColor: Colors.onSurfaceVariant }}
    >
      <BottomSheetView style={{ flex: 1 }}>
        {/* 헤더 */}
        <View
          className="px-5 pt-1 pb-3"
          style={{ borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }}
        >
          <Text className="text-xl font-bold text-on-surface">
            {activePart ? BODY_PART_LABELS[activePart] : ""}
          </Text>
        </View>

        {/* 그래프 + 리스트 (스크롤) */}
        <BottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16 }}
        >
          <View className="items-center">
            <SeverityChart records={records} activePart={activePart} />
          </View>

          <View className="mt-4">
            <PartRecordList records={records} activePart={activePart} />
          </View>
        </BottomSheetScrollView>

        {/* + 증상 추가 (고정) */}
        <View
          className="px-5 pt-3 pb-6"
          style={{ borderTopWidth: 1, borderTopColor: "#e5e7eb" }}
        >
          <TouchableOpacity
            onPress={onRequestAdd}
            disabled={!activePart}
            style={{
              paddingVertical: 14,
              borderRadius: 16,
              alignItems: "center",
              backgroundColor: Colors.primary,
              opacity: activePart ? 1 : 0.5,
            }}
          >
            <Text className="text-surface text-base font-bold">
              + 증상 추가
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
