"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CycleProgress } from "./cycle-progress";
import { useTimer } from "./use-timer";
import { TimerDisplay } from "./timer-display";
import { TimerControls } from "./timer-controls";
import { SessionPrep } from "./session-prep";
import { BreakScreen } from "./break-screen";
import { SessionComplete } from "./session-complete";
import { StopDialog } from "./stop-dialog";
import { SessionBuddy } from "./session-buddy";
import { SESSION_DEFAULTS } from "@/lib/constants";
import { DevConsole } from "@/lib/dev/dev-console";
import { DEV_SPEED_OPTIONS } from "@/lib/dev/constants";
import { usePomodoroSession } from "./session-context";
import {
  startSession,
  endSession,
  startNextPomodoro,
} from "@/lib/api/sessions";
import { completePomodoro, stopPomodoro } from "@/lib/api/pomodoros";
import {
  notifyComplete,
  unlockAudio,
  stopBackgroundAlert,
} from "./notify";

export type SessionPhase =
  | "idle"
  | "focusing"
  | "pomodoro_done"
  | "breaking"
  | "break_done"
  | "session_completed";

type PomodoroBuddy = {
  slug: string;
  name: string;
  level: number;
  rarity: string;
};

export function PomodoroTimer({ character }: { character?: PomodoroBuddy | null }) {
  const router = useRouter();
  const { exitSession } = usePomodoroSession();

  const buddySlug = character?.slug ?? null;
  const buddyName = character?.name ?? "버디";

  // 세션 설정
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [focusLabel, setFocusLabel] = useState("25분");
  const [shortBreakMinutes, setShortBreakMinutes] = useState<number>(
    SESSION_DEFAULTS.shortBreakMinutes,
  );
  const [longBreakMinutes, setLongBreakMinutes] = useState<number>(
    SESSION_DEFAULTS.longBreakMinutes,
  );
  const [targetCount, setTargetCount] = useState<number>(
    SESSION_DEFAULTS.targetCount,
  );

  // 세션 상태
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>("idle");
  const [completedCount, setCompletedCount] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [pomodoroId, setPomodoroId] = useState<number | null>(null);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);

  // UI 상태
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleTimerComplete = useCallback(async () => {
    setIsTransitioning(true);
    try {
      if (sessionPhase === "focusing") {
        if (!pomodoroId || !sessionId) return;
        try {
          const result = await completePomodoro(pomodoroId);
          setCompletedCount(result.completedCount);

          // 모든 사이클 완료 후에도 휴식 제안 (마지막은 긴 휴식)
          setSessionPhase("pomodoro_done");
          notifyComplete(
            "포모도로 완료!",
            `${result.completedCount}/${result.targetCount} 완료. 휴식할까요?`,
            `pomodoro-${result.completedCount}`,
          );
        } catch (error) {
          console.error("Failed to complete pomodoro:", error);
          setSessionPhase("session_completed");
        }
      } else if (sessionPhase === "breaking") {
        if (completedCount >= targetCount) {
          // 마지막 긴 휴식 완료 → 세션 자동 종료
          if (!sessionId) return;
          try {
            const endResult = await endSession(sessionId);
            setEarnedPoints(endResult.pointsEarned);
            setSessionPhase("session_completed");
            notifyComplete(
              "세션 완료!",
              `${completedCount}회 집중 완료! +${endResult.pointsEarned} 포인트`,
              "session-done",
            );
          } catch (error) {
            console.error("Failed to end session:", error);
            setSessionPhase("session_completed");
          }
        } else {
          // 중간 짧은 휴식 완료 → 다음 집중 제안
          setSessionPhase("break_done");
          notifyComplete(
            "휴식 끝!",
            "다음 집중을 시작할까요?",
            `break-${completedCount}`,
          );
        }
      }
    } finally {
      setIsTransitioning(false);
    }
  }, [sessionPhase, pomodoroId, sessionId, completedCount, targetCount]);

  const timer = useTimer({
    durationMinutes: focusMinutes,
    onComplete: handleTimerComplete,
  });

  // 언마운트(세션 이탈 등) 시 깜박임·소리 반복 정지 + 제목 원복
  useEffect(() => stopBackgroundAlert, []);

  const handleFocusChange = (minutes: number, label: string) => {
    setFocusMinutes(minutes);
    setFocusLabel(label);
  };

  const handleStart = async () => {
    setEarnedPoints(null);
    setCompletedCount(0);
    setIsLoading(true);
    // 사용자 제스처 시점에 오디오 unlock (자동재생 정책 우회)
    unlockAudio();

    try {
      const session = await startSession({
        focusMinutes,
        shortBreakMinutes,
        longBreakMinutes,
        targetCount,
      });
      setSessionId(session.sessionId);
      setPomodoroId(session.pomodoroId);

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "default"
      ) {
        Notification.requestPermission();
      }

      timer.start();
      setSessionPhase("focusing");
    } catch (error) {
      console.error("Failed to start session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isLastBreakLong = completedCount >= targetCount;
  const currentBreakMinutes = isLastBreakLong
    ? longBreakMinutes
    : shortBreakMinutes;

  const handleStartBreak = () => {
    timer.resetWithDuration(currentBreakMinutes);
    timer.start();
    setSessionPhase("breaking");
  };

  const handleSkipBreak = async () => {
    if (isLastBreakLong) {
      // 긴 휴식 건너뛰기 → 바로 세션 종료
      if (!sessionId) return;
      timer.pause();
      setIsTransitioning(true);
      try {
        const endResult = await endSession(sessionId);
        setEarnedPoints(endResult.pointsEarned);
        setSessionPhase("session_completed");
      } catch (error) {
        console.error("Failed to end session:", error);
        setSessionPhase("session_completed");
      } finally {
        setIsTransitioning(false);
      }
    } else {
      timer.resetWithDuration(focusMinutes);
      setSessionPhase("break_done");
    }
  };

  const handleStartNextFocus = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const result = await startNextPomodoro(sessionId);
      setPomodoroId(result.pomodoroId);
      timer.resetWithDuration(focusMinutes);
      timer.start();
      setSessionPhase("focusing");
    } catch (error) {
      console.error("Failed to start next pomodoro:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSessionEarly = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const endResult = await endSession(sessionId);
      setEarnedPoints(endResult.pointsEarned);
      setSessionPhase("session_completed");
    } catch (error) {
      console.error("Failed to end session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopRequest = () => {
    setShowStopDialog(true);
  };

  const handleStopConfirm = async () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setShowStopDialog(false);
    timer.pause();
    if (sessionId) {
      try {
        if (sessionPhase === "focusing" && pomodoroId) {
          await stopPomodoro(pomodoroId);
        }
        const endResult = await endSession(sessionId);
        setEarnedPoints(endResult.pointsEarned);
        setSessionPhase("session_completed");
      } catch (error) {
        console.error("Failed to stop:", error);
        setSessionPhase("session_completed");
      }
    }
    setIsTransitioning(false);
  };

  const handleResetSession = () => {
    timer.resetWithDuration(focusMinutes);
    setSessionPhase("idle");
    setCompletedCount(0);
    setSessionId(null);
    setPomodoroId(null);
    setEarnedPoints(null);
  };

  const handleReturnHome = () => {
    router.refresh(); // 방금 세션의 포인트/캐릭터 등 서버 데이터 갱신
    exitSession(); // 메인 화면(캐릭터+현황)으로 복귀
  };

  const isFocusing = sessionPhase === "focusing";
  const isTimerPhase = sessionPhase === "focusing" || sessionPhase === "breaking";

  return (
    <div className="relative flex w-full flex-col items-center">
      {/* idle: 세션 준비 */}
      {sessionPhase === "idle" && (
        <SessionPrep
          focusMinutes={focusMinutes}
          shortBreakMinutes={shortBreakMinutes}
          longBreakMinutes={longBreakMinutes}
          targetCount={targetCount}
          buddySlug={buddySlug}
          buddyName={buddyName}
          isLoading={isLoading}
          onFocusChange={handleFocusChange}
          onShortBreakChange={setShortBreakMinutes}
          onLongBreakChange={setLongBreakMinutes}
          onTargetCountChange={setTargetCount}
          onStart={handleStart}
        />
      )}

      {/* focusing: 집중 */}
      {isFocusing && (
        <div className="flex w-full flex-col items-center gap-6">
          <div className="flex items-center gap-2 rounded-full border border-focus/30 bg-focus/10 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-focus shadow-[0_0_0_4px_rgba(196,114,92,.18)]" />
            <span className="font-pixel text-[10px] tracking-[1px] text-focus">FOCUS MODE</span>
          </div>
          <CycleProgress phase={sessionPhase} completed={completedCount} target={targetCount} />
          <TimerDisplay
            display={timer.display}
            progress={timer.progress}
            status={timer.status}
            label={`${completedCount + 1} / ${targetCount} 집중 중`}
            progressColor="text-focus"
          />
          {isTransitioning ? (
            <Button size="lg" className="h-11 w-40" disabled>
              처리 중...
            </Button>
          ) : (
            <TimerControls
              status={timer.status}
              onStart={timer.start}
              onPause={timer.pause}
              onResume={timer.resume}
              onStop={handleStopRequest}
              onReset={handleResetSession}
              disabled={false}
            />
          )}
        </div>
      )}

      {/* breaking: 휴식 */}
      {sessionPhase === "breaking" && (
        <BreakScreen
          display={timer.display}
          progress={timer.progress}
          status={timer.status}
          isLastBreakLong={isLastBreakLong}
          nextFocusIndex={completedCount + 1}
          buddySlug={buddySlug}
          buddyName={buddyName}
          isTransitioning={isTransitioning}
          onSkip={handleSkipBreak}
          onEnd={handleEndSessionEarly}
        />
      )}

      {/* pomodoro_done: 중간 완료 → 휴식/종료 선택 */}
      {sessionPhase === "pomodoro_done" && (
        <div className="flex w-full flex-col items-center gap-5 text-center">
          <SessionBuddy slug={buddySlug} name={buddyName} size={96} glow="rgba(224,177,94,.24)" />
          <CycleProgress phase={sessionPhase} completed={completedCount} target={targetCount} />
          <div>
            <p className="text-xl font-extrabold text-foreground">
              {completedCount} / {targetCount} 포모도로 완료!
            </p>
            <p className="mt-1.5 text-sm text-text-secondary">
              {currentBreakMinutes}분 {isLastBreakLong ? "긴 " : ""}휴식할까요?
            </p>
          </div>
          <div className="flex w-full flex-col gap-2.5">
            <button
              type="button"
              onClick={handleStartBreak}
              className="h-13 w-full rounded-[14px] text-[15px] font-bold text-primary-foreground shadow-[0_8px_20px_rgba(212,149,106,.4)] transition-transform hover:scale-[1.01]"
              style={{ background: "var(--primary-gradient)" }}
            >
              휴식 시작
            </button>
            <button
              type="button"
              onClick={handleEndSessionEarly}
              disabled={isLoading}
              className="h-12 w-full rounded-[14px] border border-border bg-card text-[15px] font-semibold text-foreground transition-colors hover:bg-surface-2 disabled:opacity-50"
            >
              세션 종료
            </button>
          </div>
        </div>
      )}

      {/* break_done: 휴식 끝 → 다음 집중/종료 선택 */}
      {sessionPhase === "break_done" && (
        <div className="flex w-full flex-col items-center gap-5 text-center">
          <SessionBuddy slug={buddySlug} name={buddyName} size={96} glow="rgba(123,166,142,.22)" />
          <CycleProgress phase={sessionPhase} completed={completedCount} target={targetCount} />
          <div>
            <p className="text-xl font-extrabold text-foreground">휴식 끝!</p>
            <p className="mt-1.5 text-sm text-text-secondary">
              다음: {completedCount + 1}번째 집중 {focusLabel}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2.5">
            <button
              type="button"
              onClick={handleStartNextFocus}
              disabled={isLoading}
              className="h-13 w-full rounded-[14px] text-[15px] font-bold text-primary-foreground shadow-[0_8px_20px_rgba(212,149,106,.4)] transition-transform hover:scale-[1.01] disabled:opacity-60"
              style={{ background: "var(--primary-gradient)" }}
            >
              {isLoading ? "준비 중..." : "집중 시작"}
            </button>
            <button
              type="button"
              onClick={handleEndSessionEarly}
              disabled={isLoading}
              className="h-12 w-full rounded-[14px] border border-border bg-card text-[15px] font-semibold text-foreground transition-colors hover:bg-surface-2 disabled:opacity-50"
            >
              세션 종료
            </button>
          </div>
        </div>
      )}

      {/* session_completed: 세션 완료 */}
      {sessionPhase === "session_completed" && (
        <SessionComplete
          completedCount={completedCount}
          targetCount={targetCount}
          focusMinutes={focusMinutes}
          earnedPoints={earnedPoints}
          buddySlug={buddySlug}
          buddyName={buddyName}
          onRestart={handleResetSession}
          onHome={handleReturnHome}
        />
      )}

      <StopDialog
        open={showStopDialog}
        onOpenChange={setShowStopDialog}
        onConfirm={handleStopConfirm}
        isTransitioning={isTransitioning}
        isFocusing={isFocusing}
      />

      <DevConsole>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">배속</span>
          {DEV_SPEED_OPTIONS.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={timer.timeScale === s ? "default" : "outline"}
              onClick={() => timer.changeTimeScale(s)}
            >
              {s}×
            </Button>
          ))}
        </div>
        <Button
          size="sm"
          variant="ghost"
          disabled={!isTimerPhase}
          onClick={timer.skip}
        >
          ⏭ 현재 단계 스킵
        </Button>
      </DevConsole>
    </div>
  );
}
