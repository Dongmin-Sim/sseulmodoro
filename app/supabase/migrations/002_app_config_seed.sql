-- =============================================================
-- 002 app_config seed — 서비스 설정 초기값
-- =============================================================
-- 값 변경은 Supabase 대시보드에서 직접 UPDATE.

-- 포모도로 1회당 지급 포인트
INSERT INTO public.app_config (key, value)
VALUES ('pomodoro_point_value', '10')
ON CONFLICT (key) DO NOTHING;

-- 온보딩 환영 포인트 (0 = 지급 안 함)
INSERT INTO public.app_config (key, value)
VALUES ('onboarding_welcome_points', '0')
ON CONFLICT (key) DO NOTHING;

-- 가차 1회 비용
INSERT INTO public.app_config (key, value)
VALUES ('gacha_cost', '50')
ON CONFLICT (key) DO NOTHING;

-- 가차 레어리티 가중치 (상대값, 합계 100 불필요)
INSERT INTO public.app_config (key, value)
VALUES ('gacha_rarity_weights', '{"common": 69, "rare": 25, "epic": 4, "legendary": 1.5, "mythic": 0.5}')
ON CONFLICT (key) DO NOTHING;
