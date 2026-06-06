"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { ContentNav } from "@/components/layout/content-nav";
import { Button } from "@/components/ui/button";
import { GachaReveal } from "@/components/shop/gacha-reveal";
import { logout } from "@/lib/api/logout";
import { drawGacha } from "@/lib/api/gacha";

const NAV_ITEMS = [
  { label: "홈", href: "/home" },
  { label: "도감", href: "/collection", disabled: true },
  { label: "상점", href: "/shop" },
  { label: "기록", href: "/history" },
];

type ShopClientProps = {
  balance: number;
  gachaCost: number;
};

export function ShopClient({ balance: initialBalance, gachaCost }: ShopClientProps) {
  const router = useRouter();

  const [balance, setBalance] = useState(initialBalance);
  const [revealing, setRevealing] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const canDraw = balance >= gachaCost;

  const handleStartDraw = () => {
    if (!canDraw) return;
    setDrawError(null);
    setRevealing(true); // 알 모드 진입 — 실제 draw는 알 탭 시점(GachaReveal.onDraw)
  };

  // 알 탭 시 호출 — 연출이 응답 대기를 가린다(로딩 마스크).
  const handleDraw = async () => {
    const res = await drawGacha();
    setBalance(res.newBalance);
    return res;
  };

  const handleDrawError = (msg: string) => {
    setRevealing(false);
    setDrawError(msg);
  };

  const handleConfirm = () => {
    setRevealing(false);
    setDrawError(null);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
      router.replace("/login");
    } catch {
      setLogoutError("로그아웃에 실패했습니다.");
      setIsLoggingOut(false);
    }
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
        onClick={handleLogout}
        disabled={isLoggingOut}
        aria-label={isLoggingOut ? "로그아웃 처리 중" : "로그아웃"}
      >
        {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
      </Button>
    </div>
  );

  return (
    <main className="relative z-10 flex flex-1 flex-col py-5">
      <PageContainer className="flex flex-col">
        <ContentNav items={NAV_ITEMS} balance={balance} action={logoutAction} />

        {revealing ? (
          <GachaReveal
            onDraw={handleDraw}
            onError={handleDrawError}
            onConfirm={handleConfirm}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10">
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-[22px] font-bold tracking-tight text-foreground">
                캐릭터 뽑기
              </h1>
              <p className="text-sm text-muted-foreground">
                포인트로 새로운 친구를 만나보세요.
              </p>
            </div>

            <div
              className="flex h-40 w-40 items-center justify-center rounded-[24px]"
              style={{
                background: "#F4ECD9",
                boxShadow: "inset 0 0 0 1.5px #E2D2A8",
              }}
              aria-hidden
            >
              <span className="text-5xl">🥚</span>
            </div>

            <div className="flex w-full flex-col items-center gap-2">
              <Button
                className="w-full rounded-[10px] py-4 text-base font-bold text-white"
                style={{
                  background: canDraw ? "#D4956A" : "#D7CFC6",
                  boxShadow: canDraw ? "0 6px 16px rgba(212,149,106,0.38)" : "none",
                  border: "none",
                  height: "auto",
                }}
                onClick={handleStartDraw}
                disabled={!canDraw}
                aria-label="캐릭터 뽑기"
              >
                {`뽑기  ✦ ${gachaCost.toLocaleString()}`}
              </Button>

              {balance < gachaCost && (
                <p className="text-xs font-medium text-muted-foreground">
                  포인트가 부족해요. 포모도로를 완료하면 포인트가 쌓여요.
                </p>
              )}
              {drawError && (
                <p role="alert" aria-live="assertive" className="text-xs text-destructive">
                  {drawError}
                </p>
              )}
            </div>
          </div>
        )}
      </PageContainer>
    </main>
  );
}
