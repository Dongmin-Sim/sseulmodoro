"use client";

import Image from "next/image";
import { SessionBuddy } from "./session-buddy";
import { TimerDisplay } from "./timer-display";
import type { TimerStatus } from "./use-timer";

const BREAK_GRADIENT = "linear-gradient(135deg,#7BA68E,#5E8A72)";
const BREAK_TIPS = ["물 한 잔 마시기", "창밖을 보며 눈 쉬기", "가볍게 어깨 스트레칭"] as const;

type BreakScreenProps = {
  display: string;
  progress: number;
  status: TimerStatus;
  isLastBreakLong: boolean;
  nextFocusIndex: number;
  buddySlug: string | null;
  buddyName: string;
  isTransitioning: boolean;
  onSkip: () => void;
  onEnd: () => void;
};

export function BreakScreen({
  display,
  progress,
  status,
  isLastBreakLong,
  nextFocusIndex,
  buddySlug,
  buddyName,
  isTransitioning,
  onSkip,
  onEnd,
}: BreakScreenProps) {
  const label = isLastBreakLong
    ? "긴 휴식 · 마무리 직전"
    : `짧은 휴식 · 다음 ${nextFocusIndex}번째 집중`;

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2 rounded-full border border-break/30 bg-break/10 px-4 py-1.5">
        <Image src="/icons/coffee.png" alt="" width={16} height={16} unoptimized className="pixelated" />
        <span className="font-pixel text-[10px] tracking-[1px] text-break">BREAK TIME</span>
      </div>

      <div className="mt-5">
        <TimerDisplay
          display={display}
          progress={progress}
          status={status}
          label={label}
          progressColor="text-break"
        />
      </div>

      <div className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-break/25 bg-card/70 p-3.5">
        <SessionBuddy slug={buddySlug} name={buddyName} size={60} glow="rgba(123,166,142,.22)" />
        <div>
          <p className="text-sm font-extrabold text-foreground">포모도 잠깐 쉬는 중</p>
          <p className="mt-0.5 text-[11px] text-text-secondary">휴식이 다음 집중을 단단하게 해요</p>
        </div>
      </div>

      <div className="mt-3.5 w-full rounded-2xl border border-break/25 bg-card/70 p-4">
        <p className="font-pixel mb-3 text-[9px] tracking-[1.5px] text-muted-foreground">잠깐 이런 건 어때요?</p>
        <ul className="flex flex-col gap-2.5">
          {BREAK_TIPS.map((tip) => (
            <li key={tip} className="flex items-center gap-2.5 text-[13px] font-semibold text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-break" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex w-full gap-2.5">
        <button
          type="button"
          onClick={onSkip}
          disabled={isTransitioning}
          className="h-12 flex-1 rounded-[13px] text-sm font-bold text-primary-foreground shadow-[0_8px_18px_rgba(94,138,114,.35)] transition-transform hover:scale-[1.01] disabled:opacity-50"
          style={{ background: BREAK_GRADIENT }}
        >
          건너뛰고 집중
        </button>
        <button
          type="button"
          onClick={onEnd}
          disabled={isTransitioning}
          className="h-12 flex-1 rounded-[13px] border border-break/35 bg-card text-sm font-bold text-break transition-colors hover:bg-break/10 disabled:opacity-50"
        >
          세션 종료
        </button>
      </div>
    </div>
  );
}
