"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { IS_DEV, DEV_DURATION_OPTIONS } from "@/lib/dev/constants";
import { DevBadge } from "@/lib/dev/dev-only";

const DURATION_OPTIONS = [15, 20, 25, 30, 45, 60] as const;

interface DurationSelectorProps {
  selected: number;
  onSelect: (minutes: number, label: string) => void;
  disabled?: boolean;
}

export function DurationSelector({
  selected,
  onSelect,
  disabled,
}: DurationSelectorProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {IS_DEV &&
        DEV_DURATION_OPTIONS.map((opt) => (
          <Badge
            key={opt.label}
            variant={selected === opt.minutes ? "default" : "outline"}
            className={cn(
              "cursor-pointer px-3 py-1 text-sm border-dashed border-orange-400",
              selected === opt.minutes
                ? "bg-orange-500 text-white"
                : "text-orange-600",
              disabled && "pointer-events-none opacity-50"
            )}
            onClick={() => !disabled && onSelect(opt.minutes, opt.label)}
          >
            {opt.label}
          </Badge>
        ))}

      {DURATION_OPTIONS.map((min) => (
        <Badge
          key={min}
          variant={selected === min ? "default" : "outline"}
          className={cn(
            "cursor-pointer px-3 py-1 text-sm",
            disabled && "pointer-events-none opacity-50"
          )}
          onClick={() => !disabled && onSelect(min, `${min}분`)}
        >
          {min}분
        </Badge>
      ))}

      {IS_DEV && <DevBadge />}
    </div>
  );
}
