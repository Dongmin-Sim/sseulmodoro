"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

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
      <Image src="/icons/wifi-off.png" alt="" width={18} height={18} unoptimized className="pixelated shrink-0" />
      <span className="text-[12px] font-semibold leading-snug text-[#F4EEE6] lg:text-[13px]">
        오프라인 상태예요 — 타이머는 계속 작동하고, 기록은 연결되면 자동 저장돼요
      </span>
    </div>
  );
}
