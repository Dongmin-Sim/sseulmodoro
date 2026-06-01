"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CharacterBlob } from "@/components/home/character-blob";
import { PomodoroTimer } from "@/components/pomodoro/pomodoro-timer";
import { usePomodoroSession } from "@/components/pomodoro/session-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageContainer } from "@/components/layout/page-container";
import { ContentNav } from "@/components/layout/content-nav";
import { logout } from "@/lib/api/logout";
import type { HomeDataResponse } from "@/lib/types/api";

const RARITY_LABEL: Record<string, string> = {
  common: "커먼",
  uncommon: "언커먼",
  rare: "레어",
  epic: "에픽",
  legendary: "레전더리",
};

// TODO: TASK-30/31 연동 후 실데이터로 교체
const WEEKLY_PLACEHOLDER = {
  pomodoroCount: 0,
  focusTime: "0h 00m",
  streakDays: 0,
  earnedPoints: 0,
  bars: [0, 0, 0, 0, 0, 0, 0] as number[],
};
const WEEK_DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;

type HomeClientProps = {
  data: HomeDataResponse | null;
};

export function HomeClient({ data }: HomeClientProps) {
  const { isSessionActive, enterSession, exitSession } = usePomodoroSession();

  const navItems = [
    { label: "홈", onSelect: exitSession, active: !isSessionActive },
    { label: "도감", href: "/collection", disabled: true },
    { label: "상점", href: "/shop", disabled: true },
    { label: "기록", href: "/history", disabled: true },
  ];

  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const doLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
      router.replace("/login");
    } catch {
      setLogoutError("로그아웃에 실패했습니다. 다시 시도해주세요.");
      setIsLoggingOut(false);
    }
  };

  const handleLogoutClick = () => {
    // 세션 진행 중이면 데이터 손실 경고 후 확인, 아니면 바로 로그아웃
    if (isSessionActive) setShowLogoutDialog(true);
    else void doLogout();
  };

  const logoutAction = (
    <div className="flex items-center gap-2">
      {logoutError && (
        <p role="alert" aria-live="assertive" className="text-xs text-destructive">
          {logoutError}
        </p>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground"
        onClick={handleLogoutClick}
        disabled={isLoggingOut}
        aria-label={isLoggingOut ? "로그아웃 처리 중" : "로그아웃"}
      >
        {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
      </Button>
    </div>
  );

  // 렌더 시점 기준 "오늘" 계산. 모듈 레벨 상수는 탭을 자정 넘어 열어두면 stale.
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  const character = data?.mainCharacter ?? null;
  const balance = data?.balance ?? 0;
  const rarityLabel = character
    ? (RARITY_LABEL[character.rarity] ?? character.rarity)
    : null;

  return (
    <main className="relative z-10 flex flex-1 flex-col py-5">
      <PageContainer className="flex flex-col">
        <ContentNav items={navItems} balance={balance} action={logoutAction} />

        {isSessionActive ? (
          <PomodoroTimer />
        ) : (
          <div className="flex flex-col items-center">
            {/* 캐릭터 */}
            {character ? (
              <>
                <CharacterBlob rarity={rarityLabel ?? undefined} className="mb-6" />
                <h1 className="mb-2.5 text-[22px] font-bold tracking-tight text-foreground">
                  {character.name}
                </h1>
                <div className="mb-8 flex gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-full px-3.5 py-1 text-xs font-semibold"
                  >
                    Lv. {character.level}
                  </Badge>
                  <Badge
                    className="rounded-full px-3.5 py-1 text-xs font-semibold text-white"
                    style={{
                      background: "linear-gradient(135deg, #D4956A, #C4725C)",
                      boxShadow: "0 2px 8px rgba(212,149,106,0.35)",
                      border: "none",
                    }}
                  >
                    {rarityLabel}
                  </Badge>
                </div>
              </>
            ) : (
              <>
                <div
                  className="mb-6 flex items-center justify-center"
                  style={{
                    width: 140,
                    height: 140,
                    background: "#EDE8E1",
                    borderRadius: "50%",
                  }}
                >
                  <span className="text-4xl">?</span>
                </div>
                <h1 className="mb-2.5 text-[22px] font-bold tracking-tight text-foreground">
                  캐릭터 없음
                </h1>
                <div className="mb-8 flex gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-full px-3.5 py-1 text-xs font-semibold text-muted-foreground"
                  >
                    뽑기로 시작하세요
                  </Badge>
                </div>
              </>
            )}

            {/* 금주 현황 — TODO: TASK-30/31 연동 후 실데이터로 교체 */}
            <Card className="mb-6 w-full">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    이번 주 현황
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl font-bold leading-none text-primary">
                      {WEEKLY_PLACEHOLDER.pomodoroCount}
                    </span>
                    <span className="text-center text-xs font-medium text-muted-foreground">
                      완료한 포모도로
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl font-bold leading-none text-foreground">
                      {WEEKLY_PLACEHOLDER.focusTime}
                    </span>
                    <span className="text-center text-xs font-medium text-muted-foreground">
                      총 집중 시간
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl font-bold leading-none" style={{ color: "#7BA68E" }}>
                      {WEEKLY_PLACEHOLDER.streakDays}
                    </span>
                    <span className="text-center text-xs font-medium text-muted-foreground">
                      연속 집중일
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl font-bold leading-none text-foreground">
                      +{WEEKLY_PLACEHOLDER.earnedPoints}
                    </span>
                    <span className="text-center text-xs font-medium text-muted-foreground">
                      획득 포인트
                    </span>
                  </div>
                </div>
                {/* 미니 바 차트 */}
                <div className="mt-4 flex items-end gap-1 border-t border-border pt-4">
                  {WEEKLY_PLACEHOLDER.bars.map((height, i) => (
                    <div
                      key={WEEK_DAYS[i]}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <div
                        className="w-full rounded-t-sm"
                        style={{
                          height: Math.max(height, 4),
                          background:
                            i === todayIndex
                              ? "#D4956A"
                              : "rgba(212,149,106,0.2)",
                          opacity: height === 0 ? 0.35 : 1,
                        }}
                      />
                      <span
                        className="text-[10px] font-medium"
                        style={{
                          color: i === todayIndex ? "#D4956A" : "#9C9590",
                          fontWeight: i === todayIndex ? 700 : 500,
                        }}
                      >
                        {WEEK_DAYS[i]}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Button
              className="w-full rounded-[10px] py-4 text-base font-bold text-white"
              style={{
                background: "#D4956A",
                boxShadow: "0 6px 16px rgba(212,149,106,0.38)",
                border: "none",
                height: "auto",
              }}
              onClick={enterSession}
            >
              집중 시작
            </Button>
          </div>
        )}

        <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>로그아웃할까요?</DialogTitle>
              <DialogDescription>
                진행 중인 포모도로 세션이 있습니다. 로그아웃하면 현재 진행 상황이
                저장되지 않을 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setShowLogoutDialog(false)}
              >
                계속하기
              </Button>
              <Button
                variant="destructive"
                onClick={doLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </main>
  );
}
