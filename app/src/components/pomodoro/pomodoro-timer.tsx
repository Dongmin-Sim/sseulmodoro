"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CycleProgress } from "./cycle-progress";
import { useTimer } from "./use-timer";
import { TimerDisplay } from "./timer-display";
import { TimerControls } from "./timer-controls";
import { SessionPrep } from "./session-prep";
import { BreakScreen } from "./break-screen";
import { SessionComplete } from "./session-complete";
import { CycleTransition } from "./cycle-transition";
import { StopDialog } from "./stop-dialog";
import { SessionBuddy } from "./session-buddy";
import { SESSION_DEFAULTS } from "@/lib/constants";
import { DevConsole } from "@/lib/dev/dev-console";
import { DEV_SPEED_OPTIONS } from "@/lib/dev/constants";
import { usePomodoroSession, type TimerHeaderMode } from "./session-context";
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

type RoadmapStep = { kind: "focus" | "short" | "long"; label: string; minutes: number; n: number };

const ROADMAP_ICON = {
  focus: "/icons/tomato.png",
  short: "/icons/coffee.png",
  long: "/icons/tree.png",
} as const;

const fmtMin = (m: number) => `${String(m).padStart(2, "0")}:00`;

const GRID_IMAGE =
  "linear-gradient(rgba(45,42,38,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(45,42,38,.035) 1px,transparent 1px)";
const FOCUS_TINT = "radial-gradient(circle at 50% 40%, rgba(196,114,92,.12), rgba(196,114,92,0) 55%)";
const BREAK_TINT = "radial-gradient(circle at 50% 40%, rgba(123,166,142,.16), rgba(123,166,142,0) 55%)";
const GOLD_TINT = "radial-gradient(circle at 50% 38%, rgba(224,177,94,.18), rgba(224,177,94,0) 52%)";

function buildRoadmap(
  targetCount: number,
  focusMinutes: number,
  shortBreakMinutes: number,
  longBreakMinutes: number,
): RoadmapStep[] {
  return Array.from({ length: targetCount }, (_, idx) => idx + 1).flatMap((i) => [
    { kind: "focus" as const, label: `${i}번째 집중`, minutes: focusMinutes, n: i },
    i < targetCount
      ? { kind: "short" as const, label: "짧은 휴식", minutes: shortBreakMinutes, n: i }
      : { kind: "long" as const, label: "긴 휴식", minutes: longBreakMinutes, n: i },
  ]);
}

