"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTimer } from "./use-timer";
import { TimerDisplay } from "./timer-display";
import { TimerControls } from "./timer-controls";
import { SessionSettings } from "./session-settings";
import { SESSION_DEFAULTS } from "@/lib/constants";
import {
  startSession,
  endSession,
  startNextPomodoro,
} from "@/lib/api/sessions";
import { completePomodoro, stopPomodoro } from "@/lib/api/pomodoros";

type SessionPhase =
  | "idle"
  | "focusing"
  | "pomodoro_done"
  | "breaking"
  | "break_done"
  | "session_completed";

function sendNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, { body });
  } else if (Notification.permission === "default") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, { body });
      }
    });
  }
}

function CycleProgress({
  completed,
  target,
  showCurrent,
}: {
  completed: number;
  target: number;
  showCurrent?: boolean;
}) {
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: target }, (_, i) => {
        const isCompleted = i < completed;
        const isCurrent = showCurrent && i === completed;
        return (
          <div key={i} className="flex items-center gap-1">
            <span
              className={cn(
                "text-lg",
                isCompleted && "opacity-100",
                isCurrent && "opacity-100",
                !isCompleted && !isCurrent && "opacity-30",
              )}
            >
              🍅
            </span>
            {i < target - 1 && (
              <span
                className={cn(
                  "text-xs",
                  i < completed ? "opacity-60" : "opacity-30",
                )}
              >
                ·
              </span>
            )}
          </div>
        );
      })}
      {target > 1 && (
        <span className={cn("text-sm", completed >= target ? "opacity-100" : "opacity-30")}>
          ☕
        </span>
      )}
    </div>
  );
}

