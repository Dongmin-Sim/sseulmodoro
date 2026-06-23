"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "oauth"
      ? "로그인에 실패했어요. 다시 시도해주세요."
      : null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (authError) {
        setError("로그인에 실패했어요. 다시 시도해주세요.");
        setIsLoading(false);
      }
      // 성공 시 Google로 리다이렉트되므로 로딩 상태 유지
    } catch {
      setError("로그인에 실패했어요. 다시 시도해주세요.");
      setIsLoading(false);
    }
  };

  return (
    <Card
      className="w-full max-w-sm rounded-2xl"
      style={{
        boxShadow:
          "0 4px 6px rgba(45,42,38,0.07), 0 2px 4px rgba(45,42,38,0.04)",
      }}
    >
      <CardContent className="pt-8 pb-6 px-6">
        <div className="flex flex-col items-center gap-6">
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

          {/* 에러 메시지 */}
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {/* Google 로그인 버튼 */}
          <Button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-11 rounded-[10px] font-semibold"
          >
            {isLoading ? "이동 중..." : "Google로 로그인"}
          </Button>

          {/* 회원가입 링크 */}
          <Link
            href="/signup"
            className="text-sm font-medium text-primary hover:underline py-3 inline-block"
          >
            계정이 없으신가요? 회원가입
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
