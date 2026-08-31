import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import type { CheckNicknameResponse, ApiError } from "@/lib/types/api";

// 닉네임 형식: 한글·영문·숫자 2~12자 (DB CHECK 제약과 동일)
const NICKNAME_PATTERN = /^[0-9A-Za-z가-힣]{2,12}$/;

// GET /api/auth/check-nickname?nickname=... — 닉네임 사용 가능 여부.
// OAuth 콜백 후 닉네임 등록 화면에서 사전 확인용으로 호출(인증된 상태).
export async function GET(request: Request) {
  // 1. 인증 확인
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json<ApiError>({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. 입력 추출 + 형식 검증
  const nickname = new URL(request.url).searchParams.get("nickname")?.trim() ?? "";
  if (!NICKNAME_PATTERN.test(nickname)) {
    return NextResponse.json<ApiError>(
      { error: "Invalid nickname format" },
      { status: 400 },
    );
  }

  // 3. 중복 조회 — SECURITY DEFINER rpc로 전역 조회(boolean만 반환).
  //    직접 profiles 조회는 RLS(profiles_select_own)에 막혀 본인 행만 보이므로
  //    남이 쓴 닉네임도 available:true로 오답 → rpc로 우회. (010 마이그레이션)
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("is_nickname_available", {
    p_nickname: nickname,
  });

  if (error) {
    console.error("check-nickname rpc error:", error);
    return NextResponse.json<ApiError>(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return NextResponse.json<CheckNicknameResponse>({ available: data === true });
}
