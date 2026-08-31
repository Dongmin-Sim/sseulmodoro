"use client";

import { useEffect } from "react";

// 앱 로드당 1회만 emit. 모듈 스코프 플래그는 전체 새로고침(새 JS 컨텍스트)에서만
// 초기화되므로, 라우트 전환·StrictMode 이중 마운트에서는 재발하지 않고
// 새로고침 시에는 정상적으로 다시 찍힌다.
let hasEmitted = false;

export function AppVisitedTracker() {
  useEffect(() => {
    if (hasEmitted) return;
    hasEmitted = true;

    fetch("/api/events/app-visited", { method: "POST", keepalive: true }).catch(
      () => {},
    );
  }, []);

  return null;
}
