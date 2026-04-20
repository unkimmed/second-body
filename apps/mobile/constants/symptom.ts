import { BodyPartCode, Severity } from "@second-body/shared";

export const BODY_PART_LABELS: Record<BodyPartCode, string> = {
  head: "머리",
  neck: "목",
  left_shoulder: "왼쪽 어깨",
  right_shoulder: "오른쪽 어깨",
  left_upper_arm: "왼쪽 팔뚝",
  right_upper_arm: "오른쪽 팔뚝",
  left_elbow: "왼쪽 팔꿈치",
  right_elbow: "오른쪽 팔꿈치",
  left_forearm: "왼쪽 아래팔",
  right_forearm: "오른쪽 아래팔",
  left_wrist: "왼쪽 손목",
  right_wrist: "오른쪽 손목",
  chest: "가슴",
  abdomen: "복부",
  upper_back: "등 위",
  lower_back: "허리",
  left_hip: "왼쪽 엉덩이",
  right_hip: "오른쪽 엉덩이",
  left_thigh: "왼쪽 허벅지",
  right_thigh: "오른쪽 허벅지",
  left_knee: "왼쪽 무릎",
  right_knee: "오른쪽 무릎",
  left_calf: "왼쪽 종아리",
  right_calf: "오른쪽 종아리",
  left_ankle: "왼쪽 발목",
  right_ankle: "오른쪽 발목",
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
