import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { createServerClient } from "@/lib/supabase/server";
import { ShopClient } from "@/components/shop/shop-client";

const DEFAULT_GACHA_COST = 50;

export default async function ShopPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  // 서버 컴포넌트에서 Supabase 직접 조회 (상대 fetch 금지 — ISSUE-15 패턴).
  const supabase = await createServerClient();
  const [profileResult, costResult] = await Promise.all([
    supabase.from("profiles").select("balance").eq("id", user.id).single(),
    supabase.from("app_config").select("value").eq("key", "gacha_cost").single(),
  ]);

  const balance = profileResult.data?.balance ?? 0;
  // app_config.value 는 JSONB — gacha_cost는 숫자(50). 방어적으로 Number 변환.
  const rawCost = costResult.data?.value;
  const gachaCost =
    typeof rawCost === "number" ? rawCost : Number(rawCost ?? DEFAULT_GACHA_COST);

  return (
    <ShopClient
      balance={balance}
      gachaCost={Number.isFinite(gachaCost) ? gachaCost : DEFAULT_GACHA_COST}
    />
  );
}
