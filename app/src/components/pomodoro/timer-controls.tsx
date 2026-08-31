"use client";

import { Button } from "@/components/ui/button";
import type { TimerStatus } from "./use-timer";

interface TimerControlsProps {
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export function TimerControls({
  status,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  disabled,
}: TimerControlsProps) {
  if (status === "idle") {
    return (
      <Button size="lg" className="w-40 h-11" onClick={onStart} disabled={disabled}>
        {disabled ? "준비 중..." : "시작"}
      </Button>
    );
  }

  if (status === "running") {
    return (
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onPause}
          className="h-12 rounded-[13px] border border-border bg-card px-8 text-sm font-bold text-foreground shadow-[0_4px_12px_rgba(45,42,38,.06)] transition-transform hover:scale-[1.02]"
        >
          일시정지
        </button>
        <button
          type="button"
          onClick={onStop}
          className="h-12 rounded-[13px] bg-focus/12 px-8 text-sm font-bold text-focus transition-colors hover:bg-focus/20 lg:hidden"
        >
          중지
        </button>
      </div>
    );
  }

  if (status === "paused") {
    return (
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onResume}
          className="h-12 rounded-[13px] px-8 text-sm font-bold text-primary-foreground shadow-[0_8px_20px_rgba(212,149,106,.4)] transition-transform hover:scale-[1.02]"
          style={{ background: "var(--primary-gradient)" }}
        >
          이어하기
        </button>
        <button
          type="button"
          onClick={onStop}
          className="h-12 rounded-[13px] bg-focus/12 px-8 text-sm font-bold text-focus transition-colors hover:bg-focus/20 lg:hidden"
        >
          중지
        </button>
      </div>
    );
  }

  // completed
  return (
    <Button size="lg" className="w-40 h-11" onClick={onReset}>
      다시 시작
    </Button>
  );
}
