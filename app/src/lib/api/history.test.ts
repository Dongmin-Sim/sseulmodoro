import { describe, it, expect, vi, beforeEach } from "vitest";
import { getHistory } from "./history";

const sample = {
  summary: {
    total: { count: 1, focusMinutes: 25 },
    today: { count: 1, focusMinutes: 25 },
  },
  logs: [
    { pomodoroId: 1, completedAt: "2026-06-02T05:30:00+00:00", focusMinutes: 25 },
  ],
  nextCursor: null,
};

describe("getHistory", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("커서·limit 없으면 쿼리스트링 없이 호출", async () => {
    // Arrange
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sample,
    });
    vi.stubGlobal("fetch", fetchMock);

    // Act
    const result = await getHistory();

    // Assert
    expect(fetchMock).toHaveBeenCalledWith("/api/history");
    expect(result).toEqual(sample);
  });

  it("커서·limit 있으면 쿼리스트링에 조립", async () => {
    // Arrange
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sample,
    });
    vi.stubGlobal("fetch", fetchMock);

    // Act
    await getHistory("2026-06-01T13:00:00+00:00", 10);

    // Assert
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl.startsWith("/api/history?")).toBe(true);
    const params = new URLSearchParams(calledUrl.split("?")[1]);
    expect(params.get("cursor")).toBe("2026-06-01T13:00:00+00:00");
    expect(params.get("limit")).toBe("10");
  });

  it("non-ok 응답이면 서버 error 메시지로 throw", async () => {
    // Arrange
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Failed to fetch history" }),
      }),
    );

    // Act & Assert
    await expect(getHistory()).rejects.toThrow("Failed to fetch history");
  });

  it("네트워크 에러는 그대로 전파", async () => {
    // Arrange
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    // Act & Assert
    await expect(getHistory()).rejects.toThrow("Network error");
  });
});
