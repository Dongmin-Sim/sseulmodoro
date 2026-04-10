import type { HomeDataResponse } from "@/lib/types/api";

export async function getHomeData(): Promise<HomeDataResponse> {
  const res = await fetch("/api/home", { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Failed to fetch home data");
  }

  return res.json();
}
