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
  const activeDurationRef = useRef(durationMinutes);
  // 개발 배속 (1× = 정상). dev 콘솔에서만 변경, 프로덕션은 항상 1×
  const [timeScale, setTimeScale] = useState(1);
  const timeScaleRef = useRef(1);
  // onComplete를 ref로 관리하여 RAF 루프에서 항상 최신 콜백 참조
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const tick = useCallback(() => {
    if (!startTimeRef.current) return;

    const elapsed = (Date.now() - startTimeRef.current) * timeScaleRef.current;
    const remaining = Math.max(0, pausedRemainingRef.current - elapsed);
    setRemainingMs(remaining);

    if (remaining <= 0 && !completedRef.current) {
      completedRef.current = true;
      setStatus("completed");
      onCompleteRef.current();
      return;
    }

    // 재귀 rAF 루프 — tick이 다음 프레임에 자신을 예약 (정상 패턴).
    // react-hooks/immutability는 "선언 전 참조"로 보지만 의도된 구조라 억제.
    // eslint-disable-next-line react-hooks/immutability
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

    const elapsed = (Date.now() - startTimeRef.current) * timeScaleRef.current;
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
    activeDurationRef.current = durationMinutes;
    completedRef.current = false;
    setRemainingMs(durationMinutes * 60 * 1000);
    setStatus("idle");
  }, [durationMinutes]);

  const resetWithDuration = useCallback((newMinutes: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startTimeRef.current = null;
    const ms = newMinutes * 60 * 1000;
    pausedRemainingRef.current = ms;
    activeDurationRef.current = newMinutes;
    completedRef.current = false;
    setRemainingMs(ms);
    setStatus("idle");
  }, []);

  // 배속 실시간 변경. 동작 중이면 지금까지 소비분을 확정하고
  // 새 배율은 이후부터만 적용 (rebase) → 시간이 튀지 않음
  const changeTimeScale = useCallback(
    (next: number) => {
      if (status === "running" && startTimeRef.current) {
        const elapsed =
          (Date.now() - startTimeRef.current) * timeScaleRef.current;
        pausedRemainingRef.current = Math.max(
          0,
          pausedRemainingRef.current - elapsed
        );
        startTimeRef.current = Date.now();
      }
      timeScaleRef.current = next;
      setTimeScale(next);
    },
    [status]
  );

  // 현재 타이머를 즉시 완료 처리 (dev 스킵)
  const skip = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (completedRef.current) return;
    completedRef.current = true;
    setRemainingMs(0);
    setStatus("completed");
    onCompleteRef.current();
  }, []);

  // durationMinutes 변경 시 idle 상태면 리셋
  useEffect(() => {
    if (status === "idle") {
      pausedRemainingRef.current = durationMinutes * 60 * 1000;
      activeDurationRef.current = durationMinutes;
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
    1 - remainingMs / (activeDurationRef.current * 60 * 1000);

  return {
    status,
    remainingMs,
    display,
    progress,
    start,
    pause,
    resume,
    reset,
    resetWithDuration,
    timeScale,
    changeTimeScale,
    skip,
  };
}
