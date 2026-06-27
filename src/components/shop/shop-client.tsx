"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PageContainer } from "@/components/layout/page-container";
import { EggReveal } from "@/components/character/egg-reveal";
import { LockCard } from "@/components/collection/lock-card";
import { drawGacha } from "@/lib/api/gacha";
import { getRarityMeta } from "@/lib/rarity";

const RARITY_SEQUENCE = ["common", "rare", "epic", "legendary", "mythic"] as const;

type ShopClientProps = {
  balance: number;
  gachaCost: number;
  weights: Record<string, number>;
};

export function ShopClient({ balance: initialBalance, gachaCost, weights }: ShopClientProps) {
  const router = useRouter();
  const [balance, setBalance] = useState(initialBalance);
  const [revealing, setRevealing] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);

  const canDraw = balance >= gachaCost;
  const drawsLeft = Math.floor(balance / gachaCost);

  const total = RARITY_SEQUENCE.reduce((sum, r) => sum + (weights[r] ?? 0), 0) || 1;
  const rates = RARITY_SEQUENCE.filter((r) => (weights[r] ?? 0) > 0).map((r) => {
    const meta = getRarityMeta(r);
    return { rarity: r, label: meta.label, accent: meta.accent, pct: ((weights[r] ?? 0) / total) * 100 };
  });

  const handleStartDraw = () => {
    if (!canDraw) return;
    setDrawError(null);
    setRevealing(true);
  };

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
    router.refresh();
  };

  if (revealing) {
    return (
      <main className="relative z-10 flex flex-1 flex-col py-5">
        <PageContainer className="flex flex-col">
          <EggReveal onReveal={handleReveal} onError={handleRevealError} onConfirm={handleConfirm} />
        </PageContainer>
      </main>
    );
  }

  return (
    <main className="relative z-10 flex flex-1 flex-col bg-grid py-6">
      <div className="mx-auto w-full max-w-[960px] px-4">
        <div className="mb-7 text-center">
          <p className="font-pixel text-[11px] tracking-[1.5px] text-primary">GACHA</p>
          <h1 className="mt-2 text-[26px] font-extrabold tracking-tight text-foreground">알에서 새 친구 만나기</h1>
        </div>

        <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
          {/* 알 무대 + CTA */}
          <section className="flex flex-col items-center rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-md)]">
            <div className="relative flex h-56 w-full items-center justify-center">
              <div
                className="absolute h-56 w-56 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(224,177,94,.28), rgba(224,177,94,0) 62%)" }}
              />
              <span className="animate-sparkle-pulse absolute left-16 top-8 text-sm text-gold">✦</span>
              <span className="animate-sparkle-pulse absolute right-20 top-14 text-xs text-primary" style={{ animationDelay: ".4s" }}>
                ✦
              </span>
              <div
                className="animate-buddy-bob flex h-36 w-36 items-center justify-center rounded-3xl"
                style={{ background: "#F4ECD9", boxShadow: "inset 0 0 0 1.5px #E2D2A8" }}
              >
                <Image src="/icons/egg-smooth.png" alt="알" width={104} height={104} unoptimized className="pixelated" />
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartDraw}
              disabled={!canDraw}
              aria-label="알 뽑기"
              className="mt-4 flex w-full max-w-80 items-center justify-center gap-2 rounded-[14px] py-4 text-base font-bold text-primary-foreground shadow-[0_8px_20px_rgba(212,149,106,.4)] transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
              style={{ background: "var(--primary-gradient)" }}
            >
              알 뽑기
              <span className="font-mono inline-flex items-center gap-1">
                <span className="text-[#FBE3C8]">✦</span> {gachaCost.toLocaleString()}
              </span>
            </button>
            <p className="font-mono mt-2.5 text-xs text-muted-foreground">
              보유 ✦ {balance.toLocaleString()} · {drawsLeft}번 더 가능
            </p>
            {!canDraw && (
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                포모도로를 완료하면 포인트가 쌓여요.
              </p>
            )}
            {drawError && (
              <p role="alert" aria-live="assertive" className="mt-2 text-xs text-destructive">
                {drawError}
              </p>
            )}
          </section>

          {/* 확률 + 만날 수 있는 친구 */}
          <div className="flex flex-col gap-5">
            <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow)]">
              <p className="font-pixel mb-4 text-[10px] tracking-[1.5px] text-muted-foreground">DROP RATE</p>
              <div className="mb-4 flex h-2.5 overflow-hidden rounded-full">
                {rates.map((r) => (
                  <div key={r.rarity} style={{ width: `${r.pct}%`, background: r.accent }} />
                ))}
              </div>
              <div className="flex flex-col gap-3">
                {rates.map((r) => (
                  <div key={r.rarity} className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: r.accent }} />
                    <span className="flex-1 text-[13px] font-semibold text-foreground">{r.label}</span>
                    <span className="font-mono text-[13px] font-semibold text-text-secondary">
                      {r.pct < 1 ? r.pct.toFixed(1) : Math.round(r.pct)}%
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow)]">
              <p className="font-pixel mb-4 text-[10px] tracking-[1.5px] text-muted-foreground">만날 수 있는 친구</p>
              <div className="grid grid-cols-4 gap-2.5">
                {(["rare", "epic", "legendary", "mythic"] as const).map((r) => (
                  <LockCard key={r} rarity={r} className="w-full" />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
