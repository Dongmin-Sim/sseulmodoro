/** 인증 정책 — Supabase Auth 설정과 동기화 필요 */
export const AUTH = {
  MIN_PASSWORD_LENGTH: 6,
} as const;

/** 세션 기본값 (설정 UI 초기값 + API 미전달 시 fallback) */
export const SESSION_DEFAULTS = {
  targetCount: 4,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
} as const;
