import { G, Rect } from "react-native-svg";
import { BodyPartCode, Severity } from "@second-body/shared";
import {
  BODY_PART_LAYOUT,
  SEVERITY_FILL,
  DEFAULT_FILL,
} from "../../constants/bodyMapLayout";
import {
  BodyMapSide,
  Level2Group,
  LEVEL2_GROUPS,
} from "../../constants/bodyMapZoom";
import { renderShape } from "./renderShape";

type Props = {
  side: BodyMapSide;
  group: Level2Group;
  severityMap: Partial<Record<BodyPartCode, Severity>>;
  selected: BodyPartCode | null;
  onPartPress: (code: BodyPartCode) => void;
  onBackgroundPress: () => void;
};

/**
 * L2 그룹 확대 뷰
 * - SVG viewBox는 부모(BodyMap)에서 그룹 영역으로 줌인된 상태
 * - 해당 그룹에 속한 L3 부위들만 렌더링
 * - 빈 영역 탭 → onBackgroundPress
 */
export function BodyMapL2({
  side,
  group,
  severityMap,
  selected,
  onPartPress,
  onBackgroundPress,
}: Props) {
  const meta = LEVEL2_GROUPS[group];
  const box = meta.viewBox[side];

  return (
    <G>
      {/* 1. 배경 탭 영역 (z-index 가장 아래) */}
      <Rect
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        fill="#000"
        fillOpacity={0.001}
        onPress={onBackgroundPress}
      />

      {/* 2. 그룹 내 L3 부위들 */}
      {meta.childCodes.map((code) => {
        const layout = BODY_PART_LAYOUT[code];
        const shapes = layout[side];
        if (!shapes) return null;

        const severity = severityMap[code];
        const fill = severity ? SEVERITY_FILL[severity] : DEFAULT_FILL;
        const isSelected = selected === code;

        return (
          <G key={code} onPress={() => onPartPress(code)}>
            {shapes.map((shape, i) =>
              renderShape(shape, i, {
                fill,
                stroke: isSelected ? "#456373" : "#374151",
                strokeWidth: isSelected ? 1.6 : 0.8,
              })
            )}
          </G>
        );
      })}
    </G>
  );
}
