"use client";

import { Fragment } from "react";
import Image from "next/image";
import { SessionBuddy } from "./session-buddy";
import { getCycleTrackerSteps } from "./progress-model";
import type { StepType, StepState } from "./progress-model";
import { cn } from "@/lib/utils";

const STEP_ICON: Record<StepType, string> = {
  pomodoro: "/icons/tomato.png",
  shortBreak: "/icons/coffee.png",
  longBreak: "/icons/tree.png",
};

const fmtClock = (m: number) => `${String(m).padStart(2, "0")}:00`;

type CycleTransitionProps = {
  variant: "toBreak" | "toFocus";
  completedCount: number;
  targetCount: number;
  buddySlug: string | null;
  buddyName: string;
  nextMinutes: number;
  nextFocusIndex: number;
  isLastBreakLong: boolean;
  isBusy: boolean;
  onPrimary: () => void;
  onEnd: () => void;
  onTertiary: () => void;
};

export function CycleTransition({
  variant,
  completedCount,
  targetCount,
  buddySlug,
  buddyName,
  nextMinutes,
  nextFocusIndex,
  isLastBreakLong,
  isBusy,
  onPrimary,
  onEnd,
  onTertiary,
}: CycleTransitionProps) {
  const toBreak = variant === "toBreak";
  const steps = getCycleTrackerSteps(variant, completedCount, targetCount);

  const eyebrow = toBreak
    ? `POMODORO ${completedCount} / ${targetCount} · COMPLETE`
    : "BREAK COMPLETE · NEXT UP";
  const title = toBreak
    ? isLastBreakLong
      ? "마지막 집중까지 완주했어요!"
      : "잘 해냈어요, 잠깐 쉴까요?"
    : "잘 쉬었어요, 이어서 집중할까요?";
  const subtitle = toBreak
    ? isLastBreakLong
      ? `${nextMinutes}분 긴 휴식 후 오늘 세션을 마무리해요`
      : `${nextMinutes}분 쉬면서 다음 집중을 준비해요`
    : "이 흐름을 이어가면 목표에 한 발 더 가까워져요";
  const countText = toBreak
    ? `${completedCount} / ${targetCount} 완료`
    : `${completedCount + 1} / ${targetCount} 진행 중`;
  const caption = toBreak
    ? isLastBreakLong
      ? "긴 휴식 후 오늘 세션을 마무리해요 🎉"
      : `${nextMinutes}분 쉬고 다음 판으로 🎉`
    : `다음은 ${nextFocusIndex}번째 집중 · ${nextMinutes}분`;

  const primaryLabel = toBreak
    ? `휴식 시작 · ${fmtClock(nextMinutes)}`
    : `집중 시작 · ${fmtClock(nextMinutes)}`;

  const showTertiary = toBreak ? !isLastBreakLong : true;
  const tertiaryFull = toBreak ? "휴식 건너뛰고 바로 집중하기" : "휴식 5분 더 하기";
  const tertiaryShort = toBreak ? "건너뛰고 집중" : "휴식 5분 더";

  const secondaryButton = (
    <button
      type="button"
      onClick={onEnd}
      disabled={isBusy}
      className="h-12 flex-1 rounded-[14px] border border-border bg-card text-[15px] font-semibold text-foreground transition-colors hover:bg-surface-2 disabled:opacity-50 sm:h-13"
    >
      세션 종료
    </button>
  );

  return (
    <div className="mx-auto flex w-full max-w-[524px] flex-col items-center py-6 text-center">
      <SessionBuddy slug={buddySlug} name={buddyName} size={140} glow="rgba(224,177,94,.26)" halo sparkles />

      <p
        className="font-pixel mt-3 text-[10px] tracking-[1.5px] lg:text-[11px]"
        style={{ color: toBreak ? "var(--primary)" : "var(--break)" }}
      >
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground lg:text-[28px]">{title}</h2>
      <p className="mt-1.5 text-sm text-text-secondary">{subtitle}</p>

      <div className="mt-6 w-full rounded-[18px] border border-border bg-card px-[22px] pb-5 pt-[18px] shadow-[0_1px_3px_rgba(45,42,38,.05)]">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[13px] font-bold text-foreground">이번 세션 진행</span>
          <span className="font-mono text-xs font-semibold" style={{ color: toBreak ? "var(--primary)" : "var(--focus)" }}>
            {countText}
          </span>
        </div>
        <div className="flex items-center justify-center gap-1.5 lg:gap-2">
          {steps.map((step, i) => (
            <Fragment key={i}>
              <TrackerNode type={step.type} state={step.state} />
              {i < steps.length - 1 && (
                <div
                  className="h-[3px] max-w-[22px] flex-1 rounded-full lg:max-w-[34px]"
                  style={{ backgroundColor: step.state === "completed" ? "#D9A98F" : "#E7DDD0" }}
                />
              )}
            </Fragment>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">{caption}</p>
      </div>

      <div className="mt-6 flex w-full flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={onPrimary}
          disabled={isBusy}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-[14px] text-base font-bold text-white transition-transform hover:scale-[1.01] disabled:opacity-60 sm:flex-1"
          style={{
            background: toBreak ? "linear-gradient(135deg,#7BA68E,#5E8A72)" : "var(--primary-gradient)",
            boxShadow: toBreak ? "0 8px 20px rgba(94,138,114,.4)" : "0 8px 20px rgba(212,149,106,.4)",
          }}
        >
          {toBreak ? (
            <Image src="/icons/coffee.png" alt="" width={19} height={19} unoptimized className="pixelated" />
          ) : (
            <span className="text-xs">▶</span>
          )}
          {isBusy ? "처리 중..." : primaryLabel}
        </button>
        <div className="hidden sm:flex sm:flex-1">{secondaryButton}</div>
      </div>

      {/* 모바일: [보조 액션 | 세션 종료] 행 (데스크톱은 종료=위 행, 보조=아래 밑줄) */}
      <div className="mt-2.5 flex w-full gap-2.5 sm:hidden">
        {showTertiary && (
          <button
            type="button"
            onClick={onTertiary}
            disabled={isBusy}
            className="h-12 flex-1 rounded-[14px] border border-border bg-card text-[13.5px] font-semibold text-foreground transition-colors hover:bg-surface-2 disabled:opacity-50"
          >
            {tertiaryShort}
          </button>
        )}
        {secondaryButton}
      </div>

      {showTertiary && (
        <button
          type="button"
          onClick={onTertiary}
          disabled={isBusy}
          className="mt-3.5 hidden text-[13px] font-semibold text-muted-foreground underline underline-offset-[3px] transition-colors hover:text-foreground disabled:opacity-50 sm:block"
        >
          {tertiaryFull}
        </button>
      )}
    </div>
  );
}

function TrackerNode({ type, state }: { type: StepType; state: StepState }) {
  const isCurrent = state === "active";
  const isDone = state === "completed";
  const isFocus = type === "pomodoro";

  const palette = isCurrent
    ? isFocus
      ? { bg: "#FBEEE8", border: "#C4725C", ring: "0 0 0 5px rgba(196,114,92,.14)" }
      : { bg: "#E3EFE7", border: "#7BA68E", ring: "0 0 0 5px rgba(123,166,142,.16)" }
    : isDone
      ? isFocus
        ? { bg: "#F3E0D6", border: "#D9A98F", ring: undefined }
        : { bg: "#E3EFE7", border: "#A9CBB6", ring: undefined }
      : { bg: "#F1ECE4", border: "#E7DDD0", ring: undefined };

  const iconPx = isCurrent ? 24 : 20;

  return (
    <div
      className={cn(
        "flex flex-shrink-0 items-center justify-center rounded-full border-2",
        isCurrent ? "h-11 w-11 lg:h-[46px] lg:w-[46px]" : "h-8 w-8 lg:h-[38px] lg:w-[38px]",
      )}
      style={{ backgroundColor: palette.bg, borderColor: palette.border, boxShadow: palette.ring }}
    >
      <Image
        src={STEP_ICON[type]}
        alt=""
        width={iconPx}
        height={iconPx}
        unoptimized
        className="pixelated"
        style={!isCurrent && !isDone ? { opacity: 0.38 } : undefined}
      />
    </div>
  );
}
