"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

/**
 * 포모도로 세션 뷰 상태.
 * /home에서 메인 화면(캐릭터+현황) ↔ 타이머 뷰 전환을 제어.
 * HomeClient와 PomodoroTimer가 공유한다.
 */
export type TimerHeaderMode = "default" | "prep" | "focus" | "break" | "complete";

type PomodoroSessionValue = {
  isSessionActive: boolean;
  enterSession: () => void; // 타이머 뷰로
  exitSession: () => void; // 메인 뷰로 복귀
  timerHeader: TimerHeaderMode; // 타이머 흐름 단계별 헤더 (준비/집중/휴식/완료)
  setTimerHeader: (mode: TimerHeaderMode) => void;
  requestStop: () => void; // 헤더 '집중 종료' → 타이머 중지 확인 다이얼로그 오픈
  registerStopHandler: (fn: (() => void) | null) => void; // 타이머가 중지 핸들러 등록
};

const PomodoroSessionContext = createContext<PomodoroSessionValue | null>(null);

export function PomodoroSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [timerHeader, setTimerHeader] = useState<TimerHeaderMode>("default");
  const stopHandlerRef = useRef<(() => void) | null>(null);

  const requestStop = useCallback(() => {
    stopHandlerRef.current?.();
  }, []);
  const registerStopHandler = useCallback((fn: (() => void) | null) => {
    stopHandlerRef.current = fn;
  }, []);

  return (
    <PomodoroSessionContext.Provider
      value={{
        isSessionActive,
        enterSession: () => setIsSessionActive(true),
        exitSession: () => {
          setIsSessionActive(false);
          setTimerHeader("default");
        },
        timerHeader,
        setTimerHeader,
        requestStop,
        registerStopHandler,
      }}
    >
      {children}
    </PomodoroSessionContext.Provider>
  );
}

export function usePomodoroSession() {
  const value = useContext(PomodoroSessionContext);
  if (!value) {
    throw new Error(
      "usePomodoroSession must be used within PomodoroSessionProvider",
    );
  }
  return value;
}
