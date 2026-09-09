-- 증상 해결여부: resolved_at (null=진행중, 값=해결 시각)
ALTER TABLE public.symptom_records
  ADD COLUMN resolved_at TIMESTAMPTZ;

-- 홈 바디맵은 미해결(진행중) 증상만 조회 → 부분 인덱스
CREATE INDEX idx_symptom_records_unresolved
  ON public.symptom_records (user_id)
  WHERE resolved_at IS NULL;
