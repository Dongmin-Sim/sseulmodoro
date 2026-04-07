import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRpc = vi.fn();

vi.mock("@/lib/supabase/server", () => {
  return {
    createServerClient: () => Promise.resolve({ rpc: mockRpc }),
  };
});

const { POST } = await import("./route");

function createRequest(body: unknown) {
  return new Request("http://localhost/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/sessions", () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it("성공 시 201 + sessionId, pomodoroId 반환", async () => {
    mockRpc.mockResolvedValue({
      data: { session_id: 1, pomodoro_id: 1 },
      error: null,
    });

    const res = await POST(createRequest({ focusMinutes: 25 }));
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json).toEqual({ sessionId: 1, pomodoroId: 1 });

    expect(mockRpc).toHaveBeenCalledWith(
      "start_session",
      expect.objectContaining({
        p_focus_minutes: 25,
        p_target_count: 4,
        p_short_break_minutes: 5,
        p_long_break_minutes: 15,
      }),
    );
  });

  it("focusMinutes 누락 시 400", async () => {
    const res = await POST(createRequest({}));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("focusMinutes 범위 초과 시 400", async () => {
    const res = await POST(createRequest({ focusMinutes: 121 }));
    expect(res.status).toBe(400);
  });

  it("focusMinutes 0 이하 시 400", async () => {
    const res = await POST(createRequest({ focusMinutes: 0 }));
    expect(res.status).toBe(400);
  });

  it("rpc 에러 시 500", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "DB error", code: "42000" },
    });

    const res = await POST(createRequest({ focusMinutes: 25 }));
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.error).toBe("Failed to start session");
  });

  it("잘못된 JSON body 시 400", async () => {
    const req = new Request("http://localhost/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid json",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("Invalid request body");
  });

  it("커스텀 세션 설정 전달 시 rpc에 올바르게 전달", async () => {
    mockRpc.mockResolvedValue({
      data: { session_id: 1, pomodoro_id: 1 },
      error: null,
    });

    const res = await POST(
      createRequest({
        focusMinutes: 30,
        shortBreakMinutes: 10,
        longBreakMinutes: 20,
        targetCount: 6,
      }),
    );
    expect(res.status).toBe(201);

    expect(mockRpc).toHaveBeenCalledWith(
      "start_session",
      expect.objectContaining({
        p_focus_minutes: 30,
        p_short_break_minutes: 10,
        p_long_break_minutes: 20,
        p_target_count: 6,
      }),
    );
  });

  it("부분 설정 시 SESSION_DEFAULTS로 fallback", async () => {
    mockRpc.mockResolvedValue({
      data: { session_id: 1, pomodoro_id: 1 },
      error: null,
    });

    const res = await POST(
      createRequest({ focusMinutes: 25, targetCount: 2 }),
    );
    expect(res.status).toBe(201);

    expect(mockRpc).toHaveBeenCalledWith(
      "start_session",
      expect.objectContaining({
        p_focus_minutes: 25,
        p_short_break_minutes: 5,
        p_long_break_minutes: 15,
        p_target_count: 2,
      }),
    );
  });

  it("shortBreakMinutes 범위 초과 시 400", async () => {
    const res = await POST(
      createRequest({ focusMinutes: 25, shortBreakMinutes: 31 }),
    );
    expect(res.status).toBe(400);
  });

  it("shortBreakMinutes 0 이하 시 400", async () => {
    const res = await POST(
      createRequest({ focusMinutes: 25, shortBreakMinutes: 0 }),
    );
    expect(res.status).toBe(400);
  });

  it("longBreakMinutes 범위 초과 시 400", async () => {
    const res = await POST(
      createRequest({ focusMinutes: 25, longBreakMinutes: 61 }),
    );
    expect(res.status).toBe(400);
  });

  it("targetCount 범위 초과 시 400", async () => {
    const res = await POST(
      createRequest({ focusMinutes: 25, targetCount: 9 }),
    );
    expect(res.status).toBe(400);
  });

  it("targetCount 비정수 시 400", async () => {
    const res = await POST(
      createRequest({ focusMinutes: 25, targetCount: 2.5 }),
    );
    expect(res.status).toBe(400);
  });
});
