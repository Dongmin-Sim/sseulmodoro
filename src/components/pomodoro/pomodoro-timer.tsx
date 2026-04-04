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
import { useTimer } from "./use-timer";
import { TimerDisplay } from "./timer-display";
import { TimerControls } from "./timer-controls";
import { SessionSettings } from "./session-settings";
import { SESSION_DEFAULTS } from "@/lib/constants";
import { startSession, endSession } from "@/lib/api/sessions";
import { completePomodoro, stopPomodoro } from "@/lib/api/pomodoros";

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

export function PomodoroTimer() {
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
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [pomodoroId, setPomodoroId] = useState<number | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const handleComplete = useCallback(async () => {
    if (!pomodoroId || !sessionId) return;

    try {
      await completePomodoro(pomodoroId);
      // TODO: 멀티 포모도로 UI 구현 시, 여기서 endSession을 자동 호출하지 않고
      // 사용자가 "다음 포모도로" 또는 "세션 종료"를 선택하도록 변경
      const result = await endSession(sessionId);
      setEarnedPoints(result.pointsEarned);
      sendNotification(
        "포모도로 완료!",
        `${focusLabel} 집중 완료! +${result.pointsEarned} 포인트`,
      );
    } catch (error) {
      console.error("Failed to complete pomodoro:", error);
      sendNotification("포모도로 완료!", `${focusLabel} 집중 완료!`);
    }
  }, [pomodoroId, sessionId, focusLabel]);

  const timer = useTimer({
    durationMinutes: focusMinutes,
    onComplete: handleComplete,
  });

  const handleFocusChange = (minutes: number, label: string) => {
    setFocusMinutes(minutes);
    setFocusLabel(label);
  };

  const handleStart = async () => {
    setEarnedPoints(null);
    setIsStarting(true);

    try {
      // Dev 테스트 옵션(10초, 30초)은 소수점 분이므로 올림하여 API 전달
      const session = await startSession({
        focusMinutes: Math.ceil(focusMinutes),
        shortBreakMinutes,
        longBreakMinutes,
        targetCount,
      });
      setSessionId(session.sessionId);
      setPomodoroId(session.pomodoroId);

      // 시작 전 알림 권한 미리 요청
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "default"
      ) {
        Notification.requestPermission();
      }

      timer.start();
    } catch (error) {
      console.error("Failed to start session:", error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopRequest = () => {
    setShowStopDialog(true);
  };

  // TODO: 멀티 포모도로 UI 구현 시, 중지 후 endSession 자동 호출을 제거하고
  // "다음 포모도로" 또는 "세션 종료" 선택지를 제공하도록 변경
  const handleStopConfirm = async () => {
    setShowStopDialog(false);
    setEarnedPoints(null);

    if (pomodoroId && sessionId) {
      try {
        await stopPomodoro(pomodoroId);
        await endSession(sessionId);
      } catch (error) {
        console.error("Failed to stop pomodoro:", error);
      }
    }

    timer.reset();
  };

  const handleReset = () => {
    setEarnedPoints(null);
    timer.reset();
  };

  const isIdle = timer.status === "idle";

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardContent className="flex flex-col items-center gap-6 pt-6">
        {isIdle && (
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
        )}

        {!isIdle && (
          <>
            <TimerDisplay
              display={timer.display}
              progress={timer.progress}
              status={timer.status}
            />

            {timer.status !== "completed" && (
              <p className="text-sm text-muted-foreground">
                {focusLabel} 집중 · {shortBreakMinutes}분 휴식
              </p>
            )}
          </>
        )}

        {earnedPoints !== null && timer.status === "completed" && (
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">
              +{earnedPoints} 포인트
            </p>
            <p className="text-sm text-muted-foreground">
              {focusLabel} 집중 완료
            </p>
          </div>
        )}

        <TimerControls
          status={timer.status}
          onStart={handleStart}
          onPause={timer.pause}
          onResume={timer.resume}
          onStop={handleStopRequest}
          onReset={handleReset}
          disabled={isStarting}
        />
      </CardContent>

      <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>포모도로를 중지할까요?</DialogTitle>
            <DialogDescription>
              중지하면 이번 포모도로는 완료로 인정되지 않습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowStopDialog(false)}
            >
              계속하기
            </Button>
            <Button variant="destructive" onClick={handleStopConfirm}>
              중지
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
