import Image from "next/image";

type EmptyStateProps = {
  image?: string;
  title: string;
  description?: React.ReactNode;
};

// 데이터 없음 — 점선 카드로 "아직 없음"과 다음 행동을 안내. (심미는 화면별로 조정)
export function EmptyState({ image = "/icons/egg-smooth.png", title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-[20px] border border-dashed border-[#E0D8CD] bg-card px-6 py-8 text-center">
      <Image src={image} alt="" width={64} height={64} unoptimized className="pixelated mb-3 opacity-50" />
      <p className="text-[15px] font-bold text-text-secondary">{title}</p>
      {description && <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  );
}
