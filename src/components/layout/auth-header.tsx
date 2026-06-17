"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

// 인증 영역 공통 상단 헤더 — 닉네임(→/profile) + 로그아웃.
// 로그아웃은 포모도로 세션 진행 중이면 경고 Dialog를 띄운다.
export function AuthHeader({ nickname }: { nickname: string | null }) {
  const router = useRouter();
  const { isSessionActive } = usePomodoroSession();
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

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <PageContainer className="flex h-14 items-center">
        <Link
          href="/home"
          className="flex items-center min-h-[44px] text-sm font-bold tracking-wide text-foreground"
        >
          쓸모도로
        </Link>

        <div className="ml-auto flex items-center gap-1">
          {logoutError && (
            <p role="alert" aria-live="assertive" className="text-xs text-destructive">
              {logoutError}
            </p>
          )}
          {/* 내 정보 — 닉네임 클릭 시 프로필 페이지 */}
          <Link
            href="/profile"
            aria-label="내 정보"
            className="flex min-h-[44px] items-center gap-1.5 rounded-full px-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            <span aria-hidden>👤</span>
            <span className="max-w-[8rem] truncate">{nickname ?? "내 정보"}</span>
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
