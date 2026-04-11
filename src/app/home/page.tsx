import { getHomeData } from "@/lib/api/home";
import { HomeClient } from "@/components/home/home-client";

export default async function Home() {
  let data;
  try {
    data = await getHomeData();
  } catch (e) {
    console.error("[home/page] getHomeData failed:", e);
    data = null;
  }

  return <HomeClient data={data} />;
}
