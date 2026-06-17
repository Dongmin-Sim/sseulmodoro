import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AuthHeader } from "@/components/layout/auth-header";
import { PomodoroSessionProvider } from "@/components/pomodoro/session-context";
import { getAuthUser } from "@/lib/supabase/auth";
import { createServerClient } from "@/lib/supabase/server";

// 인증 영역 공통 레이아웃 — 인증 가드 + 공통 상단 헤더(닉네임·로그아웃).
// PomodoroSessionProvider를 여기로 올려 헤더가 세션 진행 상태를 읽는다(home 전용 → 인증 영역 전역).
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .single();

  return (
    <AppShell>
      <PomodoroSessionProvider>
        <AuthHeader nickname={data?.nickname ?? null} />
        {children}
      </PomodoroSessionProvider>
    </AppShell>
  );
}
