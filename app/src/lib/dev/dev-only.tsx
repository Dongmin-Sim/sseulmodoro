"use client";

import { IS_DEV } from "./constants";
import { Badge } from "@/components/ui/badge";

/**
 * children을 개발 환경에서만 렌더링. 프로덕션에서는 null.
 */
export function DevOnly({ children }: { children: React.ReactNode }) {
  if (!IS_DEV) return null;
  return <>{children}</>;
}

/**
 * 개발 전용 UI 요소에 붙이는 시각 표시 배지.
 * 오렌지 색상으로 프로덕션 UI와 구분.
 */
export function DevBadge({ label = "테스트" }: { label?: string }) {
  if (!IS_DEV) return null;
  return (
    <Badge
      variant="outline"
      className="border-orange-400 bg-orange-50 text-orange-600 text-[10px] px-1.5 py-0"
    >
      {label}
    </Badge>
  );
}
