import type { CollectionDetailResponse } from "@/lib/types/api";

/** GET /api/collection/:typeId — 종 상세를 가져온다. */
export async function getCollectionDetail(
  typeId: number,
): Promise<CollectionDetailResponse> {
  const res = await fetch(`/api/collection/${typeId}`);
  if (!res.ok) {
    throw new Error("collection_detail_failed");
  }
  return res.json();
}
