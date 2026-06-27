import type { UpdateNicknameResponse } from "@/lib/types/api";

export class NicknameTakenError extends Error {
  constructor() {
    super("nickname_taken");
    this.name = "NicknameTakenError";
  }
}

export async function updateNickname(nickname: string): Promise<UpdateNicknameResponse> {
  const res = await fetch("/api/profile/nickname", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname }),
  });

  if (res.status === 409) {
    throw new NicknameTakenError();
  }
  if (!res.ok) {
    throw new Error("nickname_update_failed");
  }

  return res.json();
}
