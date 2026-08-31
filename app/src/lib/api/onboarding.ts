// 닉네임이 이미 선점된 경우 (사전확인↔저장 사이 race) — 호출 측이 분기 처리.
export class NicknameTakenError extends Error {
  constructor() {
    super("nickname_taken");
    this.name = "NicknameTakenError";
  }
}

// 온보딩 완료 — 닉네임(선택) 저장 + onboarding_completed 플래그 true.
export async function completeOnboarding(nickname?: string): Promise<void> {
  const res = await fetch("/api/onboarding/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname: nickname ?? "" }),
  });

  if (res.status === 409) {
    throw new NicknameTakenError();
  }
  if (!res.ok) {
    throw new Error("onboarding_complete_failed");
  }
}
