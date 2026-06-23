"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { logout } from "@/lib/api/logout";
import { usePomodoroSession } from "@/components/pomodoro/session-context";
import { MAIN_NAV_ITEMS } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

type AuthHeaderProps = {
  nickname: string | null;
  balance: number;
};

const TAB_BASE = "relative px-5 py-3 text-sm transition-colors";
const tabClass = (isActive: boolean) =>
  isActive
    ? "font-bold text-foreground"
    : "font-medium text-muted-foreground hover:text-foreground";
const ActiveUnderline = () => (
  <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-primary" />
);

// 인증 영역 공통 상단 헤더 (2줄, sticky)
//  - 윗줄: 로고 + 잔액 + 닉네임(→/profile) + 로그아웃
//  - 아랫줄: 섹션 탭(홈·도감·상점·기록)
// 로그아웃 경고는 타이머가 실제 보이는 상황(/home + 세션 활성)에서만 띄운다.
export function AuthHeader({ nickname, balance }: AuthHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isSessionActive, exitSession } = usePomodoroSession();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const isTimerView = pathname === "/home" && isSessionActive;

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
    // 타이머 화면일 때만 데이터 손실 경고, 그 외엔 바로 로그아웃
    if (isTimerView) setShowLogoutDialog(true);
    else void doLogout();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      {/* 윗줄 — 로고 + 잔액 + 닉네임 + 로그아웃 */}
      <PageContainer className="flex h-14 items-center gap-2">
        <Link
          href="/home"
          className="flex items-center min-h-[44px] text-sm font-bold tracking-wide text-foreground"
        >
          쓸모도로
        </Link>

        <div className="ml-auto flex items-center gap-1.5">
          {logoutError && (
            <p role="alert" aria-live="assertive" className="text-xs text-destructive">
              {logoutError}
            </p>
          )}
          <div className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold shadow-sm">
            <span className="text-primary">✦</span>
            <span>{balance.toLocaleString()}</span>
          </div>
          <Link
            href="/profile"
            aria-label="내 정보"
            className="flex min-h-[44px] items-center gap-1.5 rounded-full px-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            <span aria-hidden>👤</span>
            <span className="max-w-[7rem] truncate">{nickname ?? "내 정보"}</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px] text-xs text-muted-foreground"
            onClick={handleLogoutClick}
            disabled={isLoggingOut}
            aria-busy={isLoggingOut}
            aria-label={isLoggingOut ? "로그아웃 처리 중" : "로그아웃"}
          >
            {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
          </Button>
        </div>
      </PageContainer>

      {/* 아랫줄 — 섹션 탭 */}
      <PageContainer>
        <nav className="flex items-center justify-center">
          {MAIN_NAV_ITEMS.map((item) => {
            const href = item.href ?? "#";
            // 홈 탭: /home에서 타이머 뷰면 클릭 시 메인 복귀(세션 종료 액션)
            if (href === "/home" && pathname === "/home") {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={exitSession}
                  className={cn(TAB_BASE, tabClass(!isSessionActive))}
                >
                  {item.label}
                  {!isSessionActive && <ActiveUnderline />}
                </button>
              );
            }
            const isActive = pathname === href;
            return (
              <Link
                key={item.label}
                href={href}
                className={cn(TAB_BASE, tabClass(isActive))}
              >
                {item.label}
                {isActive && <ActiveUnderline />}
              </Link>
            );
          })}
        </nav>
      </PageContainer>

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
            <Button variant="secondary" onClick={() => setShowLogoutDialog(false)}>
              계속하기
            </Button>
            <Button variant="destructive" onClick={doLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
