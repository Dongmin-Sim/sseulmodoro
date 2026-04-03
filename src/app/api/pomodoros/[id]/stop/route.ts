import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { TEMP_USER_ID } from "@/lib/constants";
import type { StopPomodoroResponse, ApiError } from "@/lib/types/api";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pomodoroId = Number(id);

  if (!Number.isInteger(pomodoroId) || pomodoroId < 1) {
    return NextResponse.json<ApiError>(
      { error: "Invalid pomodoro ID" },
      { status: 400 },
    );
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc("stop_pomodoro", {
    p_pomodoro_id: pomodoroId,
    p_user_id: TEMP_USER_ID,
  });

  if (error || !data) {
    console.error("stop_pomodoro rpc error:", error);
    return NextResponse.json<ApiError>(
      { error: "Failed to stop pomodoro" },
      { status: 500 },
    );
  }

  const result = data as {
    pomodoro_id: number;
    session_id: number;
  };

  return NextResponse.json<StopPomodoroResponse>({
    pomodoroId: result.pomodoro_id,
    sessionId: result.session_id,
  });
}
