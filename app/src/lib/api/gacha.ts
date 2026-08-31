import type { GachaResponse } from "@/lib/types/api";

// 가챠 뽑기 — POST /api/gacha (body 없음, 비용은 서버가 app_config에서 결정·차감).
// 잔액 부족(400)은 "insufficient_balance"로 구분해 던진다.
export async function drawGacha(): Promise<GachaResponse> {
  const res = await fetch("/api/gacha", { method: "POST" });

  if (res.status === 400) {
    throw new Error("insufficient_balance");
  }
  if (!res.ok) {
    throw new Error("draw_failed");
  }

  return res.json();
}
