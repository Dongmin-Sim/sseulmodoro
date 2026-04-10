import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { LogoutResponse, ApiError } from "@/lib/types/api";

export async function POST() {
  const supabase = await createServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("logout error:", error);
    return NextResponse.json<ApiError>(
      { error: "Failed to logout" },
      { status: 500 },
    );
  }

  return NextResponse.json<LogoutResponse>({ success: true }, { status: 200 });
}
