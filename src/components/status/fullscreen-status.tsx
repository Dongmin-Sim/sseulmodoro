import Image from "next/image";

export const statusPrimaryBtn =
  "inline-flex h-13 items-center justify-center gap-2 rounded-[14px] px-7 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(212,149,106,.4)] transition-transform hover:scale-[1.01]";
export const statusSecondaryBtn =
  "inline-flex h-13 items-center justify-center rounded-[14px] border border-border bg-card px-6 text-[15px] font-semibold text-foreground transition-colors hover:bg-surface-2";

type FullscreenStatusProps = {
  buddySrc: string;
  buddyAlt?: string;
  glow: string;
  glowSize?: number;
  eyebrow: React.ReactNode;
  title: string;
  description: React.ReactNode;
  actions: React.ReactNode;
  footer?: React.ReactNode;
  decorations?: React.ReactNode;
};

// 404·오류 화면이 공유하는 몰입형 중앙 정렬 레이아웃 (상단 네비 없음, 마스코트 담당)
export function FullscreenStatus({
  buddySrc,
  buddyAlt = "포모",
  glow,
  glowSize = 300,
  eyebrow,
  title,
  description,
  actions,
  footer,
  decorations,
}: FullscreenStatusProps) {
  return (
    <main className="relative z-10 flex min-h-dvh flex-1 flex-col items-center justify-center bg-grid px-6 py-16 text-center">
      <div className="relative mb-1 flex items-center justify-center">
        <div
          aria-hidden
          className="absolute rounded-full"
          style={{ width: glowSize, height: glowSize, background: `radial-gradient(circle, ${glow}, transparent 62%)` }}
        />
        {decorations}
        <Image
          src={buddySrc}
          alt={buddyAlt}
          width={150}
          height={150}
          unoptimized
          priority
          className="pixelated animate-buddy-bob relative h-[118px] w-[118px] lg:h-[150px] lg:w-[150px]"
        />
      </div>

      {eyebrow}
      <h1 className="mt-2 text-[23px] font-extrabold tracking-tight text-foreground lg:text-[28px]">{title}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-text-secondary lg:text-[15px]">{description}</p>

      <div className="mt-7 flex w-full max-w-xs flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">{actions}</div>
      {footer && <div className="mt-6">{footer}</div>}
    </main>
  );
}
