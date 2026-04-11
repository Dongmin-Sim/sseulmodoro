import { AppShell } from "@/components/layout/app-shell";
import { TopNav } from "@/components/layout/top-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <TopNav />
      {children}
    </AppShell>
  );
}
