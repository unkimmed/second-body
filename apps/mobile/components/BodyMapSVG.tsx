import { useMemo } from "react";
import Animated, {
  useAnimatedProps,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { G } from "react-native-svg";
import { BodyPartCode, Severity } from "@second-body/shared";
import {
  BODY_PART_LAYOUT,
  DEFAULT_FILL,
  SEVERITY_FILL,
  VIEW_BOX,
} from "../constants/bodyMapLayout";
import { renderShape } from "./bodymap/renderShape";

const AnimatedG = Animated.createAnimatedComponent(G);

export type BodyMapSide = "front" | "back";

type Props = {
  side: BodyMapSide;
  severityMap: Partial<Record<BodyPartCode, Severity>>;
  selected: BodyPartCode | null;
  /** 모든 부위 stroke의 공유 opacity. 임계값 부근에서 0 → 0.15로 페이드. */
  borderOpacity: SharedValue<number>;
  width: number;
  height: number;
};

export function BodyMapSVG({
  side,
  severityMap,
  selected,
  borderOpacity,
  width,
  height,
}: Props) {
  const codes = useMemo(
    () => Object.keys(BODY_PART_LAYOUT) as BodyPartCode[],
    []
  );

  // SVG `stroke-opacity`는 자식이 명시하지 않으면 부모 G에서 상속된다.
  // 부모에 한 번만 묶어두고 shared value로 애니메이트 → 37개 부위 stroke가 동기화된다.
  const animatedStrokeProps = useAnimatedProps(() => ({
    strokeOpacity: borderOpacity.value,
  }));

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${VIEW_BOX.width} ${VIEW_BOX.height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <AnimatedG animatedProps={animatedStrokeProps}>
        {codes.map((code) => {
          const layout = BODY_PART_LAYOUT[code];
          const shapes = layout[side];
          if (!shapes) return null;

          const severity = severityMap[code];
          const fill = severity ? SEVERITY_FILL[severity] : DEFAULT_FILL;
          const isSelected = selected === code;

          return (
            <G key={code}>
              {shapes.map((shape, i) =>
                renderShape(shape, i, {
                  fill,
                  stroke: isSelected ? "#0f172a" : "#374151",
                  strokeWidth: isSelected ? 1.6 : 0.6,
                })
              )}
            </G>
          );
        })}
      </AnimatedG>
    </Svg>
  );
}
