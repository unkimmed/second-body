export type AvatarGender = 'male' | 'female';

export type BodyPartCode =
  | 'head'
  | 'neck'
  | 'left_shoulder'
  | 'right_shoulder'
  | 'left_upper_arm'
  | 'right_upper_arm'
  | 'left_elbow'
  | 'right_elbow'
  | 'left_forearm'
  | 'right_forearm'
  | 'left_wrist'
  | 'right_wrist'
  | 'chest'
  | 'abdomen'
  | 'upper_back'
  | 'lower_back'
  | 'left_hip'
  | 'right_hip'
  | 'left_thigh'
  | 'right_thigh'
  | 'left_knee'
  | 'right_knee'
  | 'left_calf'
  | 'right_calf'
  | 'left_ankle'
  | 'right_ankle';

export type Severity = 1 | 2 | 3 | 4 | 5;

export interface BodyPart {
  code: BodyPartCode;
  name_ko: string;
  category: 'head' | 'torso' | 'arm' | 'leg';
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
