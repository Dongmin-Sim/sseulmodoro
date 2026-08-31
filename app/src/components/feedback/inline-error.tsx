import Image from "next/image";

type InlineErrorProps = {
  title?: string;
  description?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
};

// 섹션 단위 로드 실패 — 카드 안에서 재시도 동선 제공. 페이지 전체가 아닌 부분 실패용.
export function InlineError({
  title = "불러오지 못했어요",
  description = "일시적인 문제일 수 있어요. 다시 시도하면 대부분 해결돼요.",
  onRetry,
  retryLabel = "다시 불러오기",
}: InlineErrorProps) {
  return (
    <div className="flex flex-col items-center rounded-[20px] border border-border bg-card px-6 py-9 text-center shadow-[0_1px_3px_rgba(45,42,38,.05)]">
      <div className="mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-2xl" style={{ backgroundColor: "#F3EDE6" }}>
        <Image src="/icons/alert.png" alt="" width={30} height={30} unoptimized className="pixelated" />
      </div>
      <p className="text-[17px] font-extrabold text-foreground">{title}</p>
      {description && <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-text-secondary">{description}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex h-11 items-center gap-1.5 rounded-xl px-6 text-sm font-bold text-white shadow-[0_6px_16px_rgba(212,149,106,.35)] transition-transform hover:scale-[1.01]"
          style={{ background: "var(--primary-gradient)" }}
        >
          <span className="text-[13px]">↻</span> {retryLabel}
        </button>
      )}
    </div>
  );
}
