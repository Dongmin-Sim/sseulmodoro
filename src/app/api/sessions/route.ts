import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { TEMP_USER_ID, SESSION_DEFAULTS } from "@/lib/constants";
import type { StartSessionResponse, ApiError } from "@/lib/types/api";

interface StartSessionRequest {
  focusMinutes: number;
}

export async function POST(request: Request) {
  let body: StartSessionRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiError>(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!body.focusMinutes || body.focusMinutes <= 0 || body.focusMinutes > 120) {
    return NextResponse.json<ApiError>(
      { error: "focusMinutes must be between 0 and 120" },
      { status: 400 },
    );
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc("start_session", {
    p_user_id: TEMP_USER_ID,
    p_focus_minutes: body.focusMinutes,
    p_short_break_minutes: SESSION_DEFAULTS.shortBreakMinutes,
    p_long_break_minutes: SESSION_DEFAULTS.longBreakMinutes,
    p_target_count: SESSION_DEFAULTS.targetCount,
  });

  if (error) {
    console.error("start_session rpc error:", error);
    return NextResponse.json<ApiError>(
      { error: "Failed to start session" },
      { status: 500 },
    );
  }

  const result = data as { session_id: number; pomodoro_id: number };

  return NextResponse.json<StartSessionResponse>(
    {
      sessionId: result.session_id,
      pomodoroId: result.pomodoro_id,
    },
    { status: 201 },
  );
}
