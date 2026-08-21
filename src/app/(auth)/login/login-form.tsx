"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "@/components/auth/google-icon";

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
    <div className="min-h-screen lg:grid lg:grid-cols-[1.1fr_.9fr]">
      {/* 브랜드 패널 */}
      <div
        className="relative flex flex-col items-center justify-center px-6 py-14 lg:py-12"
        style={{
          backgroundColor: "#F3ECE4",
          backgroundImage:
            "radial-gradient(circle at 42% 44%, rgba(212,149,106,.18), rgba(212,149,106,0) 56%), linear-gradient(rgba(45,42,38,.04) 1px,transparent 1px), linear-gradient(90deg,rgba(45,42,38,.04) 1px,transparent 1px)",
          backgroundSize: "auto, 26px 26px, 26px 26px",
        }}
      >
        <Link href="/" className="absolute left-6 top-6 flex items-center gap-2.5 lg:left-10 lg:top-9">
          <span
            className="inline-block rounded"
            style={{ width: 18, height: 18, background: "#C4725C", boxShadow: "inset 0 -5px 0 rgba(0,0,0,.12), 3px -7px 0 -2px #7BA68E" }}
          />
          <span className="font-pixel text-[15px]">쓸모도로</span>
        </Link>
        <span className="animate-sparkle-pulse absolute left-1/4 top-1/3 text-base text-gold">✦</span>
        <span className="animate-sparkle-pulse absolute right-1/4 top-1/2 text-xs text-primary" style={{ animationDelay: ".5s" }}>✦</span>
        <Image
          src="/characters/owl-grad.png"
          alt="포모"
          width={180}
          height={180}
          unoptimized
          priority
          className="pixelated animate-buddy-bob"
        />
        <div className="mt-7 text-center">
          <p className="text-xl font-extrabold tracking-tight text-foreground lg:text-2xl">집중이 쌓이면, 친구가 늘어요</p>
          <p className="mt-2.5 text-sm text-text-secondary">포모도로 한 판마다 귀여운 새를 모아보세요</p>
        </div>
      </div>

      {/* 폼 패널 */}
      <div className="flex flex-col justify-center bg-card px-6 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <p className="font-pixel text-[11px] tracking-[1.5px] text-primary">WELCOME BACK</p>
          <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-foreground lg:text-[28px]">다시 만나서 반가워요</h1>
          <p className="mt-3 text-sm text-text-secondary">Google 계정으로 간편하게 이어서 집중해요.</p>

          {error && (
            <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="mt-7 flex h-14 w-full items-center justify-center gap-3 rounded-[14px] border border-border bg-card text-[15px] font-semibold text-foreground shadow-[var(--shadow)] transition-colors hover:bg-surface-2 disabled:opacity-60"
          >
            <GoogleIcon />
            {isLoading ? "이동 중..." : "Google로 계속하기"}
          </button>

          <p className="mt-7 text-center text-sm text-text-secondary">
            아직 계정이 없으신가요?{" "}
            <Link href="/signup" className="font-bold text-focus hover:underline">회원가입</Link>
          </p>

          {process.env.NODE_ENV !== "production" && <DevLogin />}
        </div>
      </div>
    </div>
  );
}

// 로컬 QA 전용 — 프로덕션 빌드에서는 트리쉐이킹으로 제거된다(NODE_ENV 가드).
// seed.sql의 dev@sseulmodoro.local / password123 계정으로 즉시 로그인.
function DevLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("dev@sseulmodoro.local");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDevLogin = async () => {
    setError(null);
    setIsLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(`개발 로그인 실패: ${authError.message}`);
      setIsLoading(false);
      return;
    }
    router.push("/home");
    router.refresh();
  };

  return (
    <div className="mt-8 rounded-2xl border border-dashed border-border-warm bg-surface-3 p-4">
      <p className="font-pixel text-[9px] tracking-[1.5px] text-gold-deep">DEV LOGIN · 로컬 전용</p>
      <div className="mt-3 flex flex-col gap-2">
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" aria-label="개발용 이메일" className="h-10" />
        <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="비밀번호" aria-label="개발용 비밀번호" className="h-10" />
        <button
          type="button"
          onClick={handleDevLogin}
          disabled={isLoading}
          className="h-10 rounded-[12px] bg-foreground text-sm font-semibold text-background disabled:opacity-60"
        >
          {isLoading ? "로그인 중..." : "개발용 로그인"}
        </button>
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
