import { AppShell } from "@/components/layout/app-shell";
import { TopNav } from "@/components/layout/top-nav";
import { getAuthUser } from "@/lib/supabase/auth";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();

  return (
    <AppShell>
      <TopNav isAuthenticated={!!user} />
      {children}
    </AppShell>
  );
}
