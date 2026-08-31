"use client";

import { statusSecondaryBtn } from "./fullscreen-status";

// 브라우저 히스토리 뒤로 (이전 페이지). 히스토리가 없으면 홈 폴백.
export function BackButton({ label = "이전 페이지" }: { label?: string }) {
  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/home";
    }
  };

  return (
    <button type="button" onClick={handleBack} className={statusSecondaryBtn}>
      {label}
    </button>
  );
}
