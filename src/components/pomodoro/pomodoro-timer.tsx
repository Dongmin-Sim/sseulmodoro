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
import { DurationSelector } from "./duration-selector";
import { startSession } from "@/lib/api/sessions";

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
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [durationLabel, setDurationLabel] = useState("25분");
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const handleComplete = useCallback(() => {
    setEarnedPoints(10);
    sendNotification("포모도로 완료!", `${durationLabel} 집중 완료! +10 포인트`);
  }, [durationLabel]);

  const timer = useTimer({
    durationMinutes,
    onComplete: handleComplete,
  });

  const handleDurationSelect = (minutes: number, label: string) => {
    setDurationMinutes(minutes);
    setDurationLabel(label);
  };

  const handleStart = async () => {
    setEarnedPoints(null);
    setIsStarting(true);

    try {
      const session = await startSession(durationMinutes);
      setSessionId(session.sessionId);

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

  const handleAbandonRequest = () => {
    setShowAbandonDialog(true);
  };

  const handleAbandonConfirm = () => {
    setShowAbandonDialog(false);
    setEarnedPoints(null);
    timer.reset();
  };

  const handleReset = () => {
    setEarnedPoints(null);
    timer.reset();
  };

  const isTimerActive = timer.status === "running" || timer.status === "paused";

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardContent className="flex flex-col items-center gap-6 pt-6">
        <DurationSelector
          selected={durationMinutes}
          onSelect={handleDurationSelect}
          disabled={isTimerActive}
        />

        <TimerDisplay
          display={timer.display}
          progress={timer.progress}
          status={timer.status}
        />

        {earnedPoints !== null && timer.status === "completed" && (
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">
              +{earnedPoints} 포인트
            </p>
            <p className="text-sm text-muted-foreground">
              {durationLabel} 집중 완료
            </p>
          </div>
        )}

        <TimerControls
          status={timer.status}
          onStart={handleStart}
          onPause={timer.pause}
          onResume={timer.resume}
          onAbandon={handleAbandonRequest}
          onReset={handleReset}
          disabled={isStarting}
        />
      </CardContent>

      <Dialog open={showAbandonDialog} onOpenChange={setShowAbandonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>포모도로를 포기할까요?</DialogTitle>
            <DialogDescription>
              포기하면 이번 세션의 포인트를 받을 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowAbandonDialog(false)}
            >
              계속하기
            </Button>
            <Button variant="destructive" onClick={handleAbandonConfirm}>
              포기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
