import { BodyPartCode, Severity } from "@second-body/shared";

export const BODY_PART_LABELS: Record<BodyPartCode, string> = {
  // L1
  body: "전신",
  // L2
  head_neck: "머리·목",
  left_arm: "왼쪽 팔",
  right_arm: "오른쪽 팔",
  torso: "몸통",
  left_leg: "왼쪽 다리",
  right_leg: "오른쪽 다리",
  // L3 — 머리·목
  head: "머리",
  eye: "눈",
  nose: "코",
  mouth: "입",
  ear: "귀",
  skin_face: "피부",
  neck: "목",
  // L3 — 왼쪽 팔
  left_shoulder: "왼쪽 어깨",
  left_upper_arm: "왼쪽 위팔",
  left_elbow: "왼쪽 팔꿈치",
  left_forearm: "왼쪽 아래팔",
  left_wrist: "왼쪽 손목",
  left_hand: "왼쪽 손",
  // L3 — 오른쪽 팔
  right_shoulder: "오른쪽 어깨",
  right_upper_arm: "오른쪽 위팔",
  right_elbow: "오른쪽 팔꿈치",
  right_forearm: "오른쪽 아래팔",
  right_wrist: "오른쪽 손목",
  right_hand: "오른쪽 손",
  // L3 — 몸통
  chest: "가슴",
  abdomen: "배",
  back: "등",
  lower_back: "허리",
  pelvis: "골반",
  hip: "엉덩이",
  genitalia: "생식기",
  // L3 — 왼쪽 다리
  left_thigh: "왼쪽 허벅지",
  left_knee: "왼쪽 무릎",
  left_calf: "왼쪽 종아리",
  left_ankle: "왼쪽 발목",
  left_foot: "왼쪽 발",
  // L3 — 오른쪽 다리
  right_thigh: "오른쪽 허벅지",
  right_knee: "오른쪽 무릎",
  right_calf: "오른쪽 종아리",
  right_ankle: "오른쪽 발목",
  right_foot: "오른쪽 발",
};

export const SEVERITY_COLOR: Record<Severity, string> = {
  1: "bg-green-400",
  2: "bg-lime-400",
  3: "bg-yellow-400",
  4: "bg-orange-400",
  5: "bg-red-500",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  1: "거의 없음",
  2: "약함",
  3: "보통",
  4: "강함",
  5: "매우 심함",
};

export const ALL_BODY_PART_CODES = Object.keys(BODY_PART_LABELS) as BodyPartCode[];

/** 증상 기록에 사용되는 L3 코드만 추출 */
export const L3_BODY_PART_CODES: BodyPartCode[] = [
  'head', 'eye', 'nose', 'mouth', 'ear', 'skin_face', 'neck',
  'left_shoulder', 'left_upper_arm', 'left_elbow', 'left_forearm', 'left_wrist', 'left_hand',
  'right_shoulder', 'right_upper_arm', 'right_elbow', 'right_forearm', 'right_wrist', 'right_hand',
  'chest', 'abdomen', 'back', 'lower_back', 'pelvis', 'hip', 'genitalia',
  'left_thigh', 'left_knee', 'left_calf', 'left_ankle', 'left_foot',
  'right_thigh', 'right_knee', 'right_calf', 'right_ankle', 'right_foot',
];
