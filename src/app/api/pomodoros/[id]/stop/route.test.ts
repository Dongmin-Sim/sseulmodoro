import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRpc = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => Promise.resolve({ rpc: mockRpc }),
}));

const { POST } = await import("./route");

function callPOST(id: string) {
  const request = new Request(`http://localhost/api/pomodoros/${id}/stop`, {
    method: "POST",
  });
  return POST(request, { params: Promise.resolve({ id }) });
}

describe("POST /api/pomodoros/:id/stop", () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it("성공 시 200 + 중지 정보 반환", async () => {
    mockRpc.mockResolvedValue({
      data: { pomodoro_id: 1, session_id: 1 },
      error: null,
    });

    const res = await callPOST("1");
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual({
      pomodoroId: 1,
      sessionId: 1,
    });

    expect(mockRpc).toHaveBeenCalledWith("stop_pomodoro", {
      p_pomodoro_id: 1,
      p_user_id: expect.any(String),
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
    expect(json.error).toBe("Failed to stop pomodoro");
  });
});
