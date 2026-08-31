import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { loadCollectionData } from "@/lib/api/collection-data";
import { CollectionClient } from "@/components/collection/collection-client";

export default async function CollectionPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  let data = null;
  try {
    data = await loadCollectionData(user.id);
  } catch (e) {
    console.error("[collection/page] loadCollectionData failed:", e);
  }

  return <CollectionClient data={data} />;
}
