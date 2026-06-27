import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockRpc = vi.fn();
const mockGetAuthUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => Promise.resolve({ rpc: mockRpc }),
}));

vi.mock("@/lib/supabase/auth", () => ({
  getAuthUser: () => mockGetAuthUser(),
}));

const { POST } = await import("./route");

describe("POST /api/characters/main", () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockGetAuthUser.mockReset();
    mockGetAuthUser.mockResolvedValue({ id: "test-user-id", email: "test@test.com" });
  });

  it("should return 401 when user is not authenticated", async () => {
    // Arrange
    mockGetAuthUser.mockResolvedValue(null);
    const request = new NextRequest("http://localhost/api/characters/main", {
      method: "POST",
      body: JSON.stringify({ instanceId: 1 }),
      headers: { "Content-Type": "application/json" },
    });

    // Act
    const res = await POST(request);

    // Assert
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("should return 400 when instanceId is missing", async () => {
    // Arrange
    const request = new NextRequest("http://localhost/api/characters/main", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    // Act
    const res = await POST(request);

    // Assert
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("instanceId is required");
  });

  it("should return 400 when instanceId is not an integer", async () => {
    // Arrange
    const request = new NextRequest("http://localhost/api/characters/main", {
      method: "POST",
      body: JSON.stringify({ instanceId: 1.5 }),
      headers: { "Content-Type": "application/json" },
    });

    // Act
    const res = await POST(request);

    // Assert
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("instanceId is required");
  });

  it("should return 404 when rpc returns instance_not_found", async () => {
    // Arrange
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "instance_not_found", code: "P0002" },
    });
    const request = new NextRequest("http://localhost/api/characters/main", {
      method: "POST",
      body: JSON.stringify({ instanceId: 99 }),
      headers: { "Content-Type": "application/json" },
    });

    // Act
    const res = await POST(request);

    // Assert
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Character not found");
  });

  it("should return 500 when rpc returns unexpected error", async () => {
    // Arrange
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "unexpected db error", code: "42000" },
    });
    const request = new NextRequest("http://localhost/api/characters/main", {
      method: "POST",
      body: JSON.stringify({ instanceId: 1 }),
      headers: { "Content-Type": "application/json" },
    });

    // Act
    const res = await POST(request);

    // Assert
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal server error");
  });

  it("should return 200 with instanceId when request is valid", async () => {
    // Arrange
    mockRpc.mockResolvedValue({
      data: { instance_id: 7 },
      error: null,
    });
    const request = new NextRequest("http://localhost/api/characters/main", {
      method: "POST",
      body: JSON.stringify({ instanceId: 7 }),
      headers: { "Content-Type": "application/json" },
    });

    // Act
    const res = await POST(request);

    // Assert
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ instanceId: 7 });
    expect(mockRpc).toHaveBeenCalledWith("set_main_character", { p_instance_id: 7 });
  });
});
