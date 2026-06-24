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
  // 완료 트리거 전용 타이머. rAF(시각 표시)는 백그라운드 탭에서 멈추지만
  // setTimeout은 throttle될 뿐 발화하므로, 완료 기록·알림을 여기에 건다.
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef = useRef(false);
  const activeDurationRef = useRef(durationMinutes);
  // 개발 배속 (1× = 정상). dev 콘솔에서만 변경, 프로덕션은 항상 1×
  const [timeScale, setTimeScale] = useState(1);
  const timeScaleRef = useRef(1);
  // onComplete를 ref로 관리하여 RAF 루프에서 항상 최신 콜백 참조
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clearCompletionTimer = useCallback(() => {
    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
  }, []);

  // 완료 처리 단일 진입점. setTimeout(백그라운드)·tick(포그라운드) 양쪽에서 호출되며
  // completedRef 가드로 중복 발화를 막는다.
  const fireComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearCompletionTimer();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setRemainingMs(0);
    setStatus("completed");
    onCompleteRef.current();
  }, [clearCompletionTimer]);

  // 남은 실제 시간(배속 반영) 뒤 완료를 예약. 탭 가시성과 무관하게 발화한다.
  const scheduleCompletion = useCallback(() => {
    clearCompletionTimer();
    const realMs = pausedRemainingRef.current / timeScaleRef.current;
    completionTimerRef.current = setTimeout(fireComplete, realMs);
  }, [clearCompletionTimer, fireComplete]);

  const tick = useCallback(() => {
    if (!startTimeRef.current) return;

    const elapsed = (Date.now() - startTimeRef.current) * timeScaleRef.current;
    const remaining = Math.max(0, pausedRemainingRef.current - elapsed);
    setRemainingMs(remaining);

    if (remaining <= 0 && !completedRef.current) {
      fireComplete();
      return;
    }

    // 재귀 rAF 루프 — tick이 다음 프레임에 자신을 예약 (정상 패턴).
    // react-hooks/immutability는 "선언 전 참조"로 보지만 의도된 구조라 억제.
    // eslint-disable-next-line react-hooks/immutability
    rafRef.current = requestAnimationFrame(tick);
  }, [fireComplete]);

  const start = useCallback(() => {
    completedRef.current = false;
    startTimeRef.current = Date.now();
    setStatus("running");
    scheduleCompletion();
    rafRef.current = requestAnimationFrame(tick);
  }, [tick, scheduleCompletion]);

  const pause = useCallback(() => {
    if (status !== "running" || !startTimeRef.current) return;

    const elapsed = (Date.now() - startTimeRef.current) * timeScaleRef.current;
    pausedRemainingRef.current = Math.max(
      0,
      pausedRemainingRef.current - elapsed
    );
    startTimeRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    clearCompletionTimer();
    setStatus("paused");
  }, [status, clearCompletionTimer]);

  const resume = useCallback(() => {
    if (status !== "paused") return;
    startTimeRef.current = Date.now();
    setStatus("running");
    scheduleCompletion();
    rafRef.current = requestAnimationFrame(tick);
  }, [status, tick, scheduleCompletion]);

  const reset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    clearCompletionTimer();
    startTimeRef.current = null;
    pausedRemainingRef.current = durationMinutes * 60 * 1000;
    activeDurationRef.current = durationMinutes;
    completedRef.current = false;
    setRemainingMs(durationMinutes * 60 * 1000);
    setStatus("idle");
  }, [durationMinutes, clearCompletionTimer]);

  const resetWithDuration = useCallback(
    (newMinutes: number) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearCompletionTimer();
      startTimeRef.current = null;
      const ms = newMinutes * 60 * 1000;
      pausedRemainingRef.current = ms;
      activeDurationRef.current = newMinutes;
      completedRef.current = false;
      setRemainingMs(ms);
      setStatus("idle");
    },
    [clearCompletionTimer]
  );

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
      // 배율이 바뀌면 남은 실제 시간도 달라지므로 완료 예약을 다시 건다.
      if (status === "running") scheduleCompletion();
    },
    [status, scheduleCompletion]
  );

  // 현재 타이머를 즉시 완료 처리 (dev 스킵)
  const skip = useCallback(() => {
    fireComplete();
  }, [fireComplete]);

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
      clearCompletionTimer();
    };
  }, [clearCompletionTimer]);

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
