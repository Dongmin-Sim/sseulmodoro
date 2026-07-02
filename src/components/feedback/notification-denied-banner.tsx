"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const DISMISS_KEY = "sm-notif-denied-dismissed";

// 알림 권한이 'denied'일 때만 노출 — 재요청은 브라우저 제약상 불가하므로 설정 변경 안내. dismiss 시 기억.
export function NotificationDeniedBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const evaluate = () => {
      if (!("Notification" in window) || Notification.permission !== "denied") return;
      let dismissed = false;
      try {
        dismissed = localStorage.getItem(DISMISS_KEY) === "1";
      } catch {
        dismissed = false;
      }
      if (!dismissed) setShow(true);
    };
    evaluate();
  }, []);

  if (!show) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // 저장 실패해도 이번 세션에서는 닫힘
    }
    setShow(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 pt-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3.5 rounded-[20px] border border-[#F0E7D9] bg-[#FBF6EF] px-5 py-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-[#EAD9AE] bg-card">
          <Image src="/icons/bell.png" alt="" width={26} height={26} unoptimized className="pixelated opacity-55" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">알림이 꺼져 있어요</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            집중 종료 알림을 받으려면 브라우저 설정에서 알림을 허용해 주세요.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="닫기"
          className="shrink-0 text-lg leading-none text-muted-foreground hover:text-foreground"
        >
          ×
        </button>
      </div>
    </div>
  );
}
