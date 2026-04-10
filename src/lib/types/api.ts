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
  } | null;
}

/** POST /api/auth/logout 성공 응답 */
export interface LogoutResponse {
  success: boolean;
}

/** API 공통 에러 응답 */
export interface ApiError {
  error: string;
}
