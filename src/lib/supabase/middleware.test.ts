import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetClaims = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getClaims: mockGetClaims },
  }),
}));

const { updateSession } = await import("./middleware");

function createRequest(pathname: string): NextRequest {
  return new NextRequest(new URL(pathname, "http://localhost:3000"));
}

describe("updateSession (auth redirect)", () => {
  beforeEach(() => {
    mockGetClaims.mockReset();
  });

  it("미인증 + 보호 경로 → /login 리다이렉트", async () => {
    mockGetClaims.mockResolvedValue({ data: { claims: null } });

    const response = await updateSession(createRequest("/"));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/login");
  });

  it("미인증 + /login → 통과 (리다이렉트 안 함)", async () => {
    mockGetClaims.mockResolvedValue({ data: { claims: null } });

    const response = await updateSession(createRequest("/login"));
    expect(response.status).toBe(200);
  });

  it("미인증 + /signup → 통과 (리다이렉트 안 함)", async () => {
    mockGetClaims.mockResolvedValue({ data: { claims: null } });

    const response = await updateSession(createRequest("/signup"));
    expect(response.status).toBe(200);
  });

  it("인증됨 + / → 통과", async () => {
    mockGetClaims.mockResolvedValue({
      data: { claims: { sub: "user-123" } },
    });

    const response = await updateSession(createRequest("/"));
    expect(response.status).toBe(200);
  });

  it("인증됨 + /login → / 리다이렉트", async () => {
    mockGetClaims.mockResolvedValue({
      data: { claims: { sub: "user-123" } },
    });

    const response = await updateSession(createRequest("/login"));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/");
  });

  it("/api/* → 리다이렉트 안 함 (인증 무관)", async () => {
    mockGetClaims.mockResolvedValue({ data: { claims: null } });

    const response = await updateSession(createRequest("/api/sessions"));
    expect(response.status).toBe(200);
  });
});
