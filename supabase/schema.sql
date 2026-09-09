-- ============================================================
-- SECOND BODY — MVP Database Schema
-- Supabase / PostgreSQL
-- ============================================================


-- ============================================================
-- 0. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid()


-- ============================================================
-- 1. BODY_PARTS (신체 부위 마스터) v4
-- L1 :  1개 (전신)
-- L2 :  6개 (부위 그룹)
-- L3 : 39개 (증상 기록 단위)
-- 전체: 46개
-- ============================================================

CREATE TABLE public.body_parts (
  code          TEXT PRIMARY KEY,
  name_ko       TEXT NOT NULL,
  level         INT  NOT NULL CHECK (level IN (1, 2, 3)),
  parent_code   TEXT REFERENCES public.body_parts(code),
  side          TEXT CHECK (side IN ('left', 'right', 'center')),
  svg_path_id   TEXT,
  display_order INT  NOT NULL DEFAULT 0,

  CONSTRAINT level_parent_check CHECK (
    (level = 1 AND parent_code IS NULL) OR
    (level > 1 AND parent_code IS NOT NULL)
  )
);

-- L1 — 전신 (1개)
INSERT INTO public.body_parts (code, name_ko, level, parent_code, side, svg_path_id, display_order) VALUES
  ('body', '전신', 1, NULL, NULL, 'svg-body', 0);

-- L2 — 부위 그룹 (6개)
INSERT INTO public.body_parts (code, name_ko, level, parent_code, side, svg_path_id, display_order) VALUES
  ('head_neck',  '머리·목',     2, 'body', 'center', 'svg-head-neck',  1),
  ('left_arm',   '왼쪽 팔',     2, 'body', 'left',   'svg-left-arm',   2),
  ('right_arm',  '오른쪽 팔',   2, 'body', 'right',  'svg-right-arm',  3),
  ('torso',      '몸통',        2, 'body', 'center', 'svg-torso',      4),
  ('left_leg',   '왼쪽 다리',   2, 'body', 'left',   'svg-left-leg',   5),
  ('right_leg',  '오른쪽 다리', 2, 'body', 'right',  'svg-right-leg',  6);

-- L3 — 세부 부위 (39개)

-- 머리·목 (9)
INSERT INTO public.body_parts (code, name_ko, level, parent_code, side, svg_path_id, display_order) VALUES
  ('head',       '머리',     3, 'head_neck', 'center', 'svg-head',    1),
  ('left_eye',   '왼쪽 눈',  3, 'head_neck', 'left',   'svg-l-eye',   2),
  ('right_eye',  '오른쪽 눈', 3, 'head_neck', 'right',  'svg-r-eye',   3),
  ('nose',       '코',       3, 'head_neck', 'center', 'svg-nose',    4),
  ('mouth',      '입',       3, 'head_neck', 'center', 'svg-mouth',   5),
  ('left_ear',   '왼쪽 귀',  3, 'head_neck', 'left',   'svg-l-ear',   6),
  ('right_ear',  '오른쪽 귀', 3, 'head_neck', 'right',  'svg-r-ear',   7),
  ('skin_face',  '피부',     3, 'head_neck', 'center', 'svg-skin',    8),
  ('neck',       '목',       3, 'head_neck', 'center', 'svg-neck',    9);

-- 왼쪽 팔 (6)
INSERT INTO public.body_parts (code, name_ko, level, parent_code, side, svg_path_id, display_order) VALUES
  ('left_shoulder',  '어깨',   3, 'left_arm', 'left', 'svg-l-shoulder',  1),
  ('left_upper_arm', '위팔',   3, 'left_arm', 'left', 'svg-l-upper-arm', 2),
  ('left_elbow',     '팔꿈치', 3, 'left_arm', 'left', 'svg-l-elbow',     3),
  ('left_forearm',   '아래팔', 3, 'left_arm', 'left', 'svg-l-forearm',   4),
  ('left_wrist',     '손목',   3, 'left_arm', 'left', 'svg-l-wrist',     5),
  ('left_hand',      '손',     3, 'left_arm', 'left', 'svg-l-hand',      6);

