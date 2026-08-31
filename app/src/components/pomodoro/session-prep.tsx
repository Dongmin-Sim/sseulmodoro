"use client";

import Image from "next/image";
import Link from "next/link";
import { SessionBuddy } from "./session-buddy";
import { SessionSettings } from "./session-settings";
import { BirdCard } from "@/components/character/bird-card";

function formatTotal(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `약 ${mins}분`;
  if (mins === 0) return `약 ${hours}시간`;
  return `약 ${hours}시간 ${mins}분`;
}

type SessionPrepProps = {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  targetCount: number;
  buddySlug: string | null;
  buddyName: string;
  buddyRarity: string;
  isLoading: boolean;
  onFocusChange: (minutes: number, label: string) => void;
  onShortBreakChange: (minutes: number) => void;
  onLongBreakChange: (minutes: number) => void;
  onTargetCountChange: (count: number) => void;
  onStart: () => void;
};

export function SessionPrep({
  focusMinutes,
  shortBreakMinutes,
  longBreakMinutes,
  targetCount,
  buddySlug,
  buddyName,
  buddyRarity,
  isLoading,
  onFocusChange,
  onShortBreakChange,
  onLongBreakChange,
  onTargetCountChange,
  onStart,
}: SessionPrepProps) {
  const focusTotal = focusMinutes * targetCount;
  const breakTotal = shortBreakMinutes * (targetCount - 1) + longBreakMinutes;

  return (
    <div className="mx-auto flex w-full max-w-[980px] flex-col">
      <div className="grid gap-6 lg:grid-cols-[.92fr_1.08fr] lg:items-stretch">
        {/* 좌: 세션 프리뷰 */}
        <div className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-md)]">
          <p className="font-pixel text-[10px] tracking-[1.5px] text-muted-foreground">SESSION PREVIEW</p>

          <div className="flex justify-center py-2">
            <SessionBuddy slug={buddySlug} name={buddyName} size={104} glow="rgba(224,177,94,.24)" />
          </div>
          <p className="text-center text-[13px] font-semibold text-text-secondary">{buddyName}와 함께 집중 준비</p>

          {/* 함께할 친구 */}
          <div className="mt-5">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">함께할 친구</span>
              <Link href="/select" className="text-[11px] font-semibold text-primary hover:underline">
                선택 페이지 →
              </Link>
            </div>
            <div className="flex gap-2.5">
              {buddySlug && (
                <div className="w-20">
                  <BirdCard
                    slug={buddySlug}
                    rarity={buddyRarity}
                    name={buddyName}
                    className="rounded-xl shadow-[0_0_0_2px_var(--primary),0_0_0_4px_rgba(212,149,106,.18)]"
                  />
                </div>
              )}
              <Link
                href="/select"
                className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border text-xs font-semibold text-muted-foreground transition-colors hover:bg-surface-2"
              >
                다른 친구와 집중하기 →
              </Link>
            </div>
          </div>

          {/* TOTAL */}
          <div className="mt-5 rounded-2xl border border-border-warm bg-surface-3 p-4 text-center">
            <p className="font-pixel text-[9px] tracking-[1.5px] text-gold-deep">TOTAL</p>
            <p className="font-mono mt-2 text-3xl font-semibold leading-none text-foreground">
              {formatTotal(focusTotal + breakTotal)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              집중 {focusTotal}분 · 휴식 {breakTotal}분
            </p>
          </div>

          {/* 사이클 흐름 */}
          <div className="mt-5">
            <p className="mb-3 text-xs font-semibold text-text-secondary">사이클 흐름</p>
            <div className="flex items-center gap-2.5 rounded-2xl border border-border-warm bg-surface-3 p-3">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-focus/25 bg-focus/10 px-2.5 py-1.5 text-[11px] font-semibold text-focus">
                  <Image src="/icons/tomato.png" alt="" width={15} height={15} unoptimized className="pixelated" />
                  집중 {focusMinutes}분
                </span>
                <span className="font-bold text-text-faint">→</span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-break/25 bg-break/10 px-2.5 py-1.5 text-[11px] font-semibold text-break">
                  <Image src="/icons/coffee.png" alt="" width={14} height={14} unoptimized className="pixelated" />
                  휴식 {shortBreakMinutes}분
                </span>
              </div>
              <span className="font-mono whitespace-nowrap rounded-lg border border-focus/25 bg-focus/10 px-2.5 py-1.5 text-[13px] font-bold text-focus">
                × {targetCount}
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-2 pl-1">
              <span className="font-bold text-text-faint">↳</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border-warm bg-gold/10 px-2.5 py-1.5 text-[11px] font-semibold text-gold-deep">
                <Image src="/icons/tree.png" alt="" width={15} height={15} unoptimized className="pixelated" />
                긴 휴식 {longBreakMinutes}분
              </span>
              <span className="text-[11px] text-muted-foreground">으로 마무리</span>
            </div>
          </div>
        </div>

        {/* 우: 옵션 */}
        <SessionSettings
          focusMinutes={focusMinutes}
          shortBreakMinutes={shortBreakMinutes}
          longBreakMinutes={longBreakMinutes}
          targetCount={targetCount}
          onFocusChange={onFocusChange}
          onShortBreakChange={onShortBreakChange}
          onLongBreakChange={onLongBreakChange}
          onTargetCountChange={onTargetCountChange}
        />
      </div>

      <button
        type="button"
        onClick={onStart}
        disabled={isLoading}
        className="mx-auto mt-6 flex h-14 w-full max-w-[440px] items-center justify-center gap-2 rounded-[14px] text-base font-bold text-primary-foreground shadow-[0_8px_20px_rgba(212,149,106,.4)] transition-transform hover:scale-[1.01] disabled:opacity-60"
        style={{ background: "var(--primary-gradient)" }}
      >
        {isLoading ? (
          "준비 중..."
        ) : (
          <>
            <span className="text-xs">▶</span> 집중 시작 · {focusMinutes}분
          </>
        )}
      </button>
    </div>
  );
}
