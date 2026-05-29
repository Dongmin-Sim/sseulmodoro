"use client";

import { cn } from "@/lib/utils";
import type { SessionPhase } from "./pomodoro-timer";
import {
  getProgressSteps,
  type StepType,
  type StepState,
} from "./progress-model";

// 조립형 표현 — 외형 교체/확장은 아래 두 맵만 수정하면 된다.
// (Record로 강제: 타입/상태를 늘리면 TS가 누락을 컴파일 에러로 잡음)
const STEP_ICON: Record<StepType, string> = {
  pomodoro: "🍅",
  shortBreak: "☕",
  longBreak: "🌳",
};

const STEP_STYLE: Record<StepState, string> = {
  completed: "opacity-100",
  active: "opacity-100 animate-pulse", // 진행 중만 구분 (자유 교체)
  upcoming: "opacity-30",
};

export function CycleProgress({
  phase,
  completed,
  target,
}: {
  phase: SessionPhase;
  completed: number;
  target: number;
}) {
  const steps = getProgressSteps(phase, completed, target);
  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <span key={i} className={cn("text-lg leading-none", STEP_STYLE[step.state])}>
          {STEP_ICON[step.type]}
        </span>
      ))}
    </div>
  );
}
