import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { createServerClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent } from "@/components/ui/card";

// 내 정보 — 최소 구성(닉네임·가입 이메일 읽기 전용). 닉네임 변경 등은 후속 태스크.
export default async function ProfilePage() {
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
    <main className="relative z-10 flex flex-1 flex-col py-6">
      <PageContainer className="flex flex-col gap-5">
        <h1 className="text-xl font-bold tracking-tight text-foreground">내 정보</h1>
        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">닉네임</span>
              <span className="text-sm font-semibold text-foreground">
                {data?.nickname ?? "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">이메일</span>
              <span className="text-sm text-foreground">{user.email}</span>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </main>
  );
}
