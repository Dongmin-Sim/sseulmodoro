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

// 픽셀 로고칩 — 도트 큐브 느낌(inset 그림자 + 오프셋 그린)
function LogoChip({ size = 16 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="shrink-0 rounded-[4px] bg-primary-deep"
      style={{
        width: size,
        height: size,
        boxShadow: "inset 0 -4px 0 rgba(0,0,0,.12), 3px -6px 0 -2px var(--break)",
      }}
    />
  );
}

// 섹션 탭(홈·도감·상점·기록). 홈 탭은 /home에서 세션 종료 액션으로 동작.
function NavTabs({ variant }: { variant: "desktop" | "mobile" }) {
  const pathname = usePathname();
  const { isSessionActive, exitSession } = usePomodoroSession();
  const isMobile = variant === "mobile";

  const itemBase = isMobile
    ? "relative flex-1 py-3 text-center text-[13px] transition-colors"
    : "relative px-[18px] py-2.5 text-sm transition-colors";
  const toneClass = (isActive: boolean) =>
    isActive
      ? "font-bold text-foreground"
      : "font-medium text-muted-foreground hover:text-foreground";
  const underline = (
    <span
      className={cn(
        "absolute left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-primary",
        isMobile ? "bottom-0" : "-bottom-px",
      )}
    />
  );

  return (
    <nav
      className={cn(
        isMobile ? "flex w-full" : "mx-auto hidden items-center gap-1 lg:flex",
      )}
    >
      {MAIN_NAV_ITEMS.map((item) => {
        const href = item.href ?? "#";
        // 홈 탭: /home에서 타이머 뷰면 클릭 시 메인 복귀(세션 종료)
        if (href === "/home" && pathname === "/home") {
          return (
            <button
              key={item.label}
              type="button"
              onClick={exitSession}
              className={cn(itemBase, toneClass(!isSessionActive))}
            >
              {item.label}
              {!isSessionActive && underline}
            </button>
          );
        }
        const isActive = pathname === href;
        return (
          <Link key={item.label} href={href} className={cn(itemBase, toneClass(isActive))}>
            {item.label}
            {isActive && underline}
          </Link>
        );
      })}
    </nav>
  );
}

// 인증 영역 공통 상단 헤더 (sticky)
//  - 데스크톱: 단일 바 — 로고 | 중앙 탭 | 잔액·아바타·로그아웃
//  - 모바일: 2줄 — [로고 | 잔액·아바타] / [풀폭 탭]
// 로그아웃 경고는 타이머가 실제 보이는 상황(/home + 세션 활성)에서만 띄운다.
export function AuthHeader({ nickname, balance }: AuthHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isSessionActive } = usePomodoroSession();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const isTimerView = pathname === "/home" && isSessionActive;
  const initial = nickname?.trim()?.[0] ?? "나";

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
    if (isTimerView) setShowLogoutDialog(true);
    else void doLogout();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <PageContainer>
        {/* 윗줄 — 로고 | (데스크톱 중앙 탭) | 잔액·아바타·로그아웃 */}
        <div className="flex h-14 items-center gap-2 lg:h-[66px]">
          <Link href="/home" className="flex items-center gap-2" aria-label="홈">
            <LogoChip />
            <span className="font-pixel text-sm tracking-wide text-foreground">쓸모도로</span>
          </Link>

          <NavTabs variant="desktop" />

          <div className="ml-auto flex items-center gap-1.5">
            {logoutError && (
              <p role="alert" aria-live="assertive" className="text-xs text-destructive">
                {logoutError}
              </p>
            )}
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
              <span className="text-gold" aria-hidden>
                ✦
              </span>
              <span className="font-mono text-xs font-semibold tabular-nums tracking-wide">
                {balance.toLocaleString()}
              </span>
            </div>
            <Link
              href="/profile"
              aria-label={nickname ? `${nickname} 내 정보` : "내 정보"}
              className="flex items-center gap-2 rounded-full py-1 pr-3 pl-1 hover:bg-muted"
            >
              <span
                aria-hidden
                className="grid size-7 place-items-center rounded-[8px] bg-primary text-xs font-bold text-primary-foreground"
              >
                {initial}
              </span>
              <span className="hidden max-w-[7rem] truncate text-sm font-semibold sm:inline">
                {nickname ?? "내 정보"}
              </span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={handleLogoutClick}
              disabled={isLoggingOut}
              aria-busy={isLoggingOut}
              aria-label={isLoggingOut ? "로그아웃 처리 중" : "로그아웃"}
            >
              {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
            </Button>
          </div>
        </div>

        {/* 아랫줄 — 모바일 풀폭 탭 (데스크톱은 윗줄 중앙 탭) */}
        <div className="lg:hidden">
          <NavTabs variant="mobile" />
        </div>
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
