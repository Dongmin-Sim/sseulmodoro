"use client";

import { cn } from "@/lib/utils";
import type { TimerStatus } from "./use-timer";

interface TimerDisplayProps {
  display: string;
  progress: number;
  status: TimerStatus;
  label?: string;
  progressColor?: string;
}

const CIRCLE_RADIUS = 120;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

export function TimerDisplay({ display, progress, status, label, progressColor }: TimerDisplayProps) {
  const strokeDashoffset = CIRCLE_CIRCUMFERENCE * (1 - progress);

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width="280"
        height="280"
        viewBox="0 0 280 280"
        className="-rotate-90"
      >
        {/* 배경 원 */}
        <circle
          cx="140"
          cy="140"
          r={CIRCLE_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-muted"
        />
        {/* 진행 원 */}
        <circle
          cx="140"
          cy="140"
          r={CIRCLE_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCLE_CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          className={cn(
            status !== "running" &&
              "transition-[stroke-dashoffset] duration-500 ease-linear",
            status === "running" && (progressColor || "text-primary"),
            status === "paused" && "text-muted-foreground",
            status === "completed" && "text-success"
          )}
        />
      </svg>
      <div className="absolute flex flex-col items-center gap-1">
        <span
          className={cn(
            "font-mono text-5xl font-bold tracking-wider",
            status === "completed" && "text-success"
          )}
        >
          {display}
        </span>
        <span className="text-sm text-muted-foreground">
          {label || (
            <>
              {status === "idle" && "준비"}
              {status === "running" && "집중 중"}
              {status === "paused" && "일시정지"}
              {status === "completed" && "완료!"}
            </>
          )}
        </span>
      </div>
    </div>
  );
}
