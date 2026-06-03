import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import type { RecordResponse, ApiError } from "@/lib/types/api";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

// rpc(get_record_history)가 반환하는 snake_case JSON 형태
type RecordRpcResult = {
  summary: {
    total: { count: number; focus_minutes: number };
    today: { count: number; focus_minutes: number };
  };
  logs: { pomodoro_id: number; completed_at: string; focus_minutes: number }[];
  next_cursor: string | null;
};

export async function GET(request: Request) {
  // 인증 경계 — 본인 데이터만 조회 (rpc가 auth.uid()로 스코핑)
  if (!(await getAuthUser())) {
    return NextResponse.json<ApiError>(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);

  // limit 검증 (정수, 1~MAX_LIMIT, 기본 DEFAULT_LIMIT)
  let limit = DEFAULT_LIMIT;
  const limitParam = searchParams.get("limit");
  if (limitParam !== null) {
    const parsed = Number(limitParam);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LIMIT) {
      return NextResponse.json<ApiError>(
        { error: `limit must be an integer between 1 and ${MAX_LIMIT}` },
        { status: 400 },
      );
    }
    limit = parsed;
  }

  // cursor 검증 (있으면 파싱 가능한 날짜여야 함)
  const cursor = searchParams.get("cursor");
  if (cursor !== null && Number.isNaN(Date.parse(cursor))) {
    return NextResponse.json<ApiError>(
      { error: "cursor must be a valid ISO 8601 timestamp" },
      { status: 400 },
    );
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc("get_record_history", {
    p_limit: limit,
    ...(cursor !== null ? { p_cursor: cursor } : {}),
  });

  if (error || !data) {
    console.error("get_record_history rpc error:", error);
    return NextResponse.json<ApiError>(
      { error: "Failed to fetch history" },
      { status: 500 },
    );
  }

  const result = data as RecordRpcResult;

  return NextResponse.json<RecordResponse>({
    summary: {
      total: {
        count: result.summary.total.count,
        focusMinutes: result.summary.total.focus_minutes,
      },
      today: {
        count: result.summary.today.count,
        focusMinutes: result.summary.today.focus_minutes,
      },
    },
    logs: result.logs.map((log) => ({
      pomodoroId: log.pomodoro_id,
      completedAt: log.completed_at,
      focusMinutes: log.focus_minutes,
    })),
    nextCursor: result.next_cursor,
  });
}
