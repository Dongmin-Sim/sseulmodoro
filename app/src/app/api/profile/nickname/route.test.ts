import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetAuthUser = vi.fn();
const mockEq = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: mockEq }));

vi.mock("@/lib/supabase/auth", () => ({
  getAuthUser: () => mockGetAuthUser(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () =>
    Promise.resolve({
      from: () => ({ update: mockUpdate }),
    }),
}));

const { POST } = await import("./route");

function createRequest(body: unknown) {
  return new NextRequest("http://localhost/api/profile/nickname", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/profile/nickname", () => {
  beforeEach(() => {
    mockGetAuthUser.mockReset();
    mockUpdate.mockReset();
    mockEq.mockReset();
    mockUpdate.mockImplementation(() => ({ eq: mockEq }));
    mockGetAuthUser.mockResolvedValue({ id: "test-user-id", email: "test@test.com" });
  });

  it("should return 401 when user is not authenticated", async () => {
    // Arrange
    mockGetAuthUser.mockResolvedValue(null);
    const request = createRequest({ nickname: "testuser" });

    // Act
    const res = await POST(request);

    // Assert
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("should return 400 when nickname is too short", async () => {
    // Arrange
    const request = createRequest({ nickname: "a" });

    // Act
    const res = await POST(request);

    // Assert
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalid_nickname");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("should return 400 when nickname contains special characters", async () => {
    // Arrange
    const request = createRequest({ nickname: "user!" });

    // Act
    const res = await POST(request);

    // Assert
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalid_nickname");
  });

  it("should return 400 when nickname exceeds 12 characters", async () => {
    // Arrange
    const request = createRequest({ nickname: "abcdefghijklm" });

    // Act
    const res = await POST(request);

    // Assert
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalid_nickname");
  });

  it("should return 400 when nickname is empty string", async () => {
    // Arrange
    const request = createRequest({ nickname: "" });

    // Act
    const res = await POST(request);

    // Assert
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalid_nickname");
  });

  it("should return 409 when nickname is already taken (unique violation)", async () => {
    // Arrange
    mockEq.mockResolvedValue({ error: { code: "23505", message: "duplicate key" } });
    const request = createRequest({ nickname: "모또" });

    // Act
    const res = await POST(request);

    // Assert
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toBe("nickname_taken");
  });

  it("should return 500 when profiles update returns other error", async () => {
    // Arrange
    mockEq.mockResolvedValue({ error: { code: "42P01", message: "table not found" } });
    const request = createRequest({ nickname: "testuser" });

    // Act
    const res = await POST(request);

    // Assert
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal server error");
  });

  it("should return 200 with nickname when request is valid", async () => {
    // Arrange
    mockEq.mockResolvedValue({ error: null });
    const request = createRequest({ nickname: "모또" });

    // Act
    const res = await POST(request);

    // Assert
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ nickname: "모또" });
  });

  it("should update using server session user id, not request body", async () => {
    // Arrange
    mockEq.mockResolvedValue({ error: null });
    const request = createRequest({ nickname: "testuser" });

    // Act
    await POST(request);

    // Assert
    expect(mockUpdate).toHaveBeenCalledWith({ nickname: "testuser" });
    expect(mockEq).toHaveBeenCalledWith("id", "test-user-id");
  });
});
