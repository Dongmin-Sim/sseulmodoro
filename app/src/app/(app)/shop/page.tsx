import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { createServerClient } from "@/lib/supabase/server";
import { ShopClient } from "@/components/shop/shop-client";

const DEFAULT_GACHA_COST = 50;
const DEFAULT_WEIGHTS: Record<string, number> = {
  common: 69,
  rare: 25,
  epic: 4,
  legendary: 1.5,
  mythic: 0.5,
};

function parseWeights(raw: unknown): Record<string, number> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const entries = Object.entries(raw as Record<string, unknown>)
      .map(([k, v]) => [k, Number(v)] as const)
      .filter(([, v]) => Number.isFinite(v) && v > 0);
    if (entries.length > 0) return Object.fromEntries(entries);
  }
  return DEFAULT_WEIGHTS;
}

export default async function ShopPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  // 서버 컴포넌트에서 Supabase 직접 조회 (상대 fetch 금지 — ISSUE-15 패턴).
  const supabase = await createServerClient();
  const [profileResult, costResult, weightsResult] = await Promise.all([
    supabase.from("profiles").select("balance").eq("id", user.id).single(),
    supabase.from("app_config").select("value").eq("key", "gacha_cost").single(),
    supabase.from("app_config").select("value").eq("key", "gacha_rarity_weights").single(),
  ]);

  const balance = profileResult.data?.balance ?? 0;
  const rawCost = costResult.data?.value;
  const gachaCost =
    typeof rawCost === "number" ? rawCost : Number(rawCost ?? DEFAULT_GACHA_COST);

  return (
    <ShopClient
      balance={balance}
      gachaCost={Number.isFinite(gachaCost) ? gachaCost : DEFAULT_GACHA_COST}
      weights={parseWeights(weightsResult.data?.value)}
    />
  );
}
