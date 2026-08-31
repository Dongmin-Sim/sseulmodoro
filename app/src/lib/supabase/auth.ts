import { createServerClient } from "@/lib/supabase/server";

export interface AuthUser {
  id: string;
  email: string;
}

/**
 * API Route에서 인증된 유저를 가져온다.
 * getUser()는 DB에서 유저 존재 여부까지 확인하는 권위 있는 체크.
 * 미인증 시 null 반환 — 호출자가 401 처리.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !user.email) return null;

  return { id: user.id, email: user.email };
}
