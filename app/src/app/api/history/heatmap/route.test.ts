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

const sampleHeatmap = [
  { date: "2026-06-01", count: 3 },
  { date: "2026-06-02", count: 1 },
];

describe("GET /api/history/heatmap", () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockGetAuthUser.mockReset();
    mockGetAuthUser.mockResolvedValue({ id: "test-user-id", email: "test@test.com" });
  });

  it("should return 401 when user is not authenticated", async () => {
    // Arrange
    mockGetAuthUser.mockResolvedValue(null);

    // Act
    const res = await GET();

    // Assert
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("should return 500 when rpc returns error", async () => {
    // Arrange
    mockRpc.mockResolvedValue({ data: null, error: { message: "DB error" } });

    // Act
    const res = await GET();

    // Assert
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal server error");
  });

  it("should return 200 with heatmap array when request is valid", async () => {
    // Arrange
    mockRpc.mockResolvedValue({ data: sampleHeatmap, error: null });

    // Act
    const res = await GET();

    // Assert
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(sampleHeatmap);
  });

  it("should return 200 with empty array when no focus data exists", async () => {
    // Arrange
    mockRpc.mockResolvedValue({ data: [], error: null });

    // Act
    const res = await GET();

    // Assert
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([]);
  });

  it("should call rpc with get_focus_heatmap and empty args", async () => {
    // Arrange
    mockRpc.mockResolvedValue({ data: sampleHeatmap, error: null });

    // Act
    await GET();

    // Assert
    expect(mockRpc).toHaveBeenCalledWith("get_focus_heatmap", {});
  });
});
