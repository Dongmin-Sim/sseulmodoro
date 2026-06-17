import type { CheckNicknameResponse } from "@/lib/types/api";

// 닉네임 사용 가능 여부 확인 — true면 사용 가능, false면 이미 사용 중.
// 형식 오류(400) 등은 호출 측에서 사전 검증하므로 그 외 응답은 실패로 던진다.
export async function checkNickname(nickname: string): Promise<boolean> {
  const res = await fetch(
    `/api/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`,
  );
  if (!res.ok) {
    throw new Error("check_nickname_failed");
  }
  const data: CheckNicknameResponse = await res.json();
  return data.available;
}
