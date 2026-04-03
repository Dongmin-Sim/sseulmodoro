/** POST /api/sessions 성공 응답 */
export interface StartSessionResponse {
  sessionId: number;
  pomodoroId: number;
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

/** API 공통 에러 응답 */
export interface ApiError {
  error: string;
}
