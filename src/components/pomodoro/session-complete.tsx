"use client";

import { SessionBuddy } from "./session-buddy";

// TODO: TASK-21/가챠 임계치 연동 후 실데이터로 교체 (포인트 잔액 / 다음 캐릭터 비용)
const NEXT_FRIEND_PLACEHOLDER = { current: 760, target: 800 };

function formatFocusTime(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${String(mins).padStart(2, "0")}`;
}

type SessionCompleteProps = {
  completedCount: number;
  targetCount: number;
  focusMinutes: number;
  earnedPoints: number | null;
  buddySlug: string | null;
  buddyName: string;
  onRestart: () => void;
  onHome: () => void;
};

export function SessionComplete({
  completedCount,
  focusMinutes,
  earnedPoints,
  buddySlug,
  buddyName,
  onRestart,
  onHome,
}: SessionCompleteProps) {
  const focusTime = formatFocusTime(focusMinutes * completedCount);
  const { current, target } = NEXT_FRIEND_PLACEHOLDER;
  const ratio = Math.min(current / target, 1);

  return (
    <div className="flex w-full flex-col items-center text-center">
      <SessionBuddy
        slug={buddySlug}
        name={buddyName}
        size={140}
        glow="rgba(224,177,94,.26)"
        halo
        sparkles
      />

      <p className="font-pixel mt-3 text-[10px] tracking-[1.5px] text-primary">
        SESSION COMPLETE
      </p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
        오늘 집중, 잘 끝냈어요!
      </h2>
      <p className="mt-1.5 text-sm text-text-secondary">
        {completedCount > 0
          ? "꾸준함이 한 걸음 더 쌓였어요"
          : "다음엔 한 판 완성해볼까요?"}
      </p>

      <div className="mt-6 grid w-full grid-cols-3 gap-2.5">
        <CompleteStat value={String(completedCount)} label="포모도로" color="var(--focus)" />
        <CompleteStat value={focusTime} label="집중 시간" />
        <CompleteStat value={`+${earnedPoints ?? 0}`} label="포인트" color="var(--gold)" />
      </div>

      <div className="mt-4 w-full rounded-2xl border border-border bg-card p-4 text-left">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold text-foreground">다음 친구까지</span>
          <span className="font-mono text-xs font-semibold text-primary">
            {current}/{target}
          </span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full"
            style={{ width: `${ratio * 100}%`, background: "var(--primary-gradient)" }}
          />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          한 판만 더 하면 알을 뽑을 수 있어요 🎉
        </p>
      </div>

      <div className="mt-6 flex w-full flex-col gap-2.5">
        <button
          type="button"
          onClick={onRestart}
          className="flex h-13 w-full items-center justify-center rounded-[14px] py-3.5 text-base font-bold text-primary-foreground shadow-[0_8px_20px_rgba(212,149,106,.4)] transition-transform hover:scale-[1.01]"
          style={{ background: "var(--primary-gradient)" }}
        >
          한 판 더 집중
        </button>
        <button
          type="button"
          onClick={onHome}
          className="h-12 w-full rounded-[14px] border border-border bg-card text-[15px] font-semibold text-foreground transition-colors hover:bg-surface-2"
        >
          홈으로
        </button>
      </div>
    </div>
  );
}

function CompleteStat({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card py-4 text-center">
      <p className="font-mono text-2xl font-semibold leading-none" style={color ? { color } : undefined}>
        {value}
      </p>
      <p className="mt-1.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
