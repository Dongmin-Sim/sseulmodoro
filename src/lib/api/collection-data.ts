import { createServerClient } from "@/lib/supabase/server";
import type {
  CollectionResponse,
  CollectionType,
  CollectionInstance,
} from "@/lib/types/api";

/**
 * 도감 목록 데이터를 서버에서 로드한다.
 * 서버 컴포넌트는 자기 API Route에 상대 fetch를 할 수 없어
 * (origin 없음) Supabase를 직접 조회한다. GET /api/collection과 동일 로직.
 */
export async function loadCollectionData(
  userId: string,
): Promise<CollectionResponse> {
  const supabase = await createServerClient();

  const [typesResult, instancesResult] = await Promise.all([
    supabase
      .from("character_types")
      .select("id, name, rarity, slug, description")
      .order("id"),
    supabase
      .from("character_instances")
      .select("id, character_type_id, level, created_at")
      .eq("user_id", userId)
      .order("created_at"),
  ]);

  if (typesResult.error || !typesResult.data) {
    throw new Error("collection types query failed");
  }
  if (instancesResult.error || !instancesResult.data) {
    throw new Error("collection instances query failed");
  }

  // 종별 보유 인스턴스 그룹화
  const instancesByType = new Map<number, CollectionInstance[]>();
  for (const inst of instancesResult.data) {
    const prev = instancesByType.get(inst.character_type_id) ?? [];
    instancesByType.set(inst.character_type_id, [
      ...prev,
      { instanceId: inst.id, level: inst.level, createdAt: inst.created_at },
    ]);
  }

  // 보유 종은 이름·외형 공개, 미보유 종은 rarity만 노출(잠금)
  const types: CollectionType[] = typesResult.data.map((t) => {
    const instances = instancesByType.get(t.id);
    if (instances && instances.length > 0) {
      return {
        typeId: t.id,
        rarity: t.rarity,
        owned: true,
        name: t.name,
        slug: t.slug,
        description: t.description,
        instances,
      };
    }
    return { typeId: t.id, rarity: t.rarity, owned: false };
  });

  return {
    types,
    ownedTypeCount: types.filter((t) => t.owned).length,
    totalTypeCount: types.length,
  };
}
