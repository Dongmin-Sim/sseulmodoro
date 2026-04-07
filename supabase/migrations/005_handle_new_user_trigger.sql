-- 회원가입 시 profiles 자동 생성 trigger
-- auth.users INSERT → trigger → profiles INSERT (트랜잭션 보장)

-- TODO(user): 함수 body 구현
-- NEW.id = auth.users.id (UUID)
-- NEW.raw_user_meta_data = signUp 시 전달한 메타데이터 (JSON)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, balance)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), 0);
  RETURN NEW;
END;
$$;

-- TODO(user): 로컬에서 회원가입 → profiles 자동 생성 확인
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
