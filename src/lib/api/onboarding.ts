// 온보딩 완료 — 닉네임(선택) 저장 + onboarding_completed 플래그 true.
export async function completeOnboarding(nickname?: string): Promise<void> {
  const res = await fetch("/api/onboarding/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname: nickname ?? "" }),
  });

  if (!res.ok) {
    throw new Error("onboarding_complete_failed");
  }
}
