import type { LogoutResponse } from "@/lib/types/api";

export async function logout(): Promise<LogoutResponse> {
  const res = await fetch("/api/auth/logout", { method: "POST" });

  if (!res.ok) {
    throw new Error("Failed to logout");
  }

  return res.json();
}
