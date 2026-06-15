import { cn } from "@/lib/utils";

// BirdCard와 동일한 rarity 패널 톤. 미보유 종은 실루엣만 노출(이름 가림).
const RARITY_PANEL: Record<string, { bg: string; ring: string }> = {
  common: { bg: "#E8EFE6", ring: "#C7D3C0" }, // 세이지
  rare: { bg: "#E4ECF4", ring: "#C2D2E0" }, // 블루
  epic: { bg: "#ECE5F4", ring: "#D2C2E4" }, // 라벤더
  legendary: { bg: "#F4ECD9", ring: "#E2D2A8" }, // 크림·골드
};

const PANEL_SIZE = 160;

type LockCardProps = {
  rarity: string;
  className?: string;
};

/** 미보유 종의 공통 잠금 카드 — rarity 톤 + 실루엣 placeholder(종 식별 불가). */
export function LockCard({ rarity, className }: LockCardProps) {
  const panel = RARITY_PANEL[rarity] ?? RARITY_PANEL.common;

  return (
    <div
      className={cn("flex items-center justify-center rounded-[24px]", className)}
      style={{
        width: PANEL_SIZE,
        height: PANEL_SIZE,
        background: panel.bg,
        boxShadow: `inset 0 0 0 1.5px ${panel.ring}, 0 12px 32px rgba(180,160,140,0.22)`,
      }}
    >
      <span
        aria-hidden
        className="select-none text-6xl font-bold"
        style={{ color: panel.ring }}
      >
        ?
      </span>
    </div>
  );
}
