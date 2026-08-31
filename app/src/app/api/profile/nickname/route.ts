import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { createServerClient } from "@/lib/supabase/server";
import type { UpdateNicknameResponse, ApiError } from "@/lib/types/api";

const NICKNAME_PATTERN = /^[0-9A-Za-z가-힣]{2,12}$/;

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json<ApiError>({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const nickname = typeof body.nickname === "string" ? body.nickname : "";

  if (!NICKNAME_PATTERN.test(nickname)) {
    return NextResponse.json<ApiError>({ error: "invalid_nickname" }, { status: 400 });
  }

  const supabase = await createServerClient();

  const { error } = await supabase
    .from("profiles")
    .update({ nickname })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json<ApiError>({ error: "nickname_taken" }, { status: 409 });
    }
    console.error("profile nickname update error:", error);
    return NextResponse.json<ApiError>({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json<UpdateNicknameResponse>({ nickname }, { status: 200 });
}