export function PomodoroTimer({ character }: { character?: PomodoroBuddy | null }) {
  const router = useRouter();
  const { exitSession, setTimerHeader, registerStopHandler } = usePomodoroSession();

  const buddySlug = character?.slug ?? null;
  const buddyName = character?.name ?? "친구";
  const buddyRarity = character?.rarity ?? "common";

  // 세션 설정
  const [focusMinutes, setFocusMinutes] = useState(25);
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

  // 세션 단계 → 상단 헤더 변형 동기화. 언마운트 시 기본 헤더로 복원.
  useEffect(() => {
    const headerByPhase: Record<SessionPhase, TimerHeaderMode> = {
      idle: "prep",
      focusing: "focus",
      pomodoro_done: "complete", // 사이클 전환 화면: 헤더 디자인 제공 전까지 숨김
      breaking: "break",
      break_done: "complete", // 사이클 전환 화면: 헤더 디자인 제공 전까지 숨김
      session_completed: "complete",
    };
    setTimerHeader(headerByPhase[sessionPhase]);
    return () => setTimerHeader("default");
  }, [sessionPhase, setTimerHeader]);

  // 헤더 '집중 종료'가 본문 '중지'와 동일하게 확인 다이얼로그를 열도록 브리지 등록
  useEffect(() => {
    registerStopHandler(() => setShowStopDialog(true));
    return () => registerStopHandler(null);
  }, [registerStopHandler]);

  const handleFocusChange = (minutes: number) => {
    setFocusMinutes(minutes);
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

  const handleExtendBreak = () => {
    timer.resetWithDuration(5);
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

  const isTransition = sessionPhase === "pomodoro_done" || sessionPhase === "break_done";
  const phaseTint = isFocusing
    ? FOCUS_TINT
    : sessionPhase === "breaking"
      ? BREAK_TINT
      : isTransition
        ? GOLD_TINT
        : null;

  return (
    <div className="relative flex w-full flex-col items-center">
      <div
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{
          backgroundColor: "var(--background)",
          backgroundImage: phaseTint ? `${phaseTint}, ${GRID_IMAGE}` : GRID_IMAGE,
          backgroundSize: phaseTint ? "auto, 26px 26px, 26px 26px" : "26px 26px, 26px 26px",
        }}
      />
      {/* idle: 세션 준비 */}
      {sessionPhase === "idle" && (
        <SessionPrep
          focusMinutes={focusMinutes}
          shortBreakMinutes={shortBreakMinutes}
          longBreakMinutes={longBreakMinutes}
          targetCount={targetCount}
          buddySlug={buddySlug}
          buddyName={buddyName}
          buddyRarity={buddyRarity}
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
        <div className="mx-auto grid w-full max-w-[1000px] gap-8 py-2 lg:min-h-[calc(100dvh-9rem)] lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          {/* 좌: 링·컨트롤 */}
          <div className="flex flex-col items-center gap-6">
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

          {/* 우: 버디 + 세션 플랜 (데스크톱) */}
          <div className="hidden flex-col gap-6 lg:flex">
            <div className="flex items-center gap-6 rounded-3xl border border-border bg-card/70 p-7">
              <SessionBuddy slug={buddySlug} name={buddyName} size={116} glow="rgba(196,114,92,.22)" />
              <div>
                <p className="font-pixel mb-1.5 text-[10px] tracking-[1px] text-focus">BUDDY</p>
                <p className="text-lg font-extrabold text-foreground">{buddyName} 함께 집중 중</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">
                  한 사이클 끝낼 때마다
                  <br />
                  경험치가 쌓여요
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card/70 p-7">
              <p className="font-pixel mb-4 text-[10px] tracking-[1.5px] text-muted-foreground">SESSION PLAN</p>
              <div className="flex flex-col gap-2.5">
                {buildRoadmap(targetCount, focusMinutes, shortBreakMinutes, longBreakMinutes).map((step, idx) => {
                  const current = step.kind === "focus" && step.n === completedCount + 1;
                  const done = step.n <= completedCount;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center gap-3",
                        current
                          ? "-mx-1 rounded-xl border border-focus/30 bg-focus/10 px-3 py-2.5"
                          : done && "opacity-50",
                      )}
                    >
                      <Image src={ROADMAP_ICON[step.kind]} alt="" width={24} height={24} unoptimized className="pixelated" />
                      <span className={cn("flex-1 text-sm font-semibold", current && "font-extrabold text-focus")}>
                        {step.label}
                      </span>
                      <span className={cn("font-mono text-xs", current ? "font-semibold text-focus" : "text-muted-foreground")}>
                        {current ? "진행 중" : done ? `${fmtMin(step.minutes)} ✓` : fmtMin(step.minutes)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
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

      {/* pomodoro_done: 집중 완료 → 휴식 전환 */}
      {sessionPhase === "pomodoro_done" && (
        <CycleTransition
          variant="toBreak"
          completedCount={completedCount}
          targetCount={targetCount}
          buddySlug={buddySlug}
          buddyName={buddyName}
          nextMinutes={currentBreakMinutes}
          nextFocusIndex={completedCount + 1}
          isLastBreakLong={isLastBreakLong}
          isBusy={isLoading || isTransitioning}
          onPrimary={handleStartBreak}
          onEnd={handleEndSessionEarly}
          onTertiary={handleStartNextFocus}
        />
      )}

      {/* break_done: 휴식 완료 → 집중 전환 */}
      {sessionPhase === "break_done" && (
        <CycleTransition
          variant="toFocus"
          completedCount={completedCount}
          targetCount={targetCount}
          buddySlug={buddySlug}
          buddyName={buddyName}
          nextMinutes={focusMinutes}
          nextFocusIndex={completedCount + 1}
          isLastBreakLong={false}
          isBusy={isLoading || isTransitioning}
          onPrimary={handleStartNextFocus}
          onEnd={handleEndSessionEarly}
          onTertiary={handleExtendBreak}
        />
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
