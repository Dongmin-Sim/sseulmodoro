-- =============================================================
-- 포모도로 포인트 단가 초기값 설정
-- 세션 종료 시 완료된 포모도로 수 × 이 값 = 지급 포인트
-- 값 변경은 Supabase 대시보드에서 직접 UPDATE
-- =============================================================

INSERT INTO public.app_config (key, value)
VALUES ('pomodoro_point_value', '10')
ON CONFLICT (key) DO NOTHING;

-- 온보딩 환영 포인트 (기본값 0 = 지급 안 함. 변경은 Supabase 대시보드에서 직접 UPDATE)
INSERT INTO public.app_config (key, value)
VALUES ('onboarding_welcome_points', '0')
ON CONFLICT (key) DO NOTHING;
