import Link from "next/link";
import { FullscreenStatus, statusPrimaryBtn } from "@/components/status/fullscreen-status";
import { BackButton } from "@/components/status/back-button";

export default function NotFound() {
  return (
    <FullscreenStatus
      buddySrc="/characters/main/owl-helmet.png"
      glow="rgba(224,177,94,.16)"
      decorations={
        <>
          <span aria-hidden className="animate-sparkle-pulse font-mono absolute -top-8 left-1 text-2xl font-semibold text-focus lg:left-6">?</span>
          <span aria-hidden className="animate-sparkle-pulse font-mono absolute -top-2 right-1 text-lg font-semibold text-primary lg:right-6" style={{ animationDelay: ".4s" }}>?</span>
        </>
      }
      eyebrow={<div className="font-pixel mt-4 text-[42px] tracking-[2px] text-primary lg:text-[54px]">404</div>}
      title="길을 잃은 페이지예요"
      description={
        <>
          찾으시는 페이지가 없거나 옮겨졌어요.
          <br />
          둥지로 돌아가 다시 집중해볼까요?
        </>
      }
      actions={
        <>
          <Link href="/home" className={statusPrimaryBtn} style={{ background: "var(--primary-gradient)" }}>
            홈으로 돌아가기
          </Link>
          <BackButton />
        </>
      }
    />
  );
}
