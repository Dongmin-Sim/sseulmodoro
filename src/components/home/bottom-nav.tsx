"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/",
    label: "홈",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M3 9.5L11 3L19 9.5V19a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
          fill={active ? "#D4956A" : "#9C9590"}
        />
      </svg>
    ),
  },
  {
    href: "/collection",
    label: "도감",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" fill={active ? "#D4956A" : "#9C9590"} />
        <rect x="12" y="3" width="7" height="7" rx="1.5" fill={active ? "#D4956A" : "#9C9590"} />
        <rect x="3" y="12" width="7" height="7" rx="1.5" fill={active ? "#D4956A" : "#9C9590"} />
        <rect x="12" y="12" width="7" height="7" rx="1.5" fill={active ? "#D4956A" : "#9C9590"} />
      </svg>
    ),
  },
  {
    href: "/shop",
    label: "상점",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M11 2C8.24 2 6 4.24 6 7c0 4 5 11 5 11s5-7 5-11c0-2.76-2.24-5-5-5zm0 6.5c-.83 0-1.5-.67-1.5-1.5S10.17 5.5 11 5.5s1.5.67 1.5 1.5S11.83 8.5 11 8.5z"
          fill={active ? "#D4956A" : "#9C9590"}
        />
      </svg>
    ),
  },
  {
    href: "/history",
    label: "기록",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM7 7h8M7 11h8M7 15h5"
          stroke={active ? "#D4956A" : "#9C9590"}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="border-t border-border bg-card"
      style={{ height: 82, paddingBottom: 16 }}
    >
      <div className="flex h-full items-center px-2">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-1 py-2"
            >
              <span className="flex h-6 w-6 items-center justify-center">
                {icon(active)}
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium",
                  active
                    ? "font-semibold text-primary"
                    : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
