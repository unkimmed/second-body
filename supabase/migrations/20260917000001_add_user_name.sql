-- users 에 표시 이름 컬럼 추가 (마이페이지/프로필용)
ALTER TABLE public.users
  ADD COLUMN name TEXT;
