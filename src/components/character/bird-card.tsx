import Image from "next/image";
import { cn } from "@/lib/utils";
import { getRarityCard } from "@/lib/rarity";

const DEFAULT_SIZE = 160;
const CHAR_RATIO = 0.62; // 카드 프레임 위 캐릭터 크기 (19% inset · 62%)

type BirdCardProps = {
  slug: string;
  rarity: string;
  name: string;
  size?: number;
  animated?: boolean;
  className?: string;
};

// 보유 캐릭터 카드 — 레어리티 카드 프레임 위에 픽셀 새를 합성한다.
export function BirdCard({
  slug,
  rarity,
  name,
  size = DEFAULT_SIZE,
  animated = false,
  className,
}: BirdCardProps) {
  const charSize = Math.round(size * CHAR_RATIO);

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <Image
        src={getRarityCard(rarity)}
        alt=""
        fill
        unoptimized
        sizes={`${size}px`}
        className="pixelated"
      />
      <Image
        src={`/characters/${slug}.png`}
        alt={name}
        width={charSize}
        height={charSize}
        unoptimized
        className={cn("pixelated absolute", animated && "animate-bird-bob")}
        style={{ top: "19%", left: "19%" }}
      />
    </div>
  );
}
