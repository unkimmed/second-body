import { G, Rect } from "react-native-svg";
import { BodyPartCode, Severity } from "@second-body/shared";
import {
  BODY_PART_LAYOUT,
  SEVERITY_FILL,
} from "../../constants/bodyMapLayout";
import {
  BodyMapSide,
  Level2Group,
  LEVEL2_GROUPS,
} from "../../constants/bodyMapZoom";
import { renderShape } from "./renderShape";

const SILHOUETTE_FILL = "#e5e4df";
const SILHOUETTE_STROKE = "#b2b2ac";

type Props = {
  side: BodyMapSide;
  groupSeverity: Partial<Record<Level2Group, Severity>>;
  onGroupPress: (group: Level2Group) => void;
};

/**
 * L1 전신 뷰
 * - 회색 막대인간 실루엣 (37개 부위 모두 회색으로 그림)
 * - 그 위에 6개 그룹 영역 박스 오버레이 (반투명 색상 또는 거의 투명한 히트박스)
 */
export function BodyMapL1({ side, groupSeverity, onGroupPress }: Props) {
  return (
    <G>
      {/* 1. 막대인간 실루엣 */}
      {(Object.keys(BODY_PART_LAYOUT) as BodyPartCode[]).map((code) => {
        const layout = BODY_PART_LAYOUT[code];
        const shapes = layout[side];
        if (!shapes) return null;
        return (
          <G key={code}>
            {shapes.map((shape, i) =>
              renderShape(shape, i, {
                fill: SILHOUETTE_FILL,
                stroke: SILHOUETTE_STROKE,
                strokeWidth: 0.6,
              })
            )}
          </G>
        );
      })}

      {/* 2. 그룹 오버레이 (탭 영역 + 히트맵) */}
      {Object.values(LEVEL2_GROUPS).map((meta) => {
        const sev = groupSeverity[meta.code];
        const box = meta.viewBox[side];
        const fill = sev ? SEVERITY_FILL[sev] : "#000";
        const fillOpacity = sev ? 0.4 : 0.001; // 0.001로 hit test 보장
        return (
          <Rect
            key={meta.code}
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            fill={fill}
            fillOpacity={fillOpacity}
            stroke="transparent"
            onPress={() => onGroupPress(meta.code)}
          />
        );
      })}
    </G>
  );
}
