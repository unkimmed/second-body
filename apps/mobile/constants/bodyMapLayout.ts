import { BodyPartCode } from "@second-body/shared";

export const VIEW_BOX = { width: 200, height: 500 };

export type ShapeDef =
  | { type: "circle"; cx: number; cy: number; r: number }
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      rx?: number;
    }
  | {
      type: "ellipse";
      cx: number;
      cy: number;
      rx: number;
      ry: number;
    };

export type BodyPartLayout = {
  front?: ShapeDef[];
  back?: ShapeDef[];
};

export const BODY_PART_LAYOUT: Record<BodyPartCode, BodyPartLayout> = {
  head: {
    front: [{ type: "ellipse", cx: 100, cy: 40, rx: 30, ry: 40 }],
    back: [{ type: "ellipse", cx: 100, cy: 40, rx: 30, ry: 40 }],
  },
  eye: {
    front: [
      { type: "circle", cx: 90, cy: 38, r: 3 },
      { type: "circle", cx: 110, cy: 38, r: 3 },
    ],
  },
  nose: {
    front: [{ type: "circle", cx: 100, cy: 46, r: 2 }],
  },
  mouth: {
    front: [
      { type: "rect", x: 94, y: 53, width: 12, height: 2.5, rx: 1 },
    ],
  },
  ear: {
    front: [
      { type: "ellipse", cx: 70, cy: 42, rx: 3, ry: 6 },
      { type: "ellipse", cx: 130, cy: 42, rx: 3, ry: 6 },
    ],
    back: [
      { type: "ellipse", cx: 72, cy: 42, rx: 3, ry: 6 },
      { type: "ellipse", cx: 128, cy: 42, rx: 3, ry: 6 },
    ],
  },
  skin_face: {
    front: [{ type: "ellipse", cx: 100, cy: 48, rx: 20, ry: 14 }],
  },
  neck: {
    front: [{ type: "rect", x: 90, y: 75, width: 20, height: 18, rx: 4 }],
    back: [{ type: "rect", x: 90, y: 75, width: 20, height: 18, rx: 4 }],
  },

  left_shoulder: {
    front: [{ type: "circle", cx: 60, cy: 100, r: 13 }],
    back: [{ type: "circle", cx: 60, cy: 100, r: 13 }],
  },
  right_shoulder: {
    front: [{ type: "circle", cx: 140, cy: 100, r: 13 }],
    back: [{ type: "circle", cx: 140, cy: 100, r: 13 }],
  },
  left_upper_arm: {
    front: [{ type: "rect", x: 40, y: 105, width: 18, height: 50, rx: 6 }],
    back: [{ type: "rect", x: 40, y: 105, width: 18, height: 50, rx: 6 }],
  },
  right_upper_arm: {
    front: [{ type: "rect", x: 142, y: 105, width: 18, height: 50, rx: 6 }],
    back: [{ type: "rect", x: 142, y: 105, width: 18, height: 50, rx: 6 }],
  },
  left_elbow: {
    front: [{ type: "circle", cx: 49, cy: 160, r: 9 }],
    back: [{ type: "circle", cx: 49, cy: 160, r: 9 }],
  },
  right_elbow: {
    front: [{ type: "circle", cx: 151, cy: 160, r: 9 }],
    back: [{ type: "circle", cx: 151, cy: 160, r: 9 }],
  },
  left_forearm: {
    front: [{ type: "rect", x: 40, y: 168, width: 18, height: 48, rx: 6 }],
    back: [{ type: "rect", x: 40, y: 168, width: 18, height: 48, rx: 6 }],
  },
  right_forearm: {
    front: [{ type: "rect", x: 142, y: 168, width: 18, height: 48, rx: 6 }],
    back: [{ type: "rect", x: 142, y: 168, width: 18, height: 48, rx: 6 }],
  },
  left_wrist: {
    front: [{ type: "circle", cx: 49, cy: 220, r: 7 }],
    back: [{ type: "circle", cx: 49, cy: 220, r: 7 }],
  },
  right_wrist: {
    front: [{ type: "circle", cx: 151, cy: 220, r: 7 }],
    back: [{ type: "circle", cx: 151, cy: 220, r: 7 }],
  },
  left_hand: {
    front: [{ type: "rect", x: 38, y: 227, width: 22, height: 24, rx: 6 }],
    back: [{ type: "rect", x: 38, y: 227, width: 22, height: 24, rx: 6 }],
  },
  right_hand: {
    front: [{ type: "rect", x: 140, y: 227, width: 22, height: 24, rx: 6 }],
    back: [{ type: "rect", x: 140, y: 227, width: 22, height: 24, rx: 6 }],
  },

  chest: {
    front: [{ type: "rect", x: 72, y: 100, width: 56, height: 50, rx: 8 }],
  },
  abdomen: {
    front: [{ type: "rect", x: 75, y: 150, width: 50, height: 45, rx: 6 }],
  },
  pelvis: {
    front: [{ type: "rect", x: 75, y: 195, width: 50, height: 28, rx: 6 }],
  },
  genitalia: {
    front: [{ type: "rect", x: 90, y: 220, width: 20, height: 14, rx: 4 }],
  },
  back: {
    back: [{ type: "rect", x: 72, y: 100, width: 56, height: 95, rx: 8 }],
  },
  lower_back: {
    back: [{ type: "rect", x: 75, y: 195, width: 50, height: 25, rx: 6 }],
  },
  hip: {
    back: [{ type: "rect", x: 75, y: 220, width: 50, height: 30, rx: 8 }],
  },

  left_thigh: {
    front: [{ type: "rect", x: 76, y: 240, width: 22, height: 75, rx: 8 }],
    back: [{ type: "rect", x: 76, y: 240, width: 22, height: 75, rx: 8 }],
  },
  right_thigh: {
    front: [{ type: "rect", x: 102, y: 240, width: 22, height: 75, rx: 8 }],
    back: [{ type: "rect", x: 102, y: 240, width: 22, height: 75, rx: 8 }],
  },
  left_knee: {
    front: [{ type: "circle", cx: 87, cy: 320, r: 11 }],
    back: [{ type: "circle", cx: 87, cy: 320, r: 11 }],
  },
  right_knee: {
    front: [{ type: "circle", cx: 113, cy: 320, r: 11 }],
    back: [{ type: "circle", cx: 113, cy: 320, r: 11 }],
  },
  left_calf: {
    front: [{ type: "rect", x: 76, y: 332, width: 22, height: 70, rx: 8 }],
    back: [{ type: "rect", x: 76, y: 332, width: 22, height: 70, rx: 8 }],
  },
  right_calf: {
    front: [{ type: "rect", x: 102, y: 332, width: 22, height: 70, rx: 8 }],
    back: [{ type: "rect", x: 102, y: 332, width: 22, height: 70, rx: 8 }],
  },
  left_ankle: {
    front: [{ type: "circle", cx: 87, cy: 407, r: 8 }],
    back: [{ type: "circle", cx: 87, cy: 407, r: 8 }],
  },
  right_ankle: {
    front: [{ type: "circle", cx: 113, cy: 407, r: 8 }],
    back: [{ type: "circle", cx: 113, cy: 407, r: 8 }],
  },
  left_foot: {
    front: [{ type: "rect", x: 73, y: 415, width: 28, height: 18, rx: 6 }],
    back: [{ type: "rect", x: 73, y: 415, width: 28, height: 18, rx: 6 }],
  },
  right_foot: {
    front: [{ type: "rect", x: 99, y: 415, width: 28, height: 18, rx: 6 }],
    back: [{ type: "rect", x: 99, y: 415, width: 28, height: 18, rx: 6 }],
  },
};

export const SEVERITY_FILL: Record<number, string> = {
  1: "#4ade80", // green-400
  2: "#a3e635", // lime-400
  3: "#facc15", // yellow-400
  4: "#fb923c", // orange-400
  5: "#ef4444", // red-500
};

export const DEFAULT_FILL = "#d1d5db"; // gray-300 (기록 없음)
