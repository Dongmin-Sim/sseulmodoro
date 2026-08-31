import type {
  CompletePomodoroResponse,
  StopPomodoroResponse,
} from "@/lib/types/api";

export async function completePomodoro(
  pomodoroId: number,
): Promise<CompletePomodoroResponse> {
  const res = await fetch(`/api/pomodoros/${pomodoroId}/complete`, {
    method: "POST",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to complete pomodoro");
  }

  return res.json();
}

export async function stopPomodoro(
  pomodoroId: number,
): Promise<StopPomodoroResponse> {
  const res = await fetch(`/api/pomodoros/${pomodoroId}/stop`, {
    method: "POST",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to stop pomodoro");
  }

  return res.json();
}
