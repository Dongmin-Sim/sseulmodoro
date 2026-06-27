"use client";

import Image from "next/image";
import { SessionBuddy } from "./session-buddy";
import { SessionSettings } from "./session-settings";

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
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow)]">
        <SessionBuddy slug={buddySlug} name={buddyName} size={72} glow="rgba(224,177,94,.24)" />
        <div>
          <p className="font-pixel text-[9px] tracking-[1px] text-gold-deep">TOTAL</p>
          <p className="font-mono mt-1 text-2xl font-semibold leading-none text-foreground">
            {formatTotal(focusTotal + breakTotal)}
          </p>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            집중 {focusTotal}분 · 휴식 {breakTotal}분
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow)]">
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

      <button
        type="button"
        onClick={onStart}
        disabled={isLoading}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] text-base font-bold text-primary-foreground shadow-[0_8px_20px_rgba(212,149,106,.4)] transition-transform hover:scale-[1.01] disabled:opacity-60"
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