export function PomodoroTimer() {
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
  const [isStopping, setIsStopping] = useState(false);

  const handleTimerComplete = useCallback(async () => {
    if (sessionPhase === "focusing") {
      if (!pomodoroId || !sessionId) return;
      try {
        const result = await completePomodoro(pomodoroId);
        setCompletedCount(result.completedCount);

        // 모든 사이클 완료 후에도 휴식 제안 (마지막은 긴 휴식)
        setSessionPhase("pomodoro_done");
        sendNotification(
          "포모도로 완료!",
          `${result.completedCount}/${result.targetCount} 완료. 휴식할까요?`,
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
          sendNotification(
            "세션 완료!",
            `${completedCount}회 집중 완료! +${endResult.pointsEarned} 포인트`,
          );
        } catch (error) {
          console.error("Failed to end session:", error);
          setSessionPhase("session_completed");
        }
      } else {
        // 중간 짧은 휴식 완료 → 다음 집중 제안
        setSessionPhase("break_done");
        sendNotification("휴식 끝!", "다음 집중을 시작할까요?");
      }
    }
  }, [sessionPhase, pomodoroId, sessionId, completedCount, targetCount]);

  const timer = useTimer({
    durationMinutes: focusMinutes,
    onComplete: handleTimerComplete,
  });

  const handleFocusChange = (minutes: number, label: string) => {
    setFocusMinutes(minutes);
    setFocusLabel(label);
  };

  const handleStart = async () => {
    setEarnedPoints(null);
    setCompletedCount(0);
    setIsLoading(true);

    try {
      // Dev 테스트 옵션(3초 등)은 소수점 분이므로 올림하여 API 전달
      // 클라이언트 타이머는 실제 소수점 값으로 동작
      const session = await startSession({
        focusMinutes: Math.ceil(focusMinutes),
        shortBreakMinutes: Math.ceil(shortBreakMinutes),
        longBreakMinutes: Math.ceil(longBreakMinutes),
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
    timer.resetWithDuration(focusMinutes);
    if (isLastBreakLong) {
      // 긴 휴식 건너뛰기 → 바로 세션 종료
      if (!sessionId) return;
      try {
        const endResult = await endSession(sessionId);
        setEarnedPoints(endResult.pointsEarned);
        setSessionPhase("session_completed");
      } catch (error) {
        console.error("Failed to end session:", error);
        setSessionPhase("session_completed");
      }
    } else {
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
    if (isStopping) return;
    setIsStopping(true);
    setShowStopDialog(false);
    timer.resetWithDuration(focusMinutes);
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
    setIsStopping(false);
  };

  const handleResetSession = () => {
    timer.resetWithDuration(focusMinutes);
    setSessionPhase("idle");
    setCompletedCount(0);
    setSessionId(null);
    setPomodoroId(null);
    setEarnedPoints(null);
  };

  const isTimerPhase = sessionPhase === "focusing" || sessionPhase === "breaking";
  const isBreak = sessionPhase === "breaking";

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardContent className="flex flex-col items-center gap-6 pt-6">
        {/* idle: 세션 설정 */}
        {sessionPhase === "idle" && (
          <>
            <SessionSettings
              focusMinutes={focusMinutes}
              shortBreakMinutes={shortBreakMinutes}
              longBreakMinutes={longBreakMinutes}
              targetCount={targetCount}
              onFocusChange={handleFocusChange}
              onShortBreakChange={setShortBreakMinutes}
              onLongBreakChange={setLongBreakMinutes}
              onTargetCountChange={setTargetCount}
            />
            <Button
              size="lg"
              className="w-40 h-11"
              onClick={handleStart}
              disabled={isLoading}
            >
              {isLoading ? "준비 중..." : "시작"}
            </Button>
          </>
        )}

        {/* focusing / breaking: 타이머 */}
        {isTimerPhase && (
          <>
            <CycleProgress completed={completedCount} target={targetCount} showCurrent />
            <TimerDisplay
              display={timer.display}
              progress={timer.progress}
              status={timer.status}
              label={
                isBreak
                  ? `☕ ${isLastBreakLong ? "긴" : "짧은"} 휴식`
                  : `🍅 ${completedCount + 1} / ${targetCount} 집중 중`
              }
              progressColor={isBreak ? "text-break" : "text-focus"}
            />
            <TimerControls
              status={timer.status}
              onStart={timer.start}
              onPause={timer.pause}
              onResume={timer.resume}
              onStop={handleStopRequest}
              onReset={handleResetSession}
              disabled={false}
            />
            {isBreak && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipBreak}
              >
                건너뛰기
              </Button>
            )}
          </>
        )}

        {/* pomodoro_done: 중간 완료 → 휴식/종료 선택 */}
        {sessionPhase === "pomodoro_done" && (
          <>
            <CycleProgress completed={completedCount} target={targetCount} />
            <div className="text-center">
              <p className="text-lg font-semibold">
                🍅 {completedCount} / {targetCount} 완료!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {currentBreakMinutes}분 {isLastBreakLong ? "긴 " : ""}휴식할까요?
              </p>
            </div>
            <div className="flex gap-3">
              <Button size="lg" className="h-11" onClick={handleStartBreak}>
                휴식 시작
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="h-11"
                onClick={handleEndSessionEarly}
                disabled={isLoading}
              >
                세션 종료
              </Button>
            </div>
          </>
        )}

        {/* break_done: 휴식 끝 → 다음 집중/종료 선택 */}
        {sessionPhase === "break_done" && (
          <>
            <CycleProgress completed={completedCount} target={targetCount} />
            <div className="text-center">
              <p className="text-lg font-semibold">☕ 휴식 끝!</p>
              <p className="text-sm text-muted-foreground mt-1">
                다음: {completedCount + 1}회차 집중 {focusLabel}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                size="lg"
                className="h-11"
                onClick={handleStartNextFocus}
                disabled={isLoading}
              >
                {isLoading ? "준비 중..." : "집중 시작"}
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="h-11"
                onClick={handleEndSessionEarly}
                disabled={isLoading}
              >
                세션 종료
              </Button>
            </div>
          </>
        )}

        {/* session_completed: 세션 완료 */}
        {sessionPhase === "session_completed" && (
          <>
            {earnedPoints !== null && (
              <div className="text-center">
                <p className="text-2xl font-bold text-success">
                  +{earnedPoints} 포인트
                </p>
              </div>
            )}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {completedCount} / {targetCount} 사이클 완료
              </p>
            </div>
            <Button size="lg" className="w-40 h-11" onClick={handleResetSession}>
              다시 시작
            </Button>
          </>
        )}
      </CardContent>

      <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>세션을 중지할까요?</DialogTitle>
            <DialogDescription>
              중지하면 현재 진행 중인 포모도로는 완료로 인정되지 않습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowStopDialog(false)}
            >
              계속하기
            </Button>
            <Button
              variant="destructive"
              onClick={handleStopConfirm}
              disabled={isStopping}
            >
              {isStopping ? "중지 중..." : "중지"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
