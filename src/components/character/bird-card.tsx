import Image from "next/image";
import { cn } from "@/lib/utils";

// 레어리티별 패널 톤 (preview.png 톤 참고). 알 수 없는 값은 common으로 폴백.
const RARITY_PANEL: Record<string, { bg: string; ring: string }> = {
  common: { bg: "#E8EFE6", ring: "#C7D3C0" }, // 세이지
  rare: { bg: "#E4ECF4", ring: "#C2D2E0" }, // 블루
  epic: { bg: "#ECE5F4", ring: "#D2C2E4" }, // 라벤더
  legendary: { bg: "#F4ECD9", ring: "#E2D2A8" }, // 크림·골드
};

const PANEL_SIZE = 160;
const SPRITE_SIZE = 144; // 576px sprite의 1/4 정수배율 → 픽셀 또렷

type BirdCardProps = {
  slug: string;
  rarity: string;
  name: string;
  /** 상하 bob 애니메이션. 그리드처럼 여러 장을 깔 땐 false로(블러 오버레이 뒤 재합성 부하 방지). */
  animated?: boolean;
  className?: string;
};

// 보유 캐릭터의 픽셀 새 카드. sprite(public/characters/{slug}.png)는 투명배경
// 순수 자산이고, 카드 틀(레어리티 패널)은 여기서 React가 얹는다.
export function BirdCard({
  slug,
  rarity,
  name,
  animated = true,
  className,
}: BirdCardProps) {
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
      <Image
        src={`/characters/${slug}.png`}
        alt={name}
        width={SPRITE_SIZE}
        height={SPRITE_SIZE}
        unoptimized
        priority
        className={cn(animated && "animate-bird-bob")}
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}
