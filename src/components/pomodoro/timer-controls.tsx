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
}

export function TimerControls({
  status,
  onStart,
  onPause,
  onResume,
  onAbandon,
  onReset,
}: TimerControlsProps) {
  if (status === "idle") {
    return (
      <Button size="lg" className="w-40" onClick={onStart}>
        시작
      </Button>
    );
  }

  if (status === "running") {
    return (
      <div className="flex gap-3">
        <Button size="lg" variant="secondary" className="w-28" onClick={onPause}>
          일시정지
        </Button>
        <Button size="lg" variant="destructive" className="w-28" onClick={onAbandon}>
          포기
        </Button>
      </div>
    );
  }

  if (status === "paused") {
    return (
      <div className="flex gap-3">
        <Button size="lg" className="w-28" onClick={onResume}>
          이어하기
        </Button>
        <Button size="lg" variant="destructive" className="w-28" onClick={onAbandon}>
          포기
        </Button>
      </div>
    );
  }

  // completed
  return (
    <Button size="lg" className="w-40" onClick={onReset}>
      다시 시작
    </Button>
  );
}
