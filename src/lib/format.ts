/**
 * 포모도로 이력 표시용 포맷 유틸. 모두 KST(Asia/Seoul) 기준으로 표시한다
 * (BE rpc의 "오늘" 경계도 KST이므로 정합을 맞춘다).
 */

/**
 * 집중 시간(분)을 한국어 표기로 변환.
 *   0 → "0분", 30 → "30분", 60 → "1시간", 90 → "1시간 30분", 125 → "2시간 5분"
 */
export function formatFocusDuration(minutes: number): string {
  const safe = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;

  if (hours === 0) return `${mins}분`;
  if (mins === 0) return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
}

/**
 * ISO 8601 완료 시각을 KST 기준 "2026년 6월 2일 14:30" 표기로 변환.
 */
export function formatRecordTimestamp(iso: string): string {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  // 일부 환경은 자정을 "24"로 반환 — "00"으로 보정
  const hour = get("hour") === "24" ? "00" : get("hour");

  return `${get("year")}년 ${get("month")}월 ${get("day")}일 ${hour}:${get("minute")}`;
}
