import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRpc = vi.fn();
const mockGetAuthUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => Promise.resolve({ rpc: mockRpc }),
}));

vi.mock("@/lib/supabase/auth", () => ({
  getAuthUser: () => mockGetAuthUser(),
}));

const { GET } = await import("./route");

function createRequest(query = "") {
  return new Request(`http://localhost/api/history${query}`);
}

const sampleRpcData = {
  summary: {
    total: { count: 3, focus_minutes: 75 },
    today: { count: 1, focus_minutes: 25 },
  },
  logs: [
    {
      pomodoro_id: 10,
      completed_at: "2026-06-02T05:30:00.000Z",
      focus_minutes: 25,
    },
  ],
  next_cursor: null,
};

describe("GET /api/history", () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockGetAuthUser.mockReset();
    mockGetAuthUser.mockResolvedValue({
      id: "test-user-id",
      email: "test@test.com",
    });
  });

  it("미인증 시 401", async () => {
    // Arrange
    mockGetAuthUser.mockResolvedValue(null);

    // Act
    const res = await GET(createRequest());

    // Assert
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("성공 시 200 + RecordResponse(camelCase) 반환", async () => {
    // Arrange
    mockRpc.mockResolvedValue({ data: sampleRpcData, error: null });

    // Act
    const res = await GET(createRequest());

    // Assert
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      summary: {
        total: { count: 3, focusMinutes: 75 },
        today: { count: 1, focusMinutes: 25 },
      },
      logs: [
        {
          pomodoroId: 10,
          completedAt: "2026-06-02T05:30:00.000Z",
          focusMinutes: 25,
        },
      ],
      nextCursor: null,
    });
  });

  it("빈 결과 시 200 + 빈 logs / 0 집계", async () => {
    // Arrange
    mockRpc.mockResolvedValue({
      data: {
        summary: {
          total: { count: 0, focus_minutes: 0 },
          today: { count: 0, focus_minutes: 0 },
        },
        logs: [],
        next_cursor: null,
      },
      error: null,
    });

    // Act
    const res = await GET(createRequest());

    // Assert
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.logs).toEqual([]);
    expect(json.summary.total.count).toBe(0);
    expect(json.nextCursor).toBeNull();
  });

  it("limit 비정수 시 400", async () => {
    const res = await GET(createRequest("?limit=2.5"));
    expect(res.status).toBe(400);
  });

  it("limit 0 시 400", async () => {
    const res = await GET(createRequest("?limit=0"));
    expect(res.status).toBe(400);
  });

  it("limit 범위 초과(51) 시 400", async () => {
    const res = await GET(createRequest("?limit=51"));
    expect(res.status).toBe(400);
  });

  it("cursor 파싱 불가 시 400", async () => {
    const res = await GET(createRequest("?cursor=not-a-date"));
    expect(res.status).toBe(400);
  });

  it("rpc 에러 시 500", async () => {
    // Arrange
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });

    // Act
    const res = await GET(createRequest());

    // Assert
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to fetch history");
  });

  it("cursor + limit를 rpc 인자로 전달", async () => {
    // Arrange
    mockRpc.mockResolvedValue({ data: sampleRpcData, error: null });
    const cursor = "2026-06-01T00:00:00.000Z";

    // Act
    await GET(createRequest(`?cursor=${encodeURIComponent(cursor)}&limit=10`));

    // Assert
    expect(mockRpc).toHaveBeenCalledWith("get_record_history", {
      p_limit: 10,
      p_cursor: cursor,
    });
  });

  it("cursor 미지정 시 p_cursor 미전달 + 기본 limit(20)", async () => {
    // Arrange
    mockRpc.mockResolvedValue({ data: sampleRpcData, error: null });

    // Act
    await GET(createRequest());

    // Assert
    expect(mockRpc).toHaveBeenCalledWith("get_record_history", {
      p_limit: 20,
    });
  });
});
