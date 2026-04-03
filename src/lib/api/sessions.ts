import type { StartSessionResponse } from "@/lib/types/api";

export async function startSession(
  focusMinutes: number,
): Promise<StartSessionResponse> {
  const res = await fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ focusMinutes }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to start session");
  }

  return res.json();
}
