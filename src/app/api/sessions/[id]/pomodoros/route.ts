import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { TEMP_USER_ID } from "@/lib/constants";
import type { StartNextPomodoroResponse, ApiError } from "@/lib/types/api";

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

  const { data, error } = await supabase.rpc("start_next_pomodoro", {
    p_session_id: sessionId,
    p_user_id: TEMP_USER_ID,
  });

  if (error) {
    console.error("start_next_pomodoro rpc error:", error);
    return NextResponse.json<ApiError>(
      { error: "Failed to start next pomodoro" },
      { status: 500 },
    );
  }

  const result = data as {
    pomodoro_id: number;
    session_id: number;
  };

  return NextResponse.json<StartNextPomodoroResponse>(
    {
      pomodoroId: result.pomodoro_id,
      sessionId: result.session_id,
    },
    { status: 201 },
  );
}
