export type AvatarGender = 'male' | 'female'

// 증상을 실제로 기록할 수 있는 부위 (L3, 37개)
export const BODY_PART_CODES = [
  // 머리·목
  'head',
  'eye',
  'nose',
  'mouth',
  'ear',
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

export interface SymptomDetail {
  id: string
  record_id: string
  body_part_code: BodyPartCode
  severity: Severity
  note?: string
  created_at: string
}

export interface SymptomRecord {
  id: string
  user_id: string
  record_date: string
  overall_note?: string
  created_at: string
  updated_at: string
  details?: SymptomDetail[]
}

export interface CreateSymptomDetailDto {
  body_part_code: BodyPartCode
  severity: Severity
  note?: string
}

export interface CreateSymptomRecordDto {
  record_date: string
  overall_note?: string
  details: CreateSymptomDetailDto[]
}

export interface UpdateSymptomRecordDto {
  overall_note?: string
  details?: CreateSymptomDetailDto[]
}
