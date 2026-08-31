import Image from "next/image";
import { cn } from "@/lib/utils";
import { getRarityCard } from "@/lib/rarity";

type BirdCardProps = {
  slug: string;
  rarity: string;
  name: string;
  size?: number; // 생략 시 컨테이너를 채우는 반응형(aspect-square)
  animated?: boolean;
  className?: string;
};

// 보유 캐릭터 카드 — 레어리티 카드 프레임 위에 픽셀 새를 합성한다.
// 캐릭터는 퍼센트(19% inset · 62%)로 배치돼 고정·반응형 모두에서 동일 비율을 유지한다.
export function BirdCard({ slug, rarity, name, size, animated = false, className }: BirdCardProps) {
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
      />
      <div
        className={cn("absolute", animated && "animate-bird-bob")}
        style={{ top: "19%", left: "19%", width: "62%", height: "62%" }}
      >
        <Image src={`/characters/${slug}.png`} alt={name} fill unoptimized className="pixelated object-contain" />
      </div>
    </div>
  );
}
