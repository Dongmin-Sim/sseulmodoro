"use client";

import { useState } from "react";
import { IS_DEV } from "./constants";
import { Button } from "@/components/ui/button";

/**
 * 개발 전용 floating 디버그 콘솔.
 * 화면 우하단에 떠 있는 버튼 → 클릭 시 패널 토글.
 * children에 dev 컨트롤(배속·스킵 등)을 넣는다. 프로덕션에서는 null (dead-code 제거).
 */
export function DevConsole({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  if (!IS_DEV) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-orange-400 bg-background/95 p-3 shadow-lg">
          <span className="text-[10px] font-bold tracking-wide text-orange-600">
            DEV CONSOLE
          </span>
          {children}
        </div>
      )}
      <Button
        size="sm"
        variant="outline"
        className="border-orange-400 text-orange-600 shadow"
        onClick={() => setOpen((v) => !v)}
      >
        🛠 DEV
      </Button>
    </div>
  );
}
