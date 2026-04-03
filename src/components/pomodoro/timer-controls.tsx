"use client";

import { Button } from "@/components/ui/button";
import type { TimerStatus } from "./use-timer";

interface TimerControlsProps {
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onAbandon: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export function TimerControls({
  status,
  onStart,
  onPause,
  onResume,
  onAbandon,
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
        <Button size="lg" variant="secondary" className="w-28 h-11" onClick={onPause}>
          일시정지
        </Button>
        <Button size="lg" variant="destructive" className="w-28 h-11" onClick={onAbandon}>
          포기
        </Button>
      </div>
    );
  }

  if (status === "paused") {
    return (
      <div className="flex gap-3">
        <Button size="lg" className="w-28 h-11" onClick={onResume}>
          이어하기
        </Button>
        <Button size="lg" variant="destructive" className="w-28 h-11" onClick={onAbandon}>
          포기
        </Button>
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
