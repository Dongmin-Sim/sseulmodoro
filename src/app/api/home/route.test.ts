import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetAuthUser = vi.fn();
const mockProfileSingle = vi.fn();
const mockMainCharacterMaybeSingle = vi.fn();

vi.mock("@/lib/supabase/auth", () => ({
  getAuthUser: () => mockGetAuthUser(),
}));

const makeChain = (terminalFn: ReturnType<typeof vi.fn>) => {
  const handler: ProxyHandler<object> = {
    get: (_: object, prop: string) => {
      if (prop === "single" || prop === "maybeSingle") return terminalFn;
      return () => new Proxy({}, handler);
    },
  };
  return new Proxy({}, handler);
};

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (table === "profiles") return makeChain(mockProfileSingle);
        if (table === "character_instances") return makeChain(mockMainCharacterMaybeSingle);
      },
    }),
}));

const { GET } = await import("./route");

describe("GET /api/home", () => {
  beforeEach(() => {
    mockGetAuthUser.mockReset();
    mockProfileSingle.mockReset();
    mockMainCharacterMaybeSingle.mockReset();
    mockGetAuthUser.mockResolvedValue({ id: "test-user-id", email: "test@test.com" });
  });

  it("미인증 시 401", async () => {
    mockGetAuthUser.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("profiles 쿼리 에러 시 500", async () => {
    mockProfileSingle.mockResolvedValue({ data: null, error: { message: "db error" } });
    mockMainCharacterMaybeSingle.mockResolvedValue({ data: null, error: null });
    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to fetch home data");
  });

  it("sessions 쿼리 에러 시 500", async () => {
    mockProfileSingle.mockResolvedValue({ data: { balance: 100 }, error: null });
    mockMainCharacterMaybeSingle.mockResolvedValue({ data: null, error: { message: "db error" } });
    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to fetch home data");
  });

  it("대표 캐릭터 없을 시 200 + mainCharacter null", async () => {
    mockProfileSingle.mockResolvedValue({ data: { balance: 200 }, error: null });
    mockMainCharacterMaybeSingle.mockResolvedValue({ data: null, error: null });
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ balance: 200, mainCharacter: null });
  });

  it("is_main 캐릭터 있으나 character_types null 시 200 + mainCharacter null", async () => {
    mockProfileSingle.mockResolvedValue({ data: { balance: 100 }, error: null });
    mockMainCharacterMaybeSingle.mockResolvedValue({
      data: { id: 5, level: 1, character_types: null },
      error: null,
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ balance: 100, mainCharacter: null });
  });

  it("성공 시 200 + 응답 shape 검증", async () => {
    mockProfileSingle.mockResolvedValue({ data: { balance: 350 }, error: null });
    mockMainCharacterMaybeSingle.mockResolvedValue({
      data: {
        id: 5,
        level: 3,
        character_types: { name: "공부하는 모또", rarity: "common" },
      },
      error: null,
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      balance: 350,
      mainCharacter: {
        instanceId: 5,
        name: "공부하는 모또",
        level: 3,
        rarity: "common",
      },
    });
  });
});