-- 오른쪽 팔 (6)
INSERT INTO public.body_parts (code, name_ko, level, parent_code, side, svg_path_id, display_order) VALUES
  ('right_shoulder',  '어깨',   3, 'right_arm', 'right', 'svg-r-shoulder',  1),
  ('right_upper_arm', '위팔',   3, 'right_arm', 'right', 'svg-r-upper-arm', 2),
  ('right_elbow',     '팔꿈치', 3, 'right_arm', 'right', 'svg-r-elbow',     3),
  ('right_forearm',   '아래팔', 3, 'right_arm', 'right', 'svg-r-forearm',   4),
  ('right_wrist',     '손목',   3, 'right_arm', 'right', 'svg-r-wrist',     5),
  ('right_hand',      '손',     3, 'right_arm', 'right', 'svg-r-hand',      6);

-- 몸통 (7)
INSERT INTO public.body_parts (code, name_ko, level, parent_code, side, svg_path_id, display_order) VALUES
  ('chest',      '가슴',   3, 'torso', 'center', 'svg-chest',      1),
  ('abdomen',    '배',     3, 'torso', 'center', 'svg-abdomen',    2),
  ('back',       '등',     3, 'torso', 'center', 'svg-back',       3),
  ('lower_back', '허리',   3, 'torso', 'center', 'svg-lower-back', 4),
  ('pelvis',     '골반',   3, 'torso', 'center', 'svg-pelvis',     5),
  ('hip',        '엉덩이', 3, 'torso', 'center', 'svg-hip',        6),
  ('genitalia',  '생식기', 3, 'torso', 'center', 'svg-genitalia',  7);

-- 왼쪽 다리 (5)
INSERT INTO public.body_parts (code, name_ko, level, parent_code, side, svg_path_id, display_order) VALUES
  ('left_thigh', '허벅지', 3, 'left_leg', 'left', 'svg-l-thigh', 1),
  ('left_knee',  '무릎',   3, 'left_leg', 'left', 'svg-l-knee',  2),
  ('left_calf',  '종아리', 3, 'left_leg', 'left', 'svg-l-calf',  3),
  ('left_ankle', '발목',   3, 'left_leg', 'left', 'svg-l-ankle', 4),
  ('left_foot',  '발',     3, 'left_leg', 'left', 'svg-l-foot',  5);

-- 오른쪽 다리 (5)
INSERT INTO public.body_parts (code, name_ko, level, parent_code, side, svg_path_id, display_order) VALUES
  ('right_thigh', '허벅지', 3, 'right_leg', 'right', 'svg-r-thigh', 1),
  ('right_knee',  '무릎',   3, 'right_leg', 'right', 'svg-r-knee',  2),
  ('right_calf',  '종아리', 3, 'right_leg', 'right', 'svg-r-calf',  3),
  ('right_ankle', '발목',   3, 'right_leg', 'right', 'svg-r-ankle', 4),
  ('right_foot',  '발',     3, 'right_leg', 'right', 'svg-r-foot',  5);


-- ============================================================
-- 2. USERS (사용자)
-- Supabase auth.users와 1:1 연동. 앱 전용 정보만 여기에.
-- ============================================================

CREATE TABLE public.users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 3. AVATARS (제2의 나)
-- 유저당 아바타 1개. user_id가 PK이자 FK.
-- ============================================================

