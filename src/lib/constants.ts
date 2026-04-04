/**
 * 임시 하드코딩 사용자 ID (인증 미구현 상태)
 * TODO: Auth 구현(TASK-002) 후 제거하고 supabase.auth.getUser()로 대체
 */
export const TEMP_USER_ID = "00000000-0000-0000-0000-000000000001";

/** 세션 기본값 (설정 UI 초기값 + API 미전달 시 fallback) */
export const SESSION_DEFAULTS = {
  targetCount: 4,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
} as const;
