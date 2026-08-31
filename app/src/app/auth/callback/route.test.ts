import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExchange = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () =>
    Promise.resolve({
      auth: { exchangeCodeForSession: mockExchange },
    }),
}));

const { GET } = await import("./route");

function makeRequest(query: string) {
  return new Request(`http://localhost/auth/callback${query}`);
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    mockExchange.mockReset();
  });

  it("should redirect to /home when code exchange succeeds", async () => {
    // Arrange
    mockExchange.mockResolvedValue({ error: null });

    // Act
    const res = await GET(makeRequest("?code=valid-code"));

    // Assert
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/home");
    expect(mockExchange).toHaveBeenCalledWith("valid-code");
  });

  it("should redirect to /signup?error=oauth when code is missing", async () => {
    // Act
    const res = await GET(makeRequest(""));

    // Assert
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/signup?error=oauth");
    expect(mockExchange).not.toHaveBeenCalled();
  });

  it("should redirect to /signup?error=oauth when code exchange fails", async () => {
    // Arrange
    mockExchange.mockResolvedValue({ error: { message: "exchange failed" } });

    // Act
    const res = await GET(makeRequest("?code=bad-code"));

    // Assert
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/signup?error=oauth");
  });
});
