import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { SESSION_DEFAULTS } from "@/lib/constants";
import type { StartSessionResponse, ApiError } from "@/lib/types/api";

interface StartSessionRequest {
  focusMinutes: number;
  shortBreakMinutes?: number;
  longBreakMinutes?: number;
  targetCount?: number;
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
      { error: "focusMinutes must be greater than 0 and at most 120" },
      { status: 400 },
    );
  }

  if (
    body.shortBreakMinutes !== undefined &&
    (body.shortBreakMinutes <= 0 || body.shortBreakMinutes > 30)
  ) {
    return NextResponse.json<ApiError>(
      { error: "shortBreakMinutes must be greater than 0 and at most 30" },
      { status: 400 },
    );
  }

  if (
    body.longBreakMinutes !== undefined &&
    (body.longBreakMinutes <= 0 || body.longBreakMinutes > 60)
  ) {
    return NextResponse.json<ApiError>(
      { error: "longBreakMinutes must be greater than 0 and at most 60" },
      { status: 400 },
    );
  }

  if (
    body.targetCount !== undefined &&
    (!Number.isInteger(body.targetCount) ||
      body.targetCount < 2 ||
      body.targetCount > 8)
  ) {
    return NextResponse.json<ApiError>(
      { error: "targetCount must be an integer between 2 and 8" },
      { status: 400 },
    );
  }

  if (!(await getAuthUser())) {
    return NextResponse.json<ApiError>(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc("start_session", {
    p_focus_minutes: body.focusMinutes,
    p_short_break_minutes:
      body.shortBreakMinutes ?? SESSION_DEFAULTS.shortBreakMinutes,
    p_long_break_minutes:
      body.longBreakMinutes ?? SESSION_DEFAULTS.longBreakMinutes,
    p_target_count: body.targetCount ?? SESSION_DEFAULTS.targetCount,
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
