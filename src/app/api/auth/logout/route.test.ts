import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSignOut = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () =>
    Promise.resolve({
      auth: { signOut: () => mockSignOut() },
    }),
}));

const { POST } = await import("./route");

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    mockSignOut.mockReset();
  });

  it("성공 시 200 + success: true", async () => {
    mockSignOut.mockResolvedValue({ error: null });
    const res = await POST();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ success: true });
  });

  it("signOut 에러 시 500", async () => {
    mockSignOut.mockResolvedValue({ error: { message: "signout failed" } });
    const res = await POST();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to logout");
  });

  it("세션 만료 에러 시에도 200 + success: true", async () => {
    mockSignOut.mockResolvedValue({ error: { message: "Auth session missing!", status: 400 } });
    const res = await POST();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ success: true });
  });
});
