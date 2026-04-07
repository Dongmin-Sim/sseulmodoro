"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { IS_DEV, DEV_DURATION_OPTIONS, DEV_BREAK_OPTION } from "@/lib/dev/constants";
import { DevBadge } from "@/lib/dev/dev-only";

const FOCUS_OPTIONS = [15, 20, 25, 30, 45, 60] as const;
const SHORT_BREAK_OPTIONS = [5, 10] as const;
const LONG_BREAK_OPTIONS = [15, 20, 30] as const;
const CYCLE_OPTIONS = [2, 3, 4, 5, 6, 7, 8] as const;

interface SessionSettingsProps {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  targetCount: number;
  onFocusChange: (minutes: number, label: string) => void;
  onShortBreakChange: (minutes: number) => void;
  onLongBreakChange: (minutes: number) => void;
  onTargetCountChange: (count: number) => void;
}

function OptionRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function formatTotalTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins}분`;
  if (mins === 0) return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
}

export function SessionSettings({
  focusMinutes,
  shortBreakMinutes,
  longBreakMinutes,
  targetCount,
  onFocusChange,
  onShortBreakChange,
  onLongBreakChange,
  onTargetCountChange,
}: SessionSettingsProps) {
  // 짧은 휴식: 사이클 사이 (targetCount - 1)회, 긴 휴식: 세션 종료 직전 1회
  const totalMinutes =
    focusMinutes * targetCount +
    shortBreakMinutes * (targetCount - 1) +
    longBreakMinutes;

  return (
    <div className="flex flex-col gap-4 w-full">
      <OptionRow label="집중 시간">
        {IS_DEV &&
          DEV_DURATION_OPTIONS.map((opt) => (
            <Badge
              key={opt.label}
              variant={focusMinutes === opt.minutes ? "default" : "outline"}
              className={cn(
                "cursor-pointer px-3 py-1 text-sm border-dashed border-orange-400",
                focusMinutes === opt.minutes
                  ? "bg-orange-500 text-white"
                  : "text-orange-600",
              )}
              onClick={() => onFocusChange(opt.minutes, opt.label)}
            >
              {opt.label}
            </Badge>
          ))}
        {FOCUS_OPTIONS.map((min) => (
          <Badge
            key={min}
            variant={focusMinutes === min ? "default" : "outline"}
            className="cursor-pointer px-3 py-1 text-sm"
            onClick={() => onFocusChange(min, `${min}분`)}
          >
            {min}분
          </Badge>
        ))}
        {IS_DEV && <DevBadge />}
      </OptionRow>

      <OptionRow label="짧은 휴식">
        {IS_DEV && (
          <Badge
            variant={shortBreakMinutes === DEV_BREAK_OPTION.minutes ? "default" : "outline"}
            className={cn(
              "cursor-pointer px-3 py-1 text-sm border-dashed border-orange-400",
              shortBreakMinutes === DEV_BREAK_OPTION.minutes
                ? "bg-orange-500 text-white"
                : "text-orange-600",
            )}
            onClick={() => onShortBreakChange(DEV_BREAK_OPTION.minutes)}
          >
            {DEV_BREAK_OPTION.label}
          </Badge>
        )}
        {SHORT_BREAK_OPTIONS.map((min) => (
          <Badge
            key={min}
            variant={shortBreakMinutes === min ? "default" : "outline"}
            className="cursor-pointer px-3 py-1 text-sm"
            onClick={() => onShortBreakChange(min)}
          >
            {min}분
          </Badge>
        ))}
      </OptionRow>

      <OptionRow label="긴 휴식">
        {IS_DEV && (
          <Badge
            variant={longBreakMinutes === DEV_BREAK_OPTION.minutes ? "default" : "outline"}
            className={cn(
              "cursor-pointer px-3 py-1 text-sm border-dashed border-orange-400",
              longBreakMinutes === DEV_BREAK_OPTION.minutes
                ? "bg-orange-500 text-white"
                : "text-orange-600",
            )}
            onClick={() => onLongBreakChange(DEV_BREAK_OPTION.minutes)}
          >
            {DEV_BREAK_OPTION.label}
          </Badge>
        )}
        {LONG_BREAK_OPTIONS.map((min) => (
          <Badge
            key={min}
            variant={longBreakMinutes === min ? "default" : "outline"}
            className="cursor-pointer px-3 py-1 text-sm"
            onClick={() => onLongBreakChange(min)}
          >
            {min}분
          </Badge>
        ))}
      </OptionRow>

      <OptionRow label="사이클 수">
        {CYCLE_OPTIONS.map((count) => (
          <Badge
            key={count}
            variant={targetCount === count ? "default" : "outline"}
            className="cursor-pointer px-3 py-1 text-sm"
            onClick={() => onTargetCountChange(count)}
          >
            {count}회
          </Badge>
        ))}
      </OptionRow>

      <p className="text-center text-sm text-muted-foreground">
        총 예상: {formatTotalTime(totalMinutes)}
      </p>
    </div>
  );
}
