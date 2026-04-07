import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import type { CompletePomodoroResponse, ApiError } from "@/lib/types/api";

const NOTE_MAX_LENGTH = 100;

function parseNote(body: unknown): { note: string | null; error?: string } {
  if (body === null || body === undefined) return { note: null };
  if (typeof body !== "object") return { note: null };

  const raw = (body as Record<string, unknown>).note;
  if (raw === undefined || raw === null) return { note: null };

  if (typeof raw !== "string") {
    return { note: null, error: "note must be a string or null" };
  }

  const trimmed = raw.trim();
  if (trimmed === "") return { note: null };

  if (trimmed.length > NOTE_MAX_LENGTH) {
    return {
      note: null,
      error: `note must be ${NOTE_MAX_LENGTH} characters or less`,
    };
  }

  return { note: trimmed };
}

export async function POST(
  request: Request,
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

  if (!(await getAuthUser())) {
    return NextResponse.json<ApiError>(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    // body가 없는 경우 (기존 호환) — note = null로 진행
  }

  const { note, error: noteError } = parseNote(body);
  if (noteError) {
    return NextResponse.json<ApiError>(
      { error: noteError },
      { status: 400 },
    );
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc("complete_pomodoro", {
    p_pomodoro_id: pomodoroId,
    p_note: note,
  });

  if (error || !data) {
    console.error("complete_pomodoro rpc error:", error);
    return NextResponse.json<ApiError>(
      { error: "Failed to complete pomodoro" },
      { status: 500 },
    );
  }

  const result = data as {
    pomodoro_id: number;
    session_id: number;
    completed_count: number;
    target_count: number;
  };

  return NextResponse.json<CompletePomodoroResponse>({
    pomodoroId: result.pomodoro_id,
    sessionId: result.session_id,
    completedCount: result.completed_count,
    targetCount: result.target_count,
  });
}
