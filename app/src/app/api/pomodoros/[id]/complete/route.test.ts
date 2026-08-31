import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRpc = vi.fn();
const mockGetAuthUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => Promise.resolve({ rpc: mockRpc }),
}));

vi.mock("@/lib/supabase/auth", () => ({
  getAuthUser: () => mockGetAuthUser(),
}));

const { POST } = await import("./route");

function callPOST(id: string, body?: unknown) {
  const init: RequestInit = { method: "POST" };
  if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }
  const request = new Request(
    `http://localhost/api/pomodoros/${id}/complete`,
    init,
  );
  return POST(request, { params: Promise.resolve({ id }) });
}

describe("POST /api/pomodoros/:id/complete", () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockGetAuthUser.mockReset();
    mockGetAuthUser.mockResolvedValue({
      id: "test-user-id",
      email: "test@test.com",
    });
  });

  it("미인증 시 401", async () => {
    mockGetAuthUser.mockResolvedValue(null);
    const res = await callPOST("1");
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("성공 시 200 + 완료 정보 반환", async () => {
    mockRpc.mockResolvedValue({
      data: {
        pomodoro_id: 1,
        session_id: 1,
        completed_count: 2,
        target_count: 4,
      },
      error: null,
    });

    const res = await callPOST("1");
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual({
      pomodoroId: 1,
      sessionId: 1,
      completedCount: 2,
      targetCount: 4,
    });

    expect(mockRpc).toHaveBeenCalledWith("complete_pomodoro", {
      p_pomodoro_id: 1,
      p_note: undefined,
    });
  });

  it("잘못된 id 시 400", async () => {
    const res = await callPOST("abc");
    expect(res.status).toBe(400);
  });

  it("id 0 이하 시 400", async () => {
    const res = await callPOST("0");
    expect(res.status).toBe(400);
  });

  it("rpc 에러 시 500", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });

    const res = await callPOST("1");
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.error).toBe("Failed to complete pomodoro");
  });

  // --- note 관련 테스트 ---

  it("note 포함 시 rpc에 p_note 전달", async () => {
    mockRpc.mockResolvedValue({
      data: {
        pomodoro_id: 1,
        session_id: 1,
        completed_count: 1,
        target_count: 4,
      },
      error: null,
    });

    const res = await callPOST("1", { note: "오늘 집중 잘 됐다" });
    expect(res.status).toBe(200);

    expect(mockRpc).toHaveBeenCalledWith("complete_pomodoro", {
      p_pomodoro_id: 1,
      p_note: "오늘 집중 잘 됐다",
    });
  });

  it("note 미전송 시 p_note = undefined", async () => {
    mockRpc.mockResolvedValue({
      data: {
        pomodoro_id: 1,
        session_id: 1,
        completed_count: 1,
        target_count: 4,
      },
      error: null,
    });

    const res = await callPOST("1", {});
    expect(res.status).toBe(200);

    expect(mockRpc).toHaveBeenCalledWith("complete_pomodoro", {
      p_pomodoro_id: 1,
      p_note: undefined,
    });
  });

  it("note null 전송 시 p_note = undefined", async () => {
    mockRpc.mockResolvedValue({
      data: {
        pomodoro_id: 1,
        session_id: 1,
        completed_count: 1,
        target_count: 4,
      },
      error: null,
    });

    const res = await callPOST("1", { note: null });
    expect(res.status).toBe(200);

    expect(mockRpc).toHaveBeenCalledWith("complete_pomodoro", {
      p_pomodoro_id: 1,
      p_note: undefined,
    });
  });

  it("body 없이 호출 시 기존 호환 (p_note = undefined)", async () => {
    mockRpc.mockResolvedValue({
      data: {
        pomodoro_id: 1,
        session_id: 1,
        completed_count: 1,
        target_count: 4,
      },
      error: null,
    });

    const res = await callPOST("1");
    expect(res.status).toBe(200);

    expect(mockRpc).toHaveBeenCalledWith("complete_pomodoro", {
      p_pomodoro_id: 1,
      p_note: undefined,
    });
  });

  it("공백만 입력 시 p_note = undefined", async () => {
    mockRpc.mockResolvedValue({
      data: {
        pomodoro_id: 1,
        session_id: 1,
        completed_count: 1,
        target_count: 4,
      },
      error: null,
    });

    const res = await callPOST("1", { note: "   " });
    expect(res.status).toBe(200);

    expect(mockRpc).toHaveBeenCalledWith("complete_pomodoro", {
      p_pomodoro_id: 1,
      p_note: undefined,
    });
  });

  it("100자 초과 시 400", async () => {
    const longNote = "가".repeat(101);
    const res = await callPOST("1", { note: longNote });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("note must be 100 characters or less");
  });

  it("note가 string이 아닌 타입일 때 400", async () => {
    const res = await callPOST("1", { note: 123 });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("note must be a string or null");
  });

  it("note 정확히 100자면 허용", async () => {
    mockRpc.mockResolvedValue({
      data: {
        pomodoro_id: 1,
        session_id: 1,
        completed_count: 1,
        target_count: 4,
      },
      error: null,
    });

    const exactNote = "가".repeat(100);
    const res = await callPOST("1", { note: exactNote });
    expect(res.status).toBe(200);

    expect(mockRpc).toHaveBeenCalledWith("complete_pomodoro", {
      p_pomodoro_id: 1,
      p_note: exactNote,
    });
  });

  it("note 앞뒤 공백 trim 처리", async () => {
    mockRpc.mockResolvedValue({
      data: {
        pomodoro_id: 1,
        session_id: 1,
        completed_count: 1,
        target_count: 4,
      },
      error: null,
    });

    const res = await callPOST("1", { note: "  집중했다  " });
    expect(res.status).toBe(200);

    expect(mockRpc).toHaveBeenCalledWith("complete_pomodoro", {
      p_pomodoro_id: 1,
      p_note: "집중했다",
    });
  });
});
