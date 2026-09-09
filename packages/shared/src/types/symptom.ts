export type AvatarGender = 'male' | 'female'

// 증상을 실제로 기록할 수 있는 부위 (L3, 39개)
export const BODY_PART_CODES = [
  // 머리·목
  'head',
  'left_eye',
  'right_eye',
  'nose',
  'mouth',
  'left_ear',
  'right_ear',
  'skin_face',
  'neck',
  // 왼쪽 팔
  'left_shoulder',
  'left_upper_arm',
  'left_elbow',
  'left_forearm',
  'left_wrist',
  'left_hand',
  // 오른쪽 팔
  'right_shoulder',
  'right_upper_arm',
  'right_elbow',
  'right_forearm',
  'right_wrist',
  'right_hand',
  // 몸통
  'chest',
  'abdomen',
  'back',
  'lower_back',
  'pelvis',
  'hip',
  'genitalia',
  // 왼쪽 다리
  'left_thigh',
  'left_knee',
  'left_calf',
  'left_ankle',
  'left_foot',
  // 오른쪽 다리
  'right_thigh',
  'right_knee',
  'right_calf',
  'right_ankle',
  'right_foot',
] as const

// 그룹용 코드 (L1 + L2, 7개) — 실제 기록에는 사용되지 않고 분류·표시용
export const BODY_PART_GROUP_CODES = [
  // L1
  'body',
  // L2
  'head_neck',
  'left_arm',
  'right_arm',
  'torso',
  'left_leg',
  'right_leg',
] as const

export type BodyPartCode = (typeof BODY_PART_CODES)[number]
export type BodyPartGroupCode = (typeof BODY_PART_GROUP_CODES)[number]

// L2 부위 그룹 → 하위 세부 부위(L3) 매핑. 부위 선택 UI에서 2단계 선택에 사용.
export const BODY_PART_GROUP_CHILDREN: Record<
  Exclude<BodyPartGroupCode, 'body'>,
  readonly BodyPartCode[]
> = {
  head_neck: ['head', 'left_eye', 'right_eye', 'nose', 'mouth', 'left_ear', 'right_ear', 'skin_face', 'neck'],
  left_arm: ['left_shoulder', 'left_upper_arm', 'left_elbow', 'left_forearm', 'left_wrist', 'left_hand'],
  right_arm: ['right_shoulder', 'right_upper_arm', 'right_elbow', 'right_forearm', 'right_wrist', 'right_hand'],
  torso: ['chest', 'abdomen', 'back', 'lower_back', 'pelvis', 'hip', 'genitalia'],
  left_leg: ['left_thigh', 'left_knee', 'left_calf', 'left_ankle', 'left_foot'],
  right_leg: ['right_thigh', 'right_knee', 'right_calf', 'right_ankle', 'right_foot'],
}

// L3 코드 → 소속 L2 그룹 역매핑
export const BODY_PART_TO_GROUP = Object.fromEntries(
  Object.entries(BODY_PART_GROUP_CHILDREN).flatMap(([group, codes]) =>
    codes.map((code) => [code, group as Exclude<BodyPartGroupCode, 'body'>]),
  ),
) as Record<BodyPartCode, Exclude<BodyPartGroupCode, 'body'>>

// body_parts 마스터 테이블 전체 (L1+L2+L3 = 44개)
export type AnyBodyPartCode = BodyPartCode | BodyPartGroupCode

export type BodyPartLevel = 1 | 2 | 3
export type BodyPartSide = 'left' | 'right' | 'center'

export type Severity = 1 | 2 | 3 | 4 | 5

export interface BodyPart {
  code: AnyBodyPartCode
  name_ko: string
  level: BodyPartLevel
  parent_code: AnyBodyPartCode | null
  side: BodyPartSide | null
  svg_path_id: string | null
  display_order: number
}

export interface SymptomRecord {
  id: string
  user_id: string
  record_date: string
  body_part_code: BodyPartCode
  severity: Severity
  note?: string
  /** 해결 처리된 시각(ISO). null/undefined 이면 진행중(미해결) */
  resolved_at?: string | null
  created_at: string
  updated_at: string
}

export interface CreateSymptomRecordDto {
  record_date: string
  body_part_code: BodyPartCode
  severity: Severity
  note?: string
}

export interface UpdateSymptomRecordDto {
  body_part_code?: BodyPartCode
  severity?: Severity
  note?: string
  /** true → 해결 처리(resolved_at = now), false → 다시 진행중(resolved_at = null) */
  resolved?: boolean
}
