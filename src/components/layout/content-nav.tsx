"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ContentNavItem = {
  label: string;
  href?: string;
  disabled?: boolean;
  /** 라우팅 대신 뷰 전환 등 액션이 필요한 항목 (예: 홈 → 메인 복귀) */
  onSelect?: () => void;
  /** onSelect 항목의 활성 표시 여부 */
  active?: boolean;
};

const TAB_BASE = "relative px-5 py-3 text-sm transition-colors";
const tabClass = (isActive: boolean) =>
  isActive
    ? "font-bold text-foreground"
    : "font-medium text-muted-foreground hover:text-foreground";
const ActiveUnderline = () => (
  <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-primary" />
);

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
          if (item.disabled) {
            return (
              <span
                key={item.label}
                role="link"
                aria-disabled="true"
                title="준비 중"
                className="relative px-5 py-3 text-sm font-medium text-muted-foreground opacity-40 cursor-not-allowed select-none"
              >
                {item.label}
                <span className="sr-only"> (준비 중)</span>
              </span>
            );
          }

          // 라우팅 대신 뷰 전환 액션 (예: 홈 → 메인 복귀)
          if (item.onSelect) {
            const isActive = !!item.active;
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onSelect}
                className={cn(TAB_BASE, tabClass(isActive))}
              >
                {item.label}
                {isActive && <ActiveUnderline />}
              </button>
            );
          }

          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href ?? "#"}
              className={cn(TAB_BASE, tabClass(isActive))}
            >
              {item.label}
              {isActive && <ActiveUnderline />}
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
