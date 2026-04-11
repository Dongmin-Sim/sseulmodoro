"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ContentNavItem = {
  label: string;
  href: string;
  disabled?: boolean;
};

type ContentNavProps = {
  items: ContentNavItem[];
  balance?: number;
};

export function ContentNav({ items, balance }: ContentNavProps) {
  const pathname = usePathname();

  return (
    <div className="mb-8 flex flex-col gap-2">
      {/* 섹션 탭 */}
      <div className="flex items-center justify-center border-b border-border">
        {items.map((item) => {
          const isActive = !item.disabled && pathname === item.href;
          return item.disabled ? (
            <span
              key={item.href}
              role="link"
              aria-disabled="true"
              title="준비 중"
              className="relative px-5 py-3 text-sm font-medium text-muted-foreground opacity-40 cursor-not-allowed select-none"
            >
              {item.label}
              <span className="sr-only"> (준비 중)</span>
            </span>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative px-5 py-3 text-sm transition-colors",
                isActive
                  ? "font-bold text-foreground"
                  : "font-medium text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
              {isActive && (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>

      {/* 포인트 잔액 chip */}
      {balance !== undefined && (
        <div className="flex justify-end">
          <div className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold shadow-sm">
            <span className="text-primary">✦</span>
            <span>{balance.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
