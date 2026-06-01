import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import type { HomeDataResponse, ApiError } from "@/lib/types/api";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json<ApiError>({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerClient();

  const [profileResult, mainCharacterResult] = await Promise.all([
    supabase.from("profiles").select("balance").eq("id", user.id).single(),
    supabase
      .from("character_instances")
      .select(`id, level, character_types ( name, rarity )`)
      .eq("user_id", user.id)
      .eq("is_main", true)
      .maybeSingle(),
  ]);

  if (profileResult.error || !profileResult.data) {
    console.error("home profile query error:", profileResult.error);
    return NextResponse.json<ApiError>(
      { error: "Failed to fetch home data" },
      { status: 500 },
    );
  }

  if (mainCharacterResult.error) {
    console.error("home main character query error:", mainCharacterResult.error);
    return NextResponse.json<ApiError>(
      { error: "Failed to fetch home data" },
      { status: 500 },
    );
  }

  const { balance } = profileResult.data;

  let mainCharacter: HomeDataResponse["mainCharacter"] = null;

  const ci = mainCharacterResult.data as unknown as {
    id: number;
    level: number;
    character_types: { name: string; rarity: string } | null;
  } | null;

  if (ci?.character_types) {
    mainCharacter = {
      instanceId: ci.id,
      name: ci.character_types.name,
      level: ci.level,
      rarity: ci.character_types.rarity,
    };
  }

  return NextResponse.json<HomeDataResponse>(
    { balance, mainCharacter },
    { status: 200 },
  );
}
