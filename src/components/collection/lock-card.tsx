import Image from "next/image";
import { cn } from "@/lib/utils";
import { getRarityCard } from "@/lib/rarity";

type LockCardProps = {
  rarity: string;
  size?: number; // 생략 시 컨테이너를 채우는 반응형(aspect-square)
  className?: string;
};

// 미보유 종 카드 — 카드 프레임을 흐리게(desaturate) 깔고 알 아이콘으로 가린다.
export function LockCard({ rarity, size, className }: LockCardProps) {
  const fixed = size != null;

  return (
    <div
      className={cn("relative", !fixed && "aspect-square w-full", className)}
      style={fixed ? { width: size, height: size } : undefined}
    >
      <Image
        src={getRarityCard(rarity)}
        alt=""
        fill
        unoptimized
        sizes={fixed ? `${size}px` : "160px"}
        className="pixelated"
        style={{ filter: "saturate(.45) opacity(.82)" }}
      />
      <div className="absolute opacity-80" style={{ top: "28%", left: "28%", width: "44%", height: "44%" }}>
        <Image src="/icons/egg-smooth.png" alt="미보유" fill unoptimized className="pixelated object-contain" />
      </div>
    </div>
  );
}
