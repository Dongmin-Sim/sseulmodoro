import type { HeatmapResponse } from "@/lib/types/api";

export async function getHeatmap(): Promise<HeatmapResponse> {
  const res = await fetch("/api/history/heatmap");

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(body.error || "Failed to fetch heatmap");
  }

  return res.json();
}
