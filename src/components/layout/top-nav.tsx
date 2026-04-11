"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";
import { logout } from "@/lib/api/logout";

export function TopNav() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    // TODO: isSessionActive 체크 추가 예정 (포모도로 세션 진행 중 경고)
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
      router.replace("/login");
    } catch {
      setLogoutError("로그아웃에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <PageContainer className="flex h-14 items-center">
        <Link
          href="/"
          className="text-sm font-bold tracking-wide text-foreground"
        >
          쓸모도로
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {logoutError && (
            <p
              role="alert"
              aria-live="assertive"
              className="text-xs text-destructive"
            >
              {logoutError}
            </p>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-busy={isLoggingOut}
            aria-label={isLoggingOut ? "로그아웃 처리 중" : "로그아웃"}
          >
            {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
          </Button>
        </div>
      </PageContainer>
    </header>
  );
}
