import type { SetMainCharacterResponse } from "@/lib/types/api";

export async function setMainCharacter(
  instanceId: number,
): Promise<SetMainCharacterResponse> {
  const res = await fetch("/api/characters/main", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instanceId }),
  });

  if (res.status === 401) {
    throw new Error("unauthorized");
  }
  if (res.status === 404) {
    throw new Error("character_not_found");
  }
  if (!res.ok) {
    throw new Error("set_main_character_failed");
  }

  return res.json();
}
