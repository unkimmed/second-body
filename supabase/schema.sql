-- ============================================================
-- Second Body - Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에서 실행하세요
-- ============================================================

-- UUID 생성 확장 활성화 (Supabase에서 기본 제공)
create extension if not exists "uuid-ossp";

-- 증상 기록 테이블
create table if not exists symptoms (
  id          uuid primary key default uuid_generate_v4(),
  user_id     text        not null,             -- 유저 식별자
  date        date        not null,             -- 증상 발생 날짜
  body_part   text        not null,             -- 신체 부위
  severity    smallint    not null check (severity between 1 and 5),
  title       text        not null,             -- 증상 제목
  description text        not null default '',  -- 상세 설명
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- updated_at 자동 업데이트 함수
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 트리거: symptoms 행이 update될 때 updated_at 자동 갱신
create trigger symptoms_updated_at
  before update on symptoms
  for each row execute function update_updated_at();

-- 인덱스: user_id + date로 자주 조회하므로 복합 인덱스 추가
create index if not exists idx_symptoms_user_date
  on symptoms (user_id, date desc);

-- ============================================================
-- Row Level Security (RLS) 설정
-- 서버(service_role)에서만 접근할 예정이라면 아래 생략 가능
-- 추후 클라이언트에서 직접 Supabase에 접근하려면 활성화 필요
-- ============================================================

-- alter table symptoms enable row level security;

-- 본인 데이터만 읽기/쓰기 가능 정책 (RLS 활성화 시 함께 사용)
-- create policy "유저는 자신의 증상만 조회" on symptoms
--   for select using (auth.uid()::text = user_id);

-- create policy "유저는 자신의 증상만 생성" on symptoms
--   for insert with check (auth.uid()::text = user_id);

-- create policy "유저는 자신의 증상만 수정" on symptoms
--   for update using (auth.uid()::text = user_id);

-- create policy "유저는 자신의 증상만 삭제" on symptoms
--   for delete using (auth.uid()::text = user_id);
