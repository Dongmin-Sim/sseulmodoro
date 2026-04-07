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

function callPOST(id: string) {
  const request = new Request(`http://localhost/api/sessions/${id}/end`, {
    method: "POST",
  });
  return POST(request, { params: Promise.resolve({ id }) });
}

describe("POST /api/sessions/:id/end", () => {
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

  it("성공 시 200 + 포인트 정보 반환", async () => {
    mockRpc.mockResolvedValue({
      data: { session_id: 1, completed_count: 3, points_earned: 30, new_balance: 130 },
      error: null,
    });

    const res = await callPOST("1");
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual({
      sessionId: 1,
      completedCount: 3,
      pointsEarned: 30,
      newBalance: 130,
    });

    expect(mockRpc).toHaveBeenCalledWith("end_session", {
      p_session_id: 1,
    });
  });

  it("완료 포모도로 0개 시 포인트 0 반환", async () => {
    mockRpc.mockResolvedValue({
      data: { session_id: 1, completed_count: 0, points_earned: 0, new_balance: 100 },
      error: null,
    });

    const res = await callPOST("1");
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.pointsEarned).toBe(0);
    expect(json.completedCount).toBe(0);
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
    expect(json.error).toBe("Failed to end session");
  });
});
