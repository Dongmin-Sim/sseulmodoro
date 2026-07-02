"use client";

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

  const skipButton = (
    <button
      type="button"
      onClick={onSkip}
      disabled={isTransitioning}
      className="h-12 flex-1 rounded-[13px] text-sm font-bold text-primary-foreground shadow-[0_8px_18px_rgba(94,138,114,.35)] transition-transform hover:scale-[1.01] disabled:opacity-50"
      style={{ background: BREAK_GRADIENT }}
    >
      건너뛰고 집중
    </button>
  );
  // 세션 종료: 데스크톱은 상단 헤더로 이동, 모바일 본문에만 노출(헤더=알약뿐)
  const endButton = (
    <button
      type="button"
      onClick={onEnd}
      disabled={isTransitioning}
      className="h-12 flex-1 rounded-[13px] border border-break/35 bg-card text-sm font-bold text-break transition-colors hover:bg-break/10 disabled:opacity-50"
    >
      세션 종료
    </button>
  );

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col items-center">
      <div className="grid w-full gap-8 lg:min-h-[calc(100dvh-9rem)] lg:grid-cols-[1fr_.9fr] lg:items-center">
        {/* 좌: 링 + 컨트롤 */}
        <div className="flex flex-col items-center">
          <TimerDisplay
            display={display}
            progress={progress}
            status={status}
            label={label}
            progressColor="text-break"
          />
          <div className="mt-8 hidden w-full max-w-sm gap-3 lg:flex">{skipButton}</div>
        </div>

        {/* 우: 버디 + 팁 */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-5 rounded-3xl border border-break/25 bg-card/70 p-5">
            <SessionBuddy slug={buddySlug} name={buddyName} size={96} glow="rgba(123,166,142,.22)" />
            <div>
              <p className="font-pixel mb-1.5 text-[10px] tracking-[1px] text-break">BUDDY</p>
              <p className="text-base font-extrabold text-foreground">{buddyName} 잠깐 쉬는 중</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">
                잠깐의 휴식이
                <br />
                다음 집중을 더 단단하게 해요
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-break/25 bg-card/70 p-6">
            <p className="font-pixel mb-3.5 text-[10px] tracking-[1.5px] text-muted-foreground">잠깐 이런 건 어때요?</p>
            <ul className="flex flex-col gap-2.5">
              {BREAK_TIPS.map((tip) => (
                <li key={tip} className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                  <span className="h-2 w-2 rounded-full bg-break" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 버튼 (모바일 하단) */}
        <div className="flex w-full gap-2.5 lg:hidden">
          {skipButton}
          {endButton}
        </div>
      </div>
    </div>
  );
}
