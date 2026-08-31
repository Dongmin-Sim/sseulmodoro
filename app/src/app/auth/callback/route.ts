import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// OAuth 콜백 — Google 인증 후 돌아오는 지점.
// code를 세션으로 교환하고 홈으로 보낸다. 로그인(TASK-71)도 이 라우트를 공유한다.
// 신규/기존 분기는 하지 않는다 — 신규 사용자는 onboarding_completed=false라
// /home에서 온보딩 위저드로 자동 진입한다.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/home`);
    }
    console.error("OAuth code exchange error:", error);
  }

  // code 누락 또는 교환 실패 — 가입 화면으로 되돌리고 에러 표시
  return NextResponse.redirect(`${origin}/signup?error=oauth`);
}
