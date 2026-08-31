import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { loadHomeData } from "@/lib/api/home-data";
import { HomeClient } from "@/components/home/home-client";

export default async function Home() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  // 서버 컴포넌트에서 Supabase 직접 조회 (자기 API 상대 fetch는 origin 없어 실패).
  // 실패는 삼키지 않고 error.tsx로 전파 — 빈 계정 화면으로 위장하지 않도록 (/select와 동일).
  const data = await loadHomeData(user.id);

  return <HomeClient data={data} />;
}
