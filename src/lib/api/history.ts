import type { RecordResponse } from "@/lib/types/api";

/**
 * 이력 조회 — GET /api/history.
 * 클라이언트에서 호출(상대경로는 브라우저 origin 기준으로 완성됨).
 * @param cursor 이전 페이지의 nextCursor (없으면 첫 페이지)
 * @param limit  페이지 크기
 */
export async function getHistory(
  cursor?: string | null,
  limit?: number,
): Promise<RecordResponse> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();

  const res = await fetch(`/api/history${qs ? `?${qs}` : ""}`);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to fetch history");
  }

  return res.json();
}
