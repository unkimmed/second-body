export type AvatarGender = 'male' | 'female';

// L1 — 전신 (1)
// L2 — 부위 그룹 (6)
// L3 — 증상 기록 단위 (37)
export type BodyPartCode =
  // L1
  | 'body'
  // L2
  | 'head_neck'
  | 'left_arm'
  | 'right_arm'
  | 'torso'
  | 'left_leg'
  | 'right_leg'
  // L3 — 머리·목
  | 'head'
  | 'eye'
  | 'nose'
  | 'mouth'
  | 'ear'
  | 'skin_face'
  | 'neck'
  // L3 — 왼쪽 팔
  | 'left_shoulder'
  | 'left_upper_arm'
  | 'left_elbow'
  | 'left_forearm'
  | 'left_wrist'
  | 'left_hand'
  // L3 — 오른쪽 팔
  | 'right_shoulder'
  | 'right_upper_arm'
  | 'right_elbow'
  | 'right_forearm'
  | 'right_wrist'
  | 'right_hand'
  // L3 — 몸통
  | 'chest'
  | 'abdomen'
  | 'back'
  | 'lower_back'
  | 'pelvis'
  | 'hip'
  | 'genitalia'
  // L3 — 왼쪽 다리
  | 'left_thigh'
  | 'left_knee'
  | 'left_calf'
  | 'left_ankle'
  | 'left_foot'
  // L3 — 오른쪽 다리
  | 'right_thigh'
  | 'right_knee'
  | 'right_calf'
  | 'right_ankle'
  | 'right_foot';

export type BodyPartLevel = 1 | 2 | 3;
export type BodyPartSide = 'left' | 'right' | 'center';

export type Severity = 1 | 2 | 3 | 4 | 5;

export interface BodyPart {
  code: BodyPartCode;
  name_ko: string;
  level: BodyPartLevel;
  parent_code: BodyPartCode | null;
  side: BodyPartSide | null;
  svg_path_id: string | null;
  display_order: number;
}

export interface SymptomDetail {
  id: string;
  record_id: string;
  body_part_code: BodyPartCode;
  severity: Severity;
  note?: string;
  created_at: string;
}

export interface SymptomRecord {
  id: string;
  user_id: string;
  record_date: string;
  overall_note?: string;
  created_at: string;
  updated_at: string;
  details?: SymptomDetail[];
}

export interface CreateSymptomDetailDto {
  body_part_code: BodyPartCode;
  severity: Severity;
  note?: string;
}

export interface CreateSymptomRecordDto {
  record_date: string;
  overall_note?: string;
  details: CreateSymptomDetailDto[];
}

export interface UpdateSymptomRecordDto {
  overall_note?: string;
  details?: CreateSymptomDetailDto[];
}
