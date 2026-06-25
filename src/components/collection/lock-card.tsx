import { cn } from "@/lib/utils";
import { getRarityPanel } from "@/lib/rarity";

const PANEL_SIZE = 160;

type LockCardProps = {
  rarity: string;
  className?: string;
};

/** 미보유 종의 공통 잠금 카드 — rarity 톤 + 실루엣 placeholder(종 식별 불가). */
export function LockCard({ rarity, className }: LockCardProps) {
  const panel = getRarityPanel(rarity);

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
