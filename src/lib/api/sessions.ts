import type {
  StartSessionResponse,
  EndSessionResponse,
  StartNextPomodoroResponse,
} from "@/lib/types/api";

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

export async function endSession(
  sessionId: number,
): Promise<EndSessionResponse> {
  const res = await fetch(`/api/sessions/${sessionId}/end`, {
    method: "POST",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to end session");
  }

  return res.json();
}

export async function startNextPomodoro(
  sessionId: number,
): Promise<StartNextPomodoroResponse> {
  const res = await fetch(`/api/sessions/${sessionId}/pomodoros`, {
    method: "POST",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to start next pomodoro");
  }

  return res.json();
}
