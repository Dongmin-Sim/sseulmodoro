/** POST /api/sessions 성공 응답 */
export interface StartSessionResponse {
  sessionId: number;
  pomodoroId: number;
}

/** POST /api/pomodoros/:id/complete 요청 */
export interface CompletePomodoroRequest {
  note?: string | null;
}

/** POST /api/pomodoros/:id/complete 성공 응답 */
export interface CompletePomodoroResponse {
  pomodoroId: number;
  sessionId: number;
  completedCount: number;
  targetCount: number;
}

/** POST /api/pomodoros/:id/stop 성공 응답 */
export interface StopPomodoroResponse {
  pomodoroId: number;
  sessionId: number;
}

/** POST /api/sessions/:id/end 성공 응답 */
export interface EndSessionResponse {
  sessionId: number;
  completedCount: number;
  pointsEarned: number;
  newBalance: number;
}

/** POST /api/sessions/:id/pomodoros 성공 응답 */
export interface StartNextPomodoroResponse {
  pomodoroId: number;
  sessionId: number;
}

/** POST /api/gacha 성공 응답 */
export interface GachaResponse {
  characterInstance: {
    instanceId: number;
    typeId: number;
    name: string;
    rarity: string;
    level: number;
    slug: string;
  };
  newBalance: number;
  isNew: boolean;
}

/** GET /api/home 성공 응답 */
export interface HomeDataResponse {
  balance: number;
  mainCharacter: {
    instanceId: number;
    name: string;
    level: number;
    rarity: string;
    slug: string;
  } | null;
  onboardingCompleted: boolean;
}

/** POST /api/auth/logout 성공 응답 */
export interface LogoutResponse {
  success: true;
}

/** 이력 집계 통계 (전체/오늘 공통) */
export interface RecordStat {
  count: number;
  focusMinutes: number;
}

/** 개별 완료 포모도로 로그 항목 */
export interface RecordLog {
  pomodoroId: number;
  completedAt: string; // ISO 8601
  focusMinutes: number;
}

/** GET /api/history 성공 응답 */
export interface RecordResponse {
  summary: { total: RecordStat; today: RecordStat };
  logs: RecordLog[];
  nextCursor: string | null;
}

/** POST /api/onboarding/complete 성공 응답 */
export interface OnboardingCompleteResponse {
  success: true;
}

/** 도감 종별 보유 인스턴스 */
export type CollectionInstance = {
  instanceId: number;
  level: number;
  createdAt: string; // ISO 8601
};

/** 도감 종 — 보유 (이름·외형 공개) */
export type CollectionOwnedType = {
  typeId: number;
  rarity: string;
  owned: true;
  name: string;
  slug: string;
  description: string | null;
  instances: CollectionInstance[];
};

/** 도감 종 — 미보유 (잠금: rarity만 공개) */
export type CollectionLockedType = {
  typeId: number;
  rarity: string;
  owned: false;
};

/** 도감 종 항목 (보유/미보유 판별 유니온) */
export type CollectionType = CollectionOwnedType | CollectionLockedType;

/** GET /api/collection 성공 응답 */
export type CollectionResponse = {
  types: CollectionType[];
  ownedTypeCount: number;
  totalTypeCount: number;
};

/** GET /api/collection/:typeId 성공 응답 */
export type CollectionDetailResponse = CollectionType;

/** API 공통 에러 응답 */
export interface ApiError {
  error: string;
}
