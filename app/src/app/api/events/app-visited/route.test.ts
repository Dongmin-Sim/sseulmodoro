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

describe("POST /api/events/app-visited", () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockGetAuthUser.mockReset();
    mockGetAuthUser.mockResolvedValue({ id: "test-user-id", email: "test@test.com" });
    mockRpc.mockResolvedValue({ error: null });
  });

  it("should return 401 when user is not authenticated", async () => {
    // Arrange
    mockGetAuthUser.mockResolvedValue(null);

    // Act
    const res = await POST();

    // Assert
    expect(res.status).toBe(401);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("should return 500 when rpc errors", async () => {
    // Arrange
    mockRpc.mockResolvedValue({ error: { message: "db down" } });

    // Act
    const res = await POST();

    // Assert
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal server error");
  });

  it("should return 204 and call log_app_visited when request is valid", async () => {
    // Act
    const res = await POST();

    // Assert
    expect(res.status).toBe(204);
    expect(mockRpc).toHaveBeenCalledWith("log_app_visited");
  });
});
