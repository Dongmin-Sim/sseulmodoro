import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetAuthUser = vi.fn();

// profiles.update(payload).eq(field, value) 체인 모킹
// update()가 받은 인자를 기록하고, eq()는 { error } 를 반환하도록 구성
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
  return new NextRequest("http://localhost/api/onboarding/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/onboarding/complete", () => {
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
    const request = createRequest({ nickname: "테스터" });

    // Act
    const res = await POST(request);

    // Assert
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("should return 200 with success:true and update with nickname when nickname is provided", async () => {
    // Arrange
    mockEq.mockResolvedValue({ error: null });
    const request = createRequest({ nickname: "모또" });

    // Act
    const res = await POST(request);

    // Assert
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith({ onboarding_completed: true, nickname: "모또" });
    expect(mockEq).toHaveBeenCalledWith("id", "test-user-id");
  });

  it("should return 200 and update without nickname when nickname is empty string", async () => {
    // Arrange
    mockEq.mockResolvedValue({ error: null });
    const request = createRequest({ nickname: "" });

    // Act
    const res = await POST(request);

    // Assert
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith({ onboarding_completed: true });
  });

  it("should return 200 and update without nickname when nickname field is missing", async () => {
    // Arrange
    mockEq.mockResolvedValue({ error: null });
    const request = createRequest({});

    // Act
    const res = await POST(request);

    // Assert
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ onboarding_completed: true });
  });

  it("should return 200 and update without nickname when nickname is whitespace only", async () => {
    // Arrange
    mockEq.mockResolvedValue({ error: null });
    const request = createRequest({ nickname: "   " });

    // Act
    const res = await POST(request);

    // Assert
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ onboarding_completed: true });
  });

  it("should return 500 when profiles update returns error", async () => {
    // Arrange
    mockEq.mockResolvedValue({ error: { message: "db error" } });
    const request = createRequest({ nickname: "모또" });

    // Act
    const res = await POST(request);

    // Assert
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal server error");
  });
});
