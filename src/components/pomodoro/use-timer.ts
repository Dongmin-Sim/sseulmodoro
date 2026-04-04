"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type TimerStatus = "idle" | "running" | "paused" | "completed";

interface UseTimerOptions {
  durationMinutes: number;
  onComplete: () => void;
}

export function useTimer({ durationMinutes, onComplete }: UseTimerOptions) {
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [remainingMs, setRemainingMs] = useState(durationMinutes * 60 * 1000);
  const startTimeRef = useRef<number | null>(null);
  const pausedRemainingRef = useRef<number>(durationMinutes * 60 * 1000);
  const rafRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  // onComplete를 ref로 관리하여 RAF 루프에서 항상 최신 콜백 참조
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const tick = useCallback(() => {
    if (!startTimeRef.current) return;

    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, pausedRemainingRef.current - elapsed);
    setRemainingMs(remaining);

    if (remaining <= 0 && !completedRef.current) {
      completedRef.current = true;
      setStatus("completed");
      onCompleteRef.current();
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(() => {
    completedRef.current = false;
    startTimeRef.current = Date.now();
    setStatus("running");
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    if (status !== "running" || !startTimeRef.current) return;

    const elapsed = Date.now() - startTimeRef.current;
    pausedRemainingRef.current = Math.max(
      0,
      pausedRemainingRef.current - elapsed
    );
    startTimeRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setStatus("paused");
  }, [status]);

  const resume = useCallback(() => {
    if (status !== "paused") return;
    startTimeRef.current = Date.now();
    setStatus("running");
    rafRef.current = requestAnimationFrame(tick);
  }, [status, tick]);

  const reset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startTimeRef.current = null;
    pausedRemainingRef.current = durationMinutes * 60 * 1000;
    completedRef.current = false;
    setRemainingMs(durationMinutes * 60 * 1000);
    setStatus("idle");
  }, [durationMinutes]);

  // durationMinutes 변경 시 idle 상태면 리셋
  useEffect(() => {
    if (status === "idle") {
      pausedRemainingRef.current = durationMinutes * 60 * 1000;
      setRemainingMs(durationMinutes * 60 * 1000);
    }
  }, [durationMinutes, status]);

  // cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const progress =
    1 - remainingMs / (durationMinutes * 60 * 1000);

  return {
    status,
    remainingMs,
    display,
    progress,
    start,
    pause,
    resume,
    reset,
  };
}
