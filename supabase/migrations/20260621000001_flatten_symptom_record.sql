-- symptom_details 테이블을 제거하고 symptom_records에 필드를 직접 추가

-- Step 0: overall_note 제거 (이전 변경)
ALTER TABLE public.symptom_records DROP COLUMN IF EXISTS overall_note;

-- Step 1: 새 컬럼 추가 (nullable로 먼저)
ALTER TABLE public.symptom_records
  ADD COLUMN body_part_code TEXT REFERENCES public.body_parts(code),
  ADD COLUMN severity SMALLINT CHECK (severity BETWEEN 1 AND 5),
  ADD COLUMN note TEXT;

-- Step 2: 기존 데이터 마이그레이션 (레코드당 첫 번째 detail로 채움)
UPDATE public.symptom_records sr
SET
  body_part_code = sd.body_part_code,
  severity       = sd.severity,
  note           = sd.note
FROM (
  SELECT DISTINCT ON (record_id)
    record_id, body_part_code, severity, note
  FROM public.symptom_details
  ORDER BY record_id, created_at ASC
) sd
WHERE sr.id = sd.record_id;

-- Step 3: detail 없는 레코드 삭제 (body_part_code가 NULL인 행)
DELETE FROM public.symptom_records WHERE body_part_code IS NULL;

-- Step 4: NOT NULL 제약 추가
ALTER TABLE public.symptom_records
  ALTER COLUMN body_part_code SET NOT NULL,
  ALTER COLUMN severity SET NOT NULL;

-- Step 5: 인덱스 추가
CREATE INDEX idx_symptom_records_body_part
  ON public.symptom_records (body_part_code);

-- Step 6: symptom_details 테이블 제거
DROP TABLE public.symptom_details;
