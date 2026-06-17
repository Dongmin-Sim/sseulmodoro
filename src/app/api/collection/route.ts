import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import type {
  CollectionResponse,
  CollectionType,
  CollectionInstance,
  ApiError,
} from "@/lib/types/api";

export async function GET() {
  // 인증 경계 — 본인 보유 인스턴스만 조회 (user.id로 스코핑)
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json<ApiError>(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const supabase = await createServerClient();

  // 전체 종(고정 7종) + 본인 보유 인스턴스를 병렬 조회
  const [typesResult, instancesResult] = await Promise.all([
    supabase
      .from("character_types")
      .select("id, name, rarity, slug, description")
      .order("id"),
    supabase
      .from("character_instances")
      .select("id, character_type_id, level, created_at")
      .eq("user_id", user.id)
      .order("created_at"),
  ]);

  if (typesResult.error || !typesResult.data) {
    console.error("character_types query error:", typesResult.error);
    return NextResponse.json<ApiError>(
      { error: "Failed to fetch collection" },
      { status: 500 },
    );
  }
  if (instancesResult.error || !instancesResult.data) {
    console.error("character_instances query error:", instancesResult.error);
    return NextResponse.json<ApiError>(
      { error: "Failed to fetch collection" },
      { status: 500 },
    );
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

  return NextResponse.json<CollectionResponse>({
    types,
    ownedTypeCount: types.filter((t) => t.owned).length,
    totalTypeCount: types.length,
  });
}
