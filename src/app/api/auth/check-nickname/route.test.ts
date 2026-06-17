import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuery = vi.fn();
const mockGetAuthUser = vi.fn();

// profiles.select("id").ilike("nickname", value).maybeSingle() 체인 모킹
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () =>
    Promise.resolve({
      from: () => {
        const builder = {
          select: () => builder,
          ilike: () => builder,
          maybeSingle: () => mockQuery(),
        };
        return builder;
      },
    }),
}));

vi.mock("@/lib/supabase/auth", () => ({
  getAuthUser: () => mockGetAuthUser(),
}));

const { GET } = await import("./route");

function makeRequest(nickname?: string) {
  const url =
    nickname === undefined
      ? "http://localhost/api/auth/check-nickname"
      : `http://localhost/api/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`;
  return new Request(url);
}

describe("GET /api/auth/check-nickname", () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockGetAuthUser.mockReset();
    mockGetAuthUser.mockResolvedValue({ id: "user-1", email: "a@b.com" });
  });

  it("should return 401 when user is not authenticated", async () => {
    // Arrange
    mockGetAuthUser.mockResolvedValue(null);

    // Act
    const res = await GET(makeRequest("모또"));

    // Assert
    expect(res.status).toBe(401);
  });

  it("should return 400 when nickname format is invalid", async () => {
    // Arrange — 1자(길이 미달) + 특수문자
    // Act
    const tooShort = await GET(makeRequest("a"));
    const badChar = await GET(makeRequest("hello!"));

    // Assert
    expect(tooShort.status).toBe(400);
    expect(badChar.status).toBe(400);
  });

  it("should return 400 when nickname is missing", async () => {
    // Act
    const res = await GET(makeRequest());

    // Assert
    expect(res.status).toBe(400);
  });

  it("should return 200 with available:true when nickname is not taken", async () => {
    // Arrange
    mockQuery.mockResolvedValue({ data: null, error: null });

    // Act
    const res = await GET(makeRequest("모또"));

    // Assert
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ available: true });
  });

  it("should return 200 with available:false when nickname is already taken", async () => {
    // Arrange
    mockQuery.mockResolvedValue({ data: { id: "other-user" }, error: null });

    // Act
    const res = await GET(makeRequest("모또"));

    // Assert
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ available: false });
  });

  it("should return 500 when query returns an error", async () => {
    // Arrange
    mockQuery.mockResolvedValue({ data: null, error: { message: "db error" } });

    // Act
    const res = await GET(makeRequest("모또"));

    // Assert
    expect(res.status).toBe(500);
  });
});
