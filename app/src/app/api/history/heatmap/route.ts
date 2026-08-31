import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import type { HeatmapResponse, ApiError } from "@/lib/types/api";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json<ApiError>({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc("get_focus_heatmap", {});

  if (error) {
    console.error("get_focus_heatmap rpc error:", error);
    return NextResponse.json<ApiError>(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return NextResponse.json<HeatmapResponse>(data as unknown as HeatmapResponse, { status: 200 });
}
