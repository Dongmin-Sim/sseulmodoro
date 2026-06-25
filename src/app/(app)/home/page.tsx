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
  let data = null;
  try {
    data = await loadHomeData(user.id);
  } catch (e) {
    console.error("[home/page] loadHomeData failed:", e);
  }

  return <HomeClient data={data} />;
}
