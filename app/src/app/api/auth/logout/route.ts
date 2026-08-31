import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { LogoutResponse, ApiError } from "@/lib/types/api";

export async function POST() {
  const supabase = await createServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    // 세션이 이미 만료된 경우 — 이미 로그아웃 상태이므로 성공으로 처리
    if (error.message?.includes("Auth session missing")) {
      return NextResponse.json<LogoutResponse>({ success: true }, { status: 200 });
    }
    console.error("logout error:", error);
    return NextResponse.json<ApiError>(
      { error: "Failed to logout" },
      { status: 500 },
    );
  }

  return NextResponse.json<LogoutResponse>({ success: true }, { status: 200 });
}
