import {
  BodyPartCode,
  BodyPartGroupCode,
  Severity,
} from "@second-body/shared";

// 실제 증상 기록에 사용되는 부위 (L3, 37개)
export const BODY_PART_LABELS: Record<BodyPartCode, string> = {
  // 머리·목
  head: "머리",
  eye: "눈",
  nose: "코",
  mouth: "입",
  ear: "귀",
  skin_face: "피부",
  neck: "목",
  // 왼쪽 팔
  left_shoulder: "왼쪽 어깨",
  left_upper_arm: "왼쪽 위팔",
  left_elbow: "왼쪽 팔꿈치",
  left_forearm: "왼쪽 아래팔",
  left_wrist: "왼쪽 손목",
  left_hand: "왼쪽 손",
  // 오른쪽 팔
  right_shoulder: "오른쪽 어깨",
  right_upper_arm: "오른쪽 위팔",
  right_elbow: "오른쪽 팔꿈치",
  right_forearm: "오른쪽 아래팔",
  right_wrist: "오른쪽 손목",
  right_hand: "오른쪽 손",
  // 몸통
  chest: "가슴",
  abdomen: "배",
  back: "등",
  lower_back: "허리",
  pelvis: "골반",
  hip: "엉덩이",
  genitalia: "생식기",
  // 왼쪽 다리
  left_thigh: "왼쪽 허벅지",
  left_knee: "왼쪽 무릎",
  left_calf: "왼쪽 종아리",
  left_ankle: "왼쪽 발목",
  left_foot: "왼쪽 발",
  // 오른쪽 다리
  right_thigh: "오른쪽 허벅지",
  right_knee: "오른쪽 무릎",
  right_calf: "오른쪽 종아리",
  right_ankle: "오른쪽 발목",
  right_foot: "오른쪽 발",
};

// 분류·표시용 그룹 라벨 (L1 + L2)
export const BODY_PART_GROUP_LABELS: Record<BodyPartGroupCode, string> = {
  body: "전신",
  head_neck: "머리·목",
  left_arm: "왼쪽 팔",
  right_arm: "오른쪽 팔",
  torso: "몸통",
  left_leg: "왼쪽 다리",
  right_leg: "오른쪽 다리",
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
