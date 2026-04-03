import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { TEMP_USER_ID } from "@/lib/constants";
import type { EndSessionResponse, ApiError } from "@/lib/types/api";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sessionId = Number(id);

  if (!Number.isInteger(sessionId) || sessionId < 1) {
    return NextResponse.json<ApiError>(
      { error: "Invalid session ID" },
      { status: 400 },
    );
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc("end_session", {
    p_session_id: sessionId,
    p_user_id: TEMP_USER_ID,
  });

  if (error || !data) {
    console.error("end_session rpc error:", error);
    return NextResponse.json<ApiError>(
      { error: "Failed to end session" },
      { status: 500 },
    );
  }

  const result = data as {
    session_id: number;
    completed_count: number;
    points_earned: number;
    new_balance: number;
  };

  return NextResponse.json<EndSessionResponse>({
    sessionId: result.session_id,
    completedCount: result.completed_count,
    pointsEarned: result.points_earned,
    newBalance: result.new_balance,
  });
}
