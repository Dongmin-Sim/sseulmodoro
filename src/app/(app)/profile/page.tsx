import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { createServerClient } from "@/lib/supabase/server";
import { loadCollectionData } from "@/lib/api/collection-data";
import { loadHomeData } from "@/lib/api/home-data";
import { ProfileClient } from "@/components/profile/profile-client";

export default async function ProfilePage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createServerClient();
  const [profileRes, collection, home, historyRes] = await Promise.all([
    supabase.from("profiles").select("nickname").eq("id", user.id).single(),
    loadCollectionData(user.id),
    loadHomeData(user.id),
    supabase.rpc("get_record_history", { p_limit: 1 }),
  ]);

  const history = historyRes.data as { summary?: { total?: { count?: number } } } | null;

  return (
    <ProfileClient
      nickname={profileRes.data?.nickname ?? null}
      email={user.email ?? ""}
      balance={home.balance}
      friendCount={collection.ownedTypeCount}
      pomodoroTotal={history?.summary?.total?.count ?? 0}
      level={home.mainCharacter?.level ?? 1}
    />
  );
}
