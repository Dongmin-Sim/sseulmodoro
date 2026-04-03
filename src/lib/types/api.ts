/** POST /api/sessions 성공 응답 */
export interface StartSessionResponse {
  sessionId: number;
  pomodoroId: number;
}

/** API 공통 에러 응답 */
export interface ApiError {
  error: string;
}
