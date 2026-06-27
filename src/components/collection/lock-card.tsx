import Image from "next/image";
import { cn } from "@/lib/utils";
import { getRarityCard } from "@/lib/rarity";

const DEFAULT_SIZE = 160;
const EGG_RATIO = 0.44; // 미보유 알 아이콘 크기 (28% inset · 44%)

type LockCardProps = {
  rarity: string;
  size?: number;
  className?: string;
};

// 미보유 종 카드 — 카드 프레임을 흐리게(desaturate) 깔고 알 아이콘으로 가린다.
export function LockCard({ rarity, size = DEFAULT_SIZE, className }: LockCardProps) {
  const eggSize = Math.round(size * EGG_RATIO);

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <Image
        src={getRarityCard(rarity)}
        alt=""
        fill
        unoptimized
        sizes={`${size}px`}
        className="pixelated"
        style={{ filter: "saturate(.45) opacity(.82)" }}
      />
      <Image
        src="/icons/egg-smooth.png"
        alt="미보유"
        width={eggSize}
        height={eggSize}
        unoptimized
        className="pixelated absolute opacity-80"
        style={{ top: "28%", left: "28%" }}
      />
    </div>
  );
}
