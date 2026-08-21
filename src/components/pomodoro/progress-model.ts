import type { SessionPhase } from "./pomodoro-timer";

/**
 * 진행 표시의 순수 도메인 모델 (React 의존 없음).
 * 세션 상태로부터 각 step의 타입·상태를 도출한다. 외형은 전혀 모른다.
 */
export type StepType = "pomodoro" | "shortBreak" | "longBreak";
export type StepState = "completed" | "active" | "upcoming";
export type ProgressStep = { type: StepType; state: StepState };

/**
 * 진행 시퀀스: 🍅 ☕ 🍅 ☕ … 🍅 🌳
 * (포모도로 target개, 사이 짧은 휴식 target-1개, 끝 긴 휴식 1개)
 */
export function getProgressSteps(
  phase: SessionPhase,
  completed: number,
  target: number,
): ProgressStep[] {
  const pomodoro = (i: number): StepState =>
    i < completed
      ? "completed"
      : phase === "focusing" && i === completed
        ? "active" // 집중 중일 때만 현재 칸 강조
        : "upcoming";

  // 휴식 b = 포모도로 b 다음의 짧은 휴식. "완료"는 그 휴식을 지나간 뒤에만.
  const shortBreak = (b: number): StepState => {
    if (completed > b + 1) return "completed"; // 다음 포모도로까지 완료 → 확실히 지남
    if (completed === b + 1) {
      // 직전 포모도로(b)까지 완료된 상태 — 지금 phase로 휴식 진행 여부 판단
      if (phase === "breaking") return "active"; // 휴식 진행 중
      if (phase === "focusing" || phase === "break_done") return "completed"; // 휴식 끝/다음 집중
      return "upcoming"; // pomodoro_done 등: 아직 휴식 시작 전
    }
    return "upcoming";
  };

  const longBreak = (): StepState => {
    if (completed < target) return "upcoming";
    if (phase === "breaking") return "active"; // 긴 휴식 진행 중
    if (phase === "session_completed") return "completed";
    return "upcoming"; // pomodoro_done: 긴 휴식 시작 전
  };

  const steps: ProgressStep[] = [];
  for (let i = 0; i < target; i++) {
    steps.push({ type: "pomodoro", state: pomodoro(i) });
    steps.push(
      i < target - 1
        ? { type: "shortBreak", state: shortBreak(i) }
        : { type: "longBreak", state: longBreak() },
    );
  }
  return steps;
}

/**
 * 사이클 전환 화면용 트래커: "다음 시작할 단계"를 active(현재)로 표시.
 * toBreak = 집중 완료 직후(다음=휴식), toFocus = 휴식 완료 직후(다음=집중).
 */
export function getCycleTrackerSteps(
  variant: "toBreak" | "toFocus",
  completed: number,
  target: number,
): ProgressStep[] {
  const steps: ProgressStep[] = [];
  for (let i = 0; i < target; i++) {
    const pomodoroState: StepState =
      i < completed
        ? "completed"
        : variant === "toFocus" && i === completed
          ? "active"
          : "upcoming";
    steps.push({ type: "pomodoro", state: pomodoroState });

    const isLong = i === target - 1;
    const breakState: StepState =
      variant === "toBreak"
        ? i < completed - 1
          ? "completed"
          : i === completed - 1
            ? "active"
            : "upcoming"
        : i < completed
          ? "completed"
          : "upcoming";
    steps.push({ type: isLong ? "longBreak" : "shortBreak", state: breakState });
  }
  return steps;
}
