-- =============================================================
-- 009 profiles.onboarding_completed — 온보딩 1회 노출 플래그 (TASK-33)
-- =============================================================
-- 회원가입 후 첫 진입 시 온보딩 위저드를 보여주고, 완료하면 true로.
-- 크로스기기 유지를 위해 localStorage가 아닌 DB 플래그로 둔다.
-- 닉네임은 기존 profiles.name 재사용(가입 시 빈 문자열, 온보딩에서 채움).

ALTER TABLE public.profiles
  ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT false;
