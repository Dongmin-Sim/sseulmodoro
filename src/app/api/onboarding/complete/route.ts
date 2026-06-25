import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { createServerClient } from "@/lib/supabase/server";
import type { OnboardingCompleteResponse, ApiError } from "@/lib/types/api";

// 닉네임 형식: 한글·영문·숫자 2~12자 (DB CHECK 제약과 동일)
const NICKNAME_PATTERN = /^[0-9A-Za-z가-힣]{2,12}$/;

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json<ApiError>({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";

  // 닉네임이 있으면 형식 검증 (닉네임 등록의 최종 저장 지점)
  if (nickname && !NICKNAME_PATTERN.test(nickname)) {
    return NextResponse.json<ApiError>(
      { error: "Invalid nickname format" },
      { status: 400 },
    );
  }

  const supabase = await createServerClient();

  const updatePayload = {
    onboarding_completed: true,
    ...(nickname ? { nickname } : {}),
  };

  const { error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id);

  if (error) {
    // 사전확인↔저장 사이 race로 닉네임이 선점된 경우 (lower(nickname) unique 위반)
    if (error.code === "23505") {
      return NextResponse.json<ApiError>({ error: "nickname_taken" }, { status: 409 });
    }
    console.error("onboarding complete update error:", error);
    return NextResponse.json<ApiError>(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return NextResponse.json<OnboardingCompleteResponse>({ success: true }, { status: 200 });
}
