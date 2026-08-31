import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
    }),
}));

const { getAuthUser } = await import("./auth");

describe("getAuthUser", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
  });

  it("인증된 유저 반환", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@test.com" } },
      error: null,
    });

    const user = await getAuthUser();
    expect(user).toEqual({ id: "user-123", email: "test@test.com" });
  });

  it("미인증 시 null 반환", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const user = await getAuthUser();
    expect(user).toBeNull();
  });

  it("에러 발생 시 null 반환", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid token" },
    });

    const user = await getAuthUser();
    expect(user).toBeNull();
  });

  it("이메일 없는 유저는 null 반환", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: null } },
      error: null,
    });

    const user = await getAuthUser();
    expect(user).toBeNull();
  });
});
