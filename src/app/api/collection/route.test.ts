import { describe, it, expect, vi, beforeEach } from "vitest";

const mockTypesQuery = vi.fn();
const mockInstancesQuery = vi.fn();
const mockGetAuthUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () =>
    Promise.resolve({
      from: (table: string) => {
        const resolver =
          table === "character_types" ? mockTypesQuery : mockInstancesQuery;
        const builder = {
          select: () => builder,
          eq: () => builder,
          order: () => resolver(),
        };
        return builder;
      },
    }),
}));

vi.mock("@/lib/supabase/auth", () => ({
  getAuthUser: () => mockGetAuthUser(),
}));

const { GET } = await import("./route");

const SAMPLE_TYPES = [
  {
    id: 1,
    name: "파랑새",
    rarity: "common",
    slug: "bluebird",
    description: "맑은 날의 친구",
  },
  { id: 2, name: "참새", rarity: "rare", slug: "sparrow", description: null },
];

// 유저는 종 1을 2마리 보유, 종 2는 미보유
const SAMPLE_INSTANCES = [
  {
    id: 10,
    character_type_id: 1,
    level: 2,
    created_at: "2026-06-01T00:00:00.000Z",
  },
  {
    id: 11,
    character_type_id: 1,
    level: 1,
    created_at: "2026-06-02T00:00:00.000Z",
  },
];

describe("GET /api/collection", () => {
  beforeEach(() => {
    mockTypesQuery.mockReset();
    mockInstancesQuery.mockReset();
    mockGetAuthUser.mockReset();
    mockGetAuthUser.mockResolvedValue({
      id: "test-user-id",
      email: "test@test.com",
    });
    mockTypesQuery.mockReturnValue({ data: SAMPLE_TYPES, error: null });
    mockInstancesQuery.mockReturnValue({ data: SAMPLE_INSTANCES, error: null });
  });

  it("should return 401 when user is not authenticated", async () => {
    // Arrange
    mockGetAuthUser.mockResolvedValue(null);

    // Act
    const res = await GET();

    // Assert
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("should return 200 with owned types exposing name and all instances", async () => {
    // Act
    const res = await GET();

    // Assert
    expect(res.status).toBe(200);
    const json = await res.json();
    const owned = json.types.find(
      (t: { typeId: number }) => t.typeId === 1,
    );
    expect(owned).toEqual({
      typeId: 1,
      rarity: "common",
      owned: true,
      name: "파랑새",
      slug: "bluebird",
      description: "맑은 날의 친구",
      instances: [
        { instanceId: 10, level: 2, createdAt: "2026-06-01T00:00:00.000Z" },
        { instanceId: 11, level: 1, createdAt: "2026-06-02T00:00:00.000Z" },
      ],
    });
  });

  it("should return 200 with unowned types locked to rarity only (name hidden)", async () => {
    // Act
    const res = await GET();

    // Assert
    const json = await res.json();
    const locked = json.types.find(
      (t: { typeId: number }) => t.typeId === 2,
    );
    expect(locked).toEqual({ typeId: 2, rarity: "rare", owned: false });
    expect(locked.name).toBeUndefined();
    expect(locked.slug).toBeUndefined();
  });

  it("should return correct owned and total counts", async () => {
    // Act
    const res = await GET();

    // Assert
    const json = await res.json();
    expect(json.ownedTypeCount).toBe(1);
    expect(json.totalTypeCount).toBe(2);
  });

  it("should return all types locked when user owns nothing", async () => {
    // Arrange
    mockInstancesQuery.mockReturnValue({ data: [], error: null });

    // Act
    const res = await GET();

    // Assert
    const json = await res.json();
    expect(json.ownedTypeCount).toBe(0);
    expect(json.types.every((t: { owned: boolean }) => !t.owned)).toBe(true);
  });

  it("should return 500 when character_types query fails", async () => {
    // Arrange
    mockTypesQuery.mockReturnValue({
      data: null,
      error: { message: "DB error" },
    });

    // Act
    const res = await GET();

    // Assert
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to fetch collection");
  });

  it("should return 500 when character_instances query fails", async () => {
    // Arrange
    mockInstancesQuery.mockReturnValue({
      data: null,
      error: { message: "DB error" },
    });

    // Act
    const res = await GET();

    // Assert
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to fetch collection");
  });
});
