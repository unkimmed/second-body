import { useMemo } from "react";
import { View } from "react-native";
import Svg from "react-native-svg";
import { BodyPartCode, Severity } from "@second-body/shared";
import { VIEW_BOX } from "../constants/bodyMapLayout";
import {
  buildGroupSeverityMap,
  FULL_BODY_VIEW_BOX,
  Level2Group,
  LEVEL2_GROUPS,
  viewBoxToString,
  ZoomState,
} from "../constants/bodyMapZoom";
import { BodyMapL1 } from "./bodymap/BodyMapL1";
import { BodyMapL2 } from "./bodymap/BodyMapL2";

export type BodyMapView = "front" | "back";

type Props = {
  view: BodyMapView;
  zoom: ZoomState;
  severityMap?: Partial<Record<BodyPartCode, Severity>>;
  selected?: BodyPartCode | null;
  onGroupPress: (group: Level2Group) => void;
  onPartPress: (code: BodyPartCode) => void;
  onBackgroundPress: () => void;
  width?: number;
  height?: number;
};

export function BodyMap({
  view,
  zoom,
  severityMap = {},
  selected = null,
  onGroupPress,
  onPartPress,
  onBackgroundPress,
  width = 240,
  height = 600,
}: Props) {
  const groupSeverity = useMemo(
    () => buildGroupSeverityMap(severityMap),
    [severityMap]
  );

  const viewBox =
    zoom.level === "L1"
      ? viewBoxToString(FULL_BODY_VIEW_BOX)
      : viewBoxToString(LEVEL2_GROUPS[zoom.group].viewBox[view]);

  return (
    <View style={{ width, height, alignItems: "center" }}>
      <Svg
        width={width}
        height={height}
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
      >
        {zoom.level === "L1" ? (
          <BodyMapL1
            side={view}
            groupSeverity={groupSeverity}
            onGroupPress={onGroupPress}
          />
        ) : (
          <BodyMapL2
            side={view}
            group={zoom.group}
            severityMap={severityMap}
            selected={selected}
            onPartPress={onPartPress}
            onBackgroundPress={onBackgroundPress}
          />
        )}
      </Svg>
    </View>
  );
}

// Re-export VIEW_BOX for backward compat consumers
export { VIEW_BOX };
