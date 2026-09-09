-- 눈(eye)·귀(ear)를 좌우로 분리
--   eye  → left_eye,  right_eye
--   ear  → left_ear,  right_ear
-- 기존 eye/ear 기록 데이터는 없다고 확인됨. 방어적으로 참조 레코드를 먼저 정리한다.

-- Step 1: 새 부위 코드 추가
INSERT INTO public.body_parts (code, name_ko, level, parent_code, side, svg_path_id, display_order) VALUES
  ('left_eye',  '왼쪽 눈',  3, 'head_neck', 'left',  'svg-l-eye', 2),
  ('right_eye', '오른쪽 눈', 3, 'head_neck', 'right', 'svg-r-eye', 3),
  ('left_ear',  '왼쪽 귀',  3, 'head_neck', 'left',  'svg-l-ear', 6),
  ('right_ear', '오른쪽 귀', 3, 'head_neck', 'right', 'svg-r-ear', 7);

-- Step 2: 기존 eye/ear 를 참조하는 증상 기록 정리 (좌우 소급 판별 불가)
DELETE FROM public.symptom_records WHERE body_part_code IN ('eye', 'ear');

-- Step 3: 남은 부위들의 display_order 재정렬 (nose→4, mouth→5, skin_face→8, neck→9)
UPDATE public.body_parts SET display_order = 4 WHERE code = 'nose';
UPDATE public.body_parts SET display_order = 5 WHERE code = 'mouth';
UPDATE public.body_parts SET display_order = 8 WHERE code = 'skin_face';
UPDATE public.body_parts SET display_order = 9 WHERE code = 'neck';

-- Step 4: 기존 eye/ear 마스터 행 제거
DELETE FROM public.body_parts WHERE code IN ('eye', 'ear');
