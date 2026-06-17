"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { ContentNav } from "@/components/layout/content-nav";
import { MAIN_NAV_ITEMS } from "@/components/layout/nav-items";
import { Button } from "@/components/ui/button";
import { EggReveal } from "@/components/character/egg-reveal";
import { drawGacha } from "@/lib/api/gacha";

type ShopClientProps = {
  balance: number;
  gachaCost: number;
};

export function ShopClient({ balance: initialBalance, gachaCost }: ShopClientProps) {
  const [balance, setBalance] = useState(initialBalance);
  const [revealing, setRevealing] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);

  const canDraw = balance >= gachaCost;

  const handleStartDraw = () => {
    if (!canDraw) return;
    setDrawError(null);
    setRevealing(true); // 알 모드 진입 — 실제 draw는 알 탭 시점(EggReveal.onReveal)
  };

  // 알 탭 시 호출 — 연출이 응답 대기를 가린다(로딩 마스크).
  const handleReveal = async () => {
    const res = await drawGacha();
    setBalance(res.newBalance);
    return {
      slug: res.characterInstance.slug,
      name: res.characterInstance.name,
      rarity: res.characterInstance.rarity,
      isNew: res.isNew,
    };
  };

  const handleRevealError = (msg: string) => {
    setRevealing(false);
    setDrawError(
      msg === "insufficient_balance"
        ? "포인트가 부족해요."
        : "뽑기에 실패했어요. 다시 시도해주세요.",
    );
  };

  const handleConfirm = () => {
    setRevealing(false);
    setDrawError(null);
  };

  return (
    <main className="relative z-10 flex flex-1 flex-col py-5">
      <PageContainer className="flex flex-col">
        <ContentNav items={MAIN_NAV_ITEMS} balance={balance} />

        {revealing ? (
          <EggReveal
            onReveal={handleReveal}
            onError={handleRevealError}
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
