"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type StopDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isTransitioning: boolean;
  isFocusing: boolean;
};

export function StopDialog({
  open,
  onOpenChange,
  onConfirm,
  isTransitioning,
  isFocusing,
}: StopDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[26rem] rounded-3xl border-none p-8 text-center ring-0"
      >
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-surface-2">
            <Image
              src="/icons/alert.png"
              alt=""
              width={32}
              height={32}
              unoptimized
              className="pixelated"
            />
          </div>
          <DialogTitle className="mt-5 text-xl font-extrabold tracking-tight text-foreground">
            집중을 그만둘까요?
          </DialogTitle>
          <DialogDescription className="mt-3 text-sm leading-relaxed text-text-secondary">
            {isFocusing ? (
              <>
                지금 멈추면 <b className="font-semibold text-focus">이번 포모도로는 기록되지 않아요.</b>
              </>
            ) : (
              <>지금 멈추면 세션이 종료돼요.</>
            )}
          </DialogDescription>

          <div className="mt-7 flex w-full flex-col gap-2.5">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-13 w-full rounded-[14px] text-[15px] font-bold text-primary-foreground shadow-[0_8px_20px_rgba(212,149,106,.4)] transition-transform hover:scale-[1.01]"
              style={{ background: "var(--primary-gradient)" }}
            >
              계속 집중하기
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isTransitioning}
              className="h-12 w-full rounded-[14px] border border-border bg-card text-[15px] font-semibold text-muted-foreground transition-colors hover:bg-surface-2 disabled:opacity-50"
            >
              {isTransitioning ? "처리 중..." : "그만두기"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
