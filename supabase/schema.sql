-- ============================================================
-- SECOND BODY — MVP Database Schema
-- Supabase / PostgreSQL
-- ============================================================


-- ============================================================
-- 0. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid()


-- ============================================================
-- 1. BODY_PARTS (신체 부위 마스터)
-- 앱 전체에서 공유하는 고정 데이터. seed로 주입 후 변경 거의 없음.
-- ============================================================

CREATE TABLE public.body_parts (
  code      TEXT PRIMARY KEY,   -- 'head', 'left_shoulder' 등. SVG path id와 1:1 매칭
  name_ko   TEXT NOT NULL,      -- '머리', '왼쪽 어깨'
  category  TEXT NOT NULL       -- 'head' | 'torso' | 'arm' | 'leg'
);

-- Seed data
INSERT INTO public.body_parts (code, name_ko, category) VALUES
  ('head',           '머리',       'head'),
  ('neck',           '목',         'head'),
  ('left_shoulder',  '왼쪽 어깨',  'arm'),
  ('right_shoulder', '오른쪽 어깨','arm'),
  ('left_upper_arm', '왼쪽 팔뚝',  'arm'),
  ('right_upper_arm','오른쪽 팔뚝','arm'),
  ('left_elbow',     '왼쪽 팔꿈치','arm'),
  ('right_elbow',    '오른쪽 팔꿈치','arm'),
  ('left_forearm',   '왼쪽 아래팔','arm'),
  ('right_forearm',  '오른쪽 아래팔','arm'),
  ('left_wrist',     '왼쪽 손목',  'arm'),
  ('right_wrist',    '오른쪽 손목','arm'),
  ('chest',          '가슴',       'torso'),
  ('abdomen',        '복부',       'torso'),
  ('upper_back',     '등 위',      'torso'),
  ('lower_back',     '허리',       'torso'),
  ('left_hip',       '왼쪽 엉덩이','leg'),
  ('right_hip',      '오른쪽 엉덩이','leg'),
  ('left_thigh',     '왼쪽 허벅지','leg'),
  ('right_thigh',    '오른쪽 허벅지','leg'),
  ('left_knee',      '왼쪽 무릎',  'leg'),
  ('right_knee',     '오른쪽 무릎','leg'),
  ('left_calf',      '왼쪽 종아리','leg'),
  ('right_calf',     '오른쪽 종아리','leg'),
  ('left_ankle',     '왼쪽 발목',  'leg'),
  ('right_ankle',    '오른쪽 발목','leg');


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
  gender      TEXT        NOT NULL DEFAULT 'neutral'
                CHECK (gender IN ('male', 'female', 'neutral')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 4. SYMPTOM_RECORDS (일별 기록 헤더)
-- 하루 1개만 생성 가능. 달력뷰·기록 여부 체크의 기준 테이블.
-- ============================================================

CREATE TABLE public.symptom_records (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  record_date  DATE        NOT NULL,
  overall_note TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 하루 1개 기록 보장
  UNIQUE (user_id, record_date)
);

-- 달력뷰 + 오늘 기록 여부 조회 최적화
CREATE INDEX idx_symptom_records_user_date
  ON public.symptom_records (user_id, record_date DESC);


-- ============================================================
-- 5. SYMPTOM_DETAILS (부위별 증상)
-- 하나의 기록 안에 여러 부위 증상을 담는 실제 데이터.
-- ============================================================

CREATE TABLE public.symptom_details (
  id             UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id      UUID     NOT NULL REFERENCES public.symptom_records(id) ON DELETE CASCADE,
  body_part_code TEXT     NOT NULL REFERENCES public.body_parts(code),
  severity       SMALLINT NOT NULL CHECK (severity BETWEEN 1 AND 5),
  note           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 신체 UI 히트맵 집계 쿼리 최적화
CREATE INDEX idx_symptom_details_record_id
  ON public.symptom_details (record_id);

CREATE INDEX idx_symptom_details_body_part
  ON public.symptom_details (body_part_code);


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
ALTER TABLE public.symptom_details  ENABLE ROW LEVEL SECURITY;
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

-- SYMPTOM_DETAILS: 부모 record의 user_id가 본인인 경우만 접근
-- (direct user_id 컬럼이 없어서 JOIN으로 확인)
CREATE POLICY "symptom_details: own rows only"
  ON public.symptom_details FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.symptom_records sr
      WHERE sr.id = symptom_details.record_id
        AND sr.user_id = auth.uid()
    )
  );

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

-- 신체 UI 히트맵 (최근 7일 부위별 평균 severity)
-- SELECT sd.body_part_code, AVG(sd.severity) AS avg_severity, COUNT(*) AS freq
-- FROM symptom_details sd
-- JOIN symptom_records sr ON sd.record_id = sr.id
-- WHERE sr.user_id = auth.uid()
--   AND sr.record_date >= NOW() - INTERVAL '7 days'
-- GROUP BY sd.body_part_code;

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