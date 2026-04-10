"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("redirectTo") ?? "/";
  const redirectTo = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch (e) {
      console.error("[LoginForm] unexpected error", e);
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm rounded-2xl" style={{ boxShadow: "0 4px 6px rgba(45,42,38,0.07), 0 2px 4px rgba(45,42,38,0.04)" }}>
      <CardContent className="pt-8 pb-6 px-6">
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6">
          {/* 캐릭터 */}
          <div
            className="w-16 h-16 relative"
            style={{
              backgroundColor: "#E8D5C0",
              borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
              boxShadow: "0 2px 8px rgba(210,170,130,0.3)",
            }}
          >
            <span
              className="absolute w-1.5 h-1.5 rounded-full bg-foreground"
              style={{ top: "38%", left: "32%" }}
            />
            <span
              className="absolute w-1.5 h-1.5 rounded-full bg-foreground"
              style={{ top: "38%", right: "32%" }}
            />
          </div>

          {/* 타이틀 */}
          <div className="text-center">
            <h1 className="text-2xl font-bold">쓸모도로</h1>
            <p className="text-sm text-muted-foreground mt-1">
              집중하면 캐릭터가 자라요
            </p>
          </div>

          {/* 폼 */}
          <div className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11 px-4 rounded-[10px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-11 px-4 rounded-[10px]"
              />
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {/* 로그인 버튼 */}
          <Button
            type="submit"
            className="w-full h-11 rounded-[10px] font-semibold"
            disabled={isLoading}
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </Button>

          {/* 회원가입 링크 */}
          <Link
            href="/signup"
            className="text-sm font-medium text-primary hover:underline py-3 inline-block"
          >
            계정이 없으신가요? 회원가입
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
