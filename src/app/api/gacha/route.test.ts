import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRpc = vi.fn();
const mockGetAuthUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => Promise.resolve({ rpc: mockRpc }),
}));

vi.mock("@/lib/supabase/auth", () => ({
  getAuthUser: () => mockGetAuthUser(),
}));

const { POST } = await import("./route");

describe("POST /api/gacha", () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockGetAuthUser.mockReset();
    mockGetAuthUser.mockResolvedValue({
      id: "test-user-id",
      email: "test@test.com",
    });
  });

  it("미인증 시 401", async () => {
    mockGetAuthUser.mockResolvedValue(null);
    const res = await POST();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("잔액 부족 시 400", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "insufficient_balance", code: "P0001" },
    });
    const res = await POST();
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Insufficient balance");
  });

  it("rpc 에러 시 500", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "unexpected db error", code: "42000" },
    });
    const res = await POST();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to draw character");
  });

  it("성공 시 201 + 응답 shape 검증", async () => {
    mockRpc.mockResolvedValue({
      data: {
        instance_id: 1,
        type_id: 3,
        name: "공부하는 모또",
        rarity: "common",
        level: 1,
        new_balance: 150,
        is_new: true,
      },
      error: null,
    });
    const res = await POST();
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toEqual({
      characterInstance: {
        instanceId: 1,
        typeId: 3,
        name: "공부하는 모또",
        rarity: "common",
        level: 1,
      },
      newBalance: 150,
      isNew: true,
    });
    expect(mockRpc).toHaveBeenCalledWith("gacha");
  });

  it("rpc가 null 반환 시 500", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    const res = await POST();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to draw character");
  });

  it("config missing 에러 시 500", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "gacha_cost config missing", code: "P0002" },
    });
    const res = await POST();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to draw character");
  });

  it("rpc가 잘못된 shape 반환 시 500", async () => {
    mockRpc.mockResolvedValue({ data: { unexpected: "shape" }, error: null });
    const res = await POST();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to draw character");
  });
});
