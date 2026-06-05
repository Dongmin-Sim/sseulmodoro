import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { loadHomeData } from "@/lib/api/home-data";
import type { HomeDataResponse, ApiError } from "@/lib/types/api";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json<ApiError>({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await loadHomeData(user.id);
    return NextResponse.json<HomeDataResponse>(data, { status: 200 });
  } catch (error) {
    console.error("home data query error:", error);
    return NextResponse.json<ApiError>(
      { error: "Failed to fetch home data" },
      { status: 500 },
    );
  }
}
