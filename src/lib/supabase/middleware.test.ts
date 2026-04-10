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

  it("미인증 + / → /login 리다이렉트 (redirectTo 파라미터 없음)", async () => {
    mockGetClaims.mockResolvedValue({ data: { claims: null } });

    const response = await updateSession(createRequest("/"));
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.has("redirectTo")).toBe(false);
  });

  it("미인증 + 비루트 보호 경로 → /login?redirectTo=경로 리다이렉트", async () => {
    mockGetClaims.mockResolvedValue({ data: { claims: null } });

    const response = await updateSession(createRequest("/dashboard"));
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("redirectTo")).toBe("/dashboard");
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
