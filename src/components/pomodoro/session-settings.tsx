"use client";

import { cn } from "@/lib/utils";

const FOCUS_OPTIONS = [15, 20, 25, 30, 45, 60] as const;
const SHORT_BREAK_OPTIONS = [5, 10] as const;
const LONG_BREAK_OPTIONS = [15, 20, 30] as const;
const CYCLE_OPTIONS = [2, 3, 4, 5, 6, 7, 8] as const;

const PRESETS = [
  { key: "basic", label: "기본형", hint: "25·5·4", focus: 25, short: 5, long: 15, count: 4 },
  { key: "immersive", label: "몰입형", hint: "45·10·4", focus: 45, short: 10, long: 15, count: 4 },
] as const;

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

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-[0_3px_9px_rgba(212,149,106,.3)]"
          : "border-border bg-card text-foreground hover:bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}

function OptionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[13px] font-bold text-foreground">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function PresetCard({
  label,
  hint,
  active,
  onClick,
}: {
  label: string;
  hint: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-2xl border py-3 text-center transition-colors",
        active
          ? "border-primary bg-primary shadow-[0_4px_12px_rgba(212,149,106,.3)]"
          : "border-border bg-card hover:bg-surface-2",
      )}
    >
      <span className={cn("text-[13px] font-bold", active ? "text-primary-foreground" : "text-foreground")}>
        {label}
      </span>
      <span
        className={cn(
          "font-mono mt-1 block text-[10px]",
          active ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        {hint}
      </span>
    </button>
  );
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
  const activePreset = PRESETS.find(
    (p) =>
      p.focus === focusMinutes &&
      p.short === shortBreakMinutes &&
      p.long === longBreakMinutes &&
      p.count === targetCount,
  )?.key;

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    onFocusChange(p.focus, `${p.focus}분`);
    onShortBreakChange(p.short);
    onLongBreakChange(p.long);
    onTargetCountChange(p.count);
  };

  return (
    <div className="w-full rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow)]">
      <div className="flex flex-col gap-3">
        <span className="text-[13px] font-bold text-foreground">프리셋</span>
        <div className="flex gap-2">
          {PRESETS.map((p) => (
            <PresetCard
              key={p.key}
              label={p.label}
              hint={p.hint}
              active={activePreset === p.key}
              onClick={() => applyPreset(p)}
            />
          ))}
          <PresetCard label="Custom" hint="직접 설정" active={!activePreset} />
        </div>
      </div>

      <div className="my-5 h-px bg-border" />

      <div className="flex flex-col gap-5">
        <OptionRow label="집중 시간">
          {FOCUS_OPTIONS.map((min) => (
            <Pill key={min} active={focusMinutes === min} onClick={() => onFocusChange(min, `${min}분`)}>
              {min}분
            </Pill>
          ))}
        </OptionRow>
        <OptionRow label="짧은 휴식">
          {SHORT_BREAK_OPTIONS.map((min) => (
            <Pill key={min} active={shortBreakMinutes === min} onClick={() => onShortBreakChange(min)}>
              {min}분
            </Pill>
          ))}
        </OptionRow>
        <OptionRow label="긴 휴식">
          {LONG_BREAK_OPTIONS.map((min) => (
            <Pill key={min} active={longBreakMinutes === min} onClick={() => onLongBreakChange(min)}>
              {min}분
            </Pill>
          ))}
        </OptionRow>
        <OptionRow label="사이클 수">
          {CYCLE_OPTIONS.map((count) => (
            <Pill key={count} active={targetCount === count} onClick={() => onTargetCountChange(count)}>
              {count}회
            </Pill>
          ))}
        </OptionRow>
      </div>
    </div>
  );
}
