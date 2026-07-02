"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FullscreenStatus, statusPrimaryBtn, statusSecondaryBtn } from "@/components/status/fullscreen-status";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <FullscreenStatus
      buddySrc="/characters/main/owl-confused.png"
      glow="rgba(196,114,92,.14)"
      glowSize={260}
      eyebrow={
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#E6C9BC] bg-[#FBEEE8] px-4 py-1.5">
          <Image src="/icons/alert.png" alt="" width={16} height={16} unoptimized className="pixelated" />
          <span className="font-mono text-xs font-semibold text-focus">ERROR 500</span>
        </div>
      }
      title="잠시 문제가 생겼어요"
      description={
        <>
          일시적인 오류로 페이지를 불러오지 못했어요.
          <br />
          잠시 후 다시 시도하면 대부분 해결돼요.
        </>
      }
      actions={
        <>
          <button type="button" onClick={reset} className={statusPrimaryBtn} style={{ background: "var(--primary-gradient)" }}>
            <span className="text-sm">↻</span> 다시 시도
          </button>
          <Link href="/home" className={statusSecondaryBtn}>
            홈으로
          </Link>
        </>
      }
      footer={<p className="font-mono text-[11px] text-muted-foreground">문제가 계속되면 잠시 후 다시 방문해 주세요 · 코드 500</p>}
    />
  );
}
