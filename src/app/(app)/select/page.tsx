import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { loadCollectionData } from "@/lib/api/collection-data";
import { loadHomeData } from "@/lib/api/home-data";
import { SelectClient } from "@/components/select/select-client";

export default async function SelectPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  const [collection, home] = await Promise.all([
    loadCollectionData(user.id),
    loadHomeData(user.id),
  ]);

  return (
    <SelectClient
      collection={collection}
      currentMainId={home.mainCharacter?.instanceId ?? null}
    />
  );
}
