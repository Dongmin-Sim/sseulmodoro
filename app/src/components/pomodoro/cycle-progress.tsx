"use client";

import Image from "next/image";
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
  pomodoro: "/icons/tomato.png",
  shortBreak: "/icons/coffee.png",
  longBreak: "/icons/tree.png",
};

const STEP_STYLE: Record<StepState, string> = {
  completed: "opacity-100",
  active: "opacity-100",
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
    <div className="flex items-center gap-3">
      {steps.map((step, i) => {
        const active = step.state === "active";
        const size = active ? 40 : 34;
        return (
          <Image
            key={i}
            src={STEP_ICON[step.type]}
            alt=""
            width={size}
            height={size}
            unoptimized
            className={cn("pixelated", STEP_STYLE[step.state])}
            style={active ? { filter: "drop-shadow(0 0 8px rgba(196,114,92,.55))" } : undefined}
          />
        );
      })}
    </div>
  );
}
