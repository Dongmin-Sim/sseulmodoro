"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { AUTH } from "@/lib/constants";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < AUTH.MIN_PASSWORD_LENGTH) {
      setError(`비밀번호는 ${AUTH.MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`);
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setError("회원가입 중 오류가 발생했습니다.");
        return;
      }

      setIsSuccess(true);
    } catch {
      setError("회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
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

            <div className="text-center">
              <h1 className="text-2xl font-bold">가입 완료!</h1>
              <p className="text-sm text-muted-foreground mt-1">
                이메일 확인 후 로그인해주세요
              </p>
            </div>

            <Link href="/login" className="w-full">
              <Button className="w-full h-11 rounded-[10px] font-semibold">
                로그인으로 이동
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="w-full max-w-sm rounded-2xl"
      style={{
        boxShadow:
          "0 4px 6px rgba(45,42,38,0.07), 0 2px 4px rgba(45,42,38,0.04)",
      }}
    >
      <CardContent className="pt-8 pb-6 px-6">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-6"
        >
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
                placeholder="6자 이상 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="h-11 px-4 rounded-[10px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm-password">비밀번호 확인</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="비밀번호 다시 입력"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="h-11 px-4 rounded-[10px]"
              />
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {/* 회원가입 버튼 */}
          <Button
            type="submit"
            className="w-full h-11 rounded-[10px] font-semibold"
            disabled={isLoading}
          >
            {isLoading ? "가입 중..." : "회원가입"}
          </Button>

          {/* 로그인 링크 */}
          <Link
            href="/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            이미 계정이 있으신가요? 로그인
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
