import { BodyPartCode, Severity } from "@second-body/shared";
import { VIEW_BOX } from "./bodyMapLayout";

export type Level2Group =
  | "head_neck"
  | "left_arm"
  | "right_arm"
  | "torso"
  | "left_leg"
  | "right_leg";

export type BodyMapSide = "front" | "back";

export type ZoomState =
  | { level: "L1" }
  | { level: "L2"; group: Level2Group };

export interface ZoomViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Level2GroupMeta {
  code: Level2Group;
  nameKo: string;
  /** L1 전신 SVG 좌표계 기준의 줌 영역 (front / back 각각) */
  viewBox: {
    front: ZoomViewBox;
    back: ZoomViewBox;
  };
  /** 이 그룹에 속한 L3 부위 코드 (display_order 순) */
  childCodes: BodyPartCode[];
}

// 전체 SVG: 0 0 200 500 — 막대인간 좌표계
// 각 그룹 viewBox는 그 안에서 해당 그룹이 차지하는 사각형 (약간의 패딩 포함)
export const LEVEL2_GROUPS: Record<Level2Group, Level2GroupMeta> = {
  head_neck: {
    code: "head_neck",
    nameKo: "머리·목",
    viewBox: {
      front: { x: 50, y: 0, width: 100, height: 100 },
      back: { x: 50, y: 0, width: 100, height: 100 },
    },
    childCodes: ["head", "eye", "nose", "mouth", "ear", "skin_face", "neck"],
  },
  left_arm: {
    code: "left_arm",
    nameKo: "왼쪽 팔",
    viewBox: {
      front: { x: 25, y: 85, width: 50, height: 175 },
      back: { x: 25, y: 85, width: 50, height: 175 },
    },
    childCodes: [
      "left_shoulder",
      "left_upper_arm",
      "left_elbow",
      "left_forearm",
      "left_wrist",
      "left_hand",
    ],
  },
  right_arm: {
    code: "right_arm",
    nameKo: "오른쪽 팔",
    viewBox: {
      front: { x: 125, y: 85, width: 50, height: 175 },
      back: { x: 125, y: 85, width: 50, height: 175 },
    },
    childCodes: [
      "right_shoulder",
      "right_upper_arm",
      "right_elbow",
      "right_forearm",
      "right_wrist",
      "right_hand",
    ],
  },
  torso: {
    code: "torso",
    nameKo: "몸통",
    viewBox: {
      front: { x: 65, y: 95, width: 70, height: 150 },
      back: { x: 65, y: 95, width: 70, height: 160 },
    },
    childCodes: [
      "chest",
      "abdomen",
      "back",
      "lower_back",
      "pelvis",
      "hip",
      "genitalia",
    ],
  },
  left_leg: {
    code: "left_leg",
    nameKo: "왼쪽 다리",
    viewBox: {
      front: { x: 65, y: 235, width: 45, height: 210 },
      back: { x: 65, y: 235, width: 45, height: 210 },
    },
    childCodes: [
      "left_thigh",
      "left_knee",
      "left_calf",
      "left_ankle",
      "left_foot",
    ],
  },
  right_leg: {
    code: "right_leg",
    nameKo: "오른쪽 다리",
    viewBox: {
      front: { x: 90, y: 235, width: 45, height: 210 },
      back: { x: 90, y: 235, width: 45, height: 210 },
    },
    childCodes: [
      "right_thigh",
      "right_knee",
      "right_calf",
      "right_ankle",
      "right_foot",
    ],
  },
};

export const FULL_BODY_VIEW_BOX: ZoomViewBox = {
  x: 0,
  y: 0,
  width: VIEW_BOX.width,
  height: VIEW_BOX.height,
};

export function viewBoxToString(box: ZoomViewBox): string {
  return `${box.x} ${box.y} ${box.width} ${box.height}`;
}

/**
 * L1 그룹 단위 히트맵용. 그룹에 속한 L3 부위 중 최대 심각도를 반환.
 */
export function buildGroupSeverityMap(
  partSeverity: Partial<Record<BodyPartCode, Severity>>
): Partial<Record<Level2Group, Severity>> {
  const groupMap: Partial<Record<Level2Group, Severity>> = {};

  for (const meta of Object.values(LEVEL2_GROUPS)) {
    let max: Severity | 0 = 0;
    for (const code of meta.childCodes) {
      const sev = partSeverity[code];
      if (sev && sev > max) max = sev;
    }
    if (max > 0) groupMap[meta.code] = max as Severity;
  }
  return groupMap;
}
