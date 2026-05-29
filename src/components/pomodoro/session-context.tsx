"use client";

import { createContext, useContext, useState } from "react";

/**
 * 포모도로 세션 뷰 상태.
 * /home에서 메인 화면(캐릭터+현황) ↔ 타이머 뷰 전환을 제어.
 * HomeClient와 PomodoroTimer가 공유한다.
 */
type PomodoroSessionValue = {
  isSessionActive: boolean;
  enterSession: () => void; // 타이머 뷰로
  exitSession: () => void; // 메인 뷰로 복귀
};

const PomodoroSessionContext = createContext<PomodoroSessionValue | null>(null);

export function PomodoroSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSessionActive, setIsSessionActive] = useState(false);

  return (
    <PomodoroSessionContext.Provider
      value={{
        isSessionActive,
        enterSession: () => setIsSessionActive(true),
        exitSession: () => setIsSessionActive(false),
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
