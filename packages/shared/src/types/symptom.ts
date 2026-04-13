/** 신체 부위 */
export type BodyPart =
  | 'head'       // 머리
  | 'chest'      // 가슴
  | 'abdomen'    // 복부
  | 'back'       // 허리/등
  | 'arm'        // 팔
  | 'leg'        // 다리
  | 'skin'       // 피부
  | 'other';     // 기타

/** 증상 심각도 (1: 약함 ~ 5: 매우 심함) */
export type Severity = 1 | 2 | 3 | 4 | 5;

/** DB에 저장된 증상 레코드 */
export interface Symptom {
  id: string;
  user_id: string;
  date: string;           // ISO 8601 날짜 (YYYY-MM-DD)
  body_part: BodyPart;
  severity: Severity;
  title: string;          // 증상 제목 (예: "두통")
  description: string;    // 상세 설명
  created_at: string;
  updated_at: string;
}

/** 증상 생성 시 요청 바디 */
export type CreateSymptomDto = Pick<
  Symptom,
  'date' | 'body_part' | 'severity' | 'title' | 'description'
>;

/** 증상 수정 시 요청 바디 */
export type UpdateSymptomDto = Partial<CreateSymptomDto>;
