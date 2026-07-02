"use client";

import { useEffect, useState } from "react";

// 전역 오프라인 표시 — navigator.onLine + online/offline 이벤트. 오프라인일 때만 상단 배너.
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const update = () => setIsOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2.5 px-4 py-3 text-center"
      style={{ backgroundColor: "#5B5048" }}
    >
      <svg aria-hidden viewBox="0 0 24 24" width={18} height={18} className="shrink-0 text-[#F4EEE6]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 1l22 22" />
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
        <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
      <span className="text-[12px] font-semibold leading-snug text-[#F4EEE6] lg:text-[13px]">
        오프라인 상태예요 — 인터넷 연결을 확인해 주세요. 연결이 끊긴 동안의 기록은 저장되지 않을 수 있어요
      </span>
    </div>
  );
}
