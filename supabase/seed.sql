-- =============================================================
-- 개발용 시드 데이터 (로컬 전용)
-- supabase db reset 시 자동 실행, 리모트에는 push되지 않음
-- =============================================================

-- 테스트 사용자
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  email_change_token_current,
  phone_change,
  phone_change_token,
  reauthentication_token,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'dev@sseulmodoro.local',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '', -- confirmation_token
  '', -- recovery_token
  '', -- email_change
  '', -- email_change_token_new
  '', -- email_change_token_current
  '', -- phone_change
  '', -- phone_change_token
  '', -- reauthentication_token
  '{"provider":"email","providers":["email"]}',
  '{}'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000000001', 'email', 'dev@sseulmodoro.local'),
  'email',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT ON CONSTRAINT identities_pkey DO NOTHING;

-- 프로필 — handle_new_user 트리거가 auth.users INSERT 시 먼저 profiles를
-- balance=0으로 생성하므로, DO NOTHING이면 아래 dev 편의값이 무시된다.
-- DO UPDATE로 dev 계정 name·balance를 덮어쓴다. (로컬 전용, 실서비스 동작 무관)
INSERT INTO public.profiles (id, name, balance)
VALUES ('00000000-0000-0000-0000-000000000001', 'Dev User', 100)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name, balance = EXCLUDED.balance;
