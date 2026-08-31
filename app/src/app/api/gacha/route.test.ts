import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRpc = vi.fn();
const mockSingle = vi.fn();
const mockGetAuthUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () =>
    Promise.resolve({
      rpc: mockRpc,
      from: () => ({
        select: () => ({
          eq: () => ({
            single: mockSingle,
          }),
        }),
      }),
    }),
}));

vi.mock("@/lib/supabase/auth", () => ({
  getAuthUser: () => mockGetAuthUser(),
}));

const { POST } = await import("./route");

const VALID_RPC_DATA = {
  instance_id: 1,
  type_id: 3,
  name: "공부하는 모또",
  rarity: "common",
  level: 1,
  new_balance: 150,
  is_new: true,
};

describe("POST /api/gacha", () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockSingle.mockReset();
    mockGetAuthUser.mockReset();
    mockGetAuthUser.mockResolvedValue({
      id: "test-user-id",
      email: "test@test.com",
    });
    mockSingle.mockResolvedValue({ data: { slug: "bluebird" }, error: null });
  });

  it("should return 401 when user is not authenticated", async () => {
    // Arrange
    mockGetAuthUser.mockResolvedValue(null);

    // Act
    const res = await POST();

    // Assert
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("should return 400 when balance is insufficient", async () => {
    // Arrange
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "insufficient_balance", code: "P0001" },
    });

    // Act
    const res = await POST();

    // Assert
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Insufficient balance");
  });

  it("should return 500 when rpc returns unexpected error", async () => {
    // Arrange
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "unexpected db error", code: "42000" },
    });

    // Act
    const res = await POST();

    // Assert
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to draw character");
  });

  it("should return 500 when rpc returns null data", async () => {
    // Arrange
    mockRpc.mockResolvedValue({ data: null, error: null });

    // Act
    const res = await POST();

    // Assert
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to draw character");
  });

  it("should return 500 when rpc config is missing", async () => {
    // Arrange
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "gacha_cost config missing", code: "P0002" },
    });

    // Act
    const res = await POST();

    // Assert
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to draw character");
  });

  it("should return 500 when rpc returns unexpected shape", async () => {
    // Arrange
    mockRpc.mockResolvedValue({ data: { unexpected: "shape" }, error: null });

    // Act
    const res = await POST();

    // Assert
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to draw character");
  });

  it("should return 500 when character_types slug lookup fails", async () => {
    // Arrange
    mockRpc.mockResolvedValue({ data: VALID_RPC_DATA, error: null });
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "no rows returned", code: "PGRST116" },
    });

    // Act
    const res = await POST();

    // Assert
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal server error");
  });

  it("should pass through mythic rarity from rpc when a mythic character is drawn", async () => {
    // Arrange
    mockRpc.mockResolvedValue({
      data: {
        instance_id: 8,
        type_id: 8,
        name: "맴새",
        rarity: "mythic",
        level: 1,
        new_balance: 100,
        is_new: true,
      },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: { slug: "maemsae" }, error: null });

    // Act
    const res = await POST();

    // Assert
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.characterInstance.rarity).toBe("mythic");
    expect(json.characterInstance.slug).toBe("maemsae");
  });

  it("should return 201 with characterInstance including slug when request is valid", async () => {
    // Arrange
    mockRpc.mockResolvedValue({ data: VALID_RPC_DATA, error: null });
    mockSingle.mockResolvedValue({ data: { slug: "bluebird" }, error: null });

    // Act
    const res = await POST();

    // Assert
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toEqual({
      characterInstance: {
        instanceId: 1,
        typeId: 3,
        name: "공부하는 모또",
        rarity: "common",
        level: 1,
        slug: "bluebird",
      },
      newBalance: 150,
      isNew: true,
    });
    expect(mockRpc).toHaveBeenCalledWith("gacha");
    expect(mockSingle).toHaveBeenCalled();
  });
});