CREATE TABLE public.avatars (
  user_id     UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  avatar_name TEXT        NOT NULL,
  skin_tone   TEXT        NOT NULL DEFAULT 'medium'
                CHECK (skin_tone IN ('light', 'medium_light', 'medium', 'medium_dark', 'dark')),
  gender      TEXT        NOT NULL DEFAULT 'male'
                CHECK (gender IN ('male', 'female')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 4. SYMPTOM_RECORDS (증상 기록)
-- 부위별 증상을 하나의 행에 직접 저장.
-- ============================================================

CREATE TABLE public.symptom_records (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  record_date    DATE        NOT NULL,
  body_part_code TEXT        NOT NULL REFERENCES public.body_parts(code),
  severity       SMALLINT    NOT NULL CHECK (severity BETWEEN 1 AND 5),
  note           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 달력뷰 + 오늘 기록 여부 조회 최적화
CREATE INDEX idx_symptom_records_user_date
  ON public.symptom_records (user_id, record_date DESC);

CREATE INDEX idx_symptom_records_body_part
  ON public.symptom_records (body_part_code);


-- ============================================================
-- TRIGGERS — updated_at 자동 갱신
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_avatars_updated_at
  BEFORE UPDATE ON public.avatars
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_symptom_records_updated_at
  BEFORE UPDATE ON public.symptom_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- 활성화
ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatars          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_parts       ENABLE ROW LEVEL SECURITY;

-- USERS: 본인 행만 접근
CREATE POLICY "users: own row only"
  ON public.users FOR ALL
  USING (auth.uid() = id);

-- AVATARS: 본인 아바타만 접근
CREATE POLICY "avatars: own row only"
  ON public.avatars FOR ALL
  USING (auth.uid() = user_id);

-- SYMPTOM_RECORDS: 본인 기록만 접근
CREATE POLICY "symptom_records: own rows only"
  ON public.symptom_records FOR ALL
  USING (auth.uid() = user_id);

-- BODY_PARTS: 모든 인증 유저가 읽기 가능, 쓰기는 불가
CREATE POLICY "body_parts: read only for all"
  ON public.body_parts FOR SELECT
  USING (true);


-- ============================================================
-- USEFUL QUERIES (참고용 — 실행 X)
-- ============================================================

-- 오늘 기록 여부 확인 (랜딩 버튼 표시 여부)
-- SELECT id FROM symptom_records
-- WHERE user_id = auth.uid() AND record_date = CURRENT_DATE;

-- 달력 뷰 (이번 달 기록 날짜 목록)
-- SELECT record_date FROM symptom_records
-- WHERE user_id = auth.uid()
--   AND record_date BETWEEN date_trunc('month', NOW()) AND NOW()
-- ORDER BY record_date;

-- L2 그룹별 L3 부위 조회
-- SELECT code, name_ko, side, svg_path_id
-- FROM body_parts
-- WHERE parent_code = 'torso'
-- ORDER BY display_order;

-- L3 전체 + 소속 L2 그룹명
-- SELECT
--   bp3.code, bp3.name_ko, bp3.side, bp3.svg_path_id,
--   bp2.code AS group_code, bp2.name_ko AS group_name
-- FROM body_parts bp3
-- JOIN body_parts bp2 ON bp3.parent_code = bp2.code
-- WHERE bp3.level = 3
-- ORDER BY bp2.display_order, bp3.display_order;

-- 홈화면 L2 그룹별 히트맵 (최근 7일 severity 평균)
-- SELECT
--   bp2.code AS group_code,
--   bp2.name_ko,
--   bp2.svg_path_id,
--   ROUND(AVG(sr.severity)::numeric, 2) AS avg_severity
-- FROM symptom_records sr
-- JOIN body_parts bp3 ON sr.body_part_code = bp3.code
-- JOIN body_parts bp2 ON bp3.parent_code = bp2.code
-- WHERE sr.created_at >= NOW() - INTERVAL '7 days'
--   AND sr.user_id = auth.uid()
-- GROUP BY bp2.code, bp2.name_ko, bp2.svg_path_id
-- ORDER BY avg_severity DESC;

-- 연속 기록 streak 계산
-- SELECT COUNT(*) AS current_streak
-- FROM (
--   SELECT record_date,
--     record_date - (ROW_NUMBER() OVER (ORDER BY record_date))::int AS grp
--   FROM symptom_records
--   WHERE user_id = auth.uid()
-- ) t
-- WHERE grp = (
--   SELECT record_date - (ROW_NUMBER() OVER (ORDER BY record_date))::int
--   FROM symptom_records
--   WHERE user_id = auth.uid()
--   ORDER BY record_date DESC LIMIT 1
-- );