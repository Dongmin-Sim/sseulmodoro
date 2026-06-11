import { createServerClient } from "@/lib/supabase/server";
import type { HomeDataResponse } from "@/lib/types/api";

// 홈 데이터(잔액 + 대표 캐릭터) 조회 — 서버 단일 출처.
// 서버 컴포넌트(home/page.tsx)와 API Route(/api/home)가 함께 사용한다.
// 서버 컴포넌트가 자기 API를 상대 fetch하던 패턴(origin 없어 실패)을 대체.
export async function loadHomeData(userId: string): Promise<HomeDataResponse> {
  const supabase = await createServerClient();

  const [profileResult, mainCharacterResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("balance, onboarding_completed")
      .eq("id", userId)
      .single(),
    supabase
      .from("character_instances")
      .select(`id, level, character_types ( name, rarity, slug )`)
      .eq("user_id", userId)
      .eq("is_main", true)
      .maybeSingle(),
  ]);

  if (profileResult.error || !profileResult.data) {
    throw new Error("home profile query failed");
  }
  if (mainCharacterResult.error) {
    throw new Error("home main character query failed");
  }

  const { balance, onboarding_completed } = profileResult.data;

  let mainCharacter: HomeDataResponse["mainCharacter"] = null;

  const ci = mainCharacterResult.data as unknown as {
    id: number;
    level: number;
    character_types: { name: string; rarity: string; slug: string } | null;
  } | null;

  if (ci?.character_types) {
    mainCharacter = {
      instanceId: ci.id,
      name: ci.character_types.name,
      level: ci.level,
      rarity: ci.character_types.rarity,
      slug: ci.character_types.slug,
    };
  }

  return { balance, mainCharacter, onboardingCompleted: onboarding_completed };
}
