import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import type { ApiError } from "@/lib/types/api";

export async function POST() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json<ApiError>({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("log_app_visited");

  if (error) {
    console.error("log_app_visited rpc error:", error);
    return NextResponse.json<ApiError>(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
