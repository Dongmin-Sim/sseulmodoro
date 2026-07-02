"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "@/components/auth/google-icon";

const SAMPLE_BIRDS = ["glaucousgull", "crane", "godwit"] as const;

function SignupContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "oauth"
      ? "로그인에 실패했어요. 다시 시도해주세요."
      : null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignup = async () => {
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
    <div className="flex min-h-screen flex-col-reverse lg:grid lg:grid-cols-[.9fr_1.1fr]">
      {/* 폼 패널 */}
      <div className="flex flex-col justify-center bg-card px-6 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <p className="font-pixel text-[11px] tracking-[1.5px] text-primary">GET STARTED</p>
          <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-foreground lg:text-[28px]">첫 친구가 기다려요</h1>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            Google 계정으로 3초 만에 시작하고 알 1개를 무료로 받으세요.
          </p>

          {error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-[14px] border border-border bg-card text-[15px] font-semibold text-foreground shadow-[var(--shadow-md)] transition-colors hover:bg-surface-2 disabled:opacity-60"
          >
            <GoogleIcon size={22} />
            {isLoading ? "이동 중..." : "Google로 가입하기"}
          </button>

          <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-border-warm bg-surface-3 px-4 py-3.5">
            <Image src="/icons/gift.png" alt="선물" width={22} height={22} unoptimized className="pixelated" />
            <span className="text-[13px] font-medium text-text-secondary">
              가입 즉시 <span className="font-bold text-focus">알 1개 + 200P</span>를 드려요
            </span>
          </div>

          <p className="mt-5 text-xs leading-relaxed text-text-faint">
            가입 시 <span className="font-semibold text-muted-foreground">서비스 이용약관</span> 및{" "}
            <span className="font-semibold text-muted-foreground">개인정보 처리방침</span>에 동의하게 됩니다
          </p>

          <p className="mt-6 text-center text-sm text-text-secondary">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-bold text-focus hover:underline">로그인</Link>
          </p>
        </div>
      </div>

      {/* 리워드 패널 */}
      <div
        className="relative flex flex-col items-center justify-center px-6 py-14 lg:py-12"
        style={{
          backgroundColor: "#F3ECE4",
          backgroundImage:
            "radial-gradient(circle at 56% 44%, rgba(123,166,142,.2), rgba(123,166,142,0) 56%), linear-gradient(rgba(45,42,38,.04) 1px,transparent 1px), linear-gradient(90deg,rgba(45,42,38,.04) 1px,transparent 1px)",
          backgroundSize: "auto, 26px 26px, 26px 26px",
        }}
      >
        <span className="animate-sparkle-pulse absolute left-1/4 top-1/4 text-base text-gold">✦</span>
        <span className="animate-sparkle-pulse absolute bottom-1/4 right-1/4 text-xs text-primary" style={{ animationDelay: ".5s" }}>✦</span>
        <div className="relative flex items-center justify-center">
          <div
            className="absolute h-56 w-56 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(224,177,94,.26), rgba(224,177,94,0) 62%)" }}
          />
          <Image src="/icons/egg-smooth.png" alt="알" width={150} height={150} unoptimized priority className="pixelated animate-buddy-bob" />
        </div>
        <div className="mt-6 text-center">
          <p className="text-xl font-extrabold text-foreground lg:text-[22px]">웰컴 기프트</p>
          <p className="mt-2 text-sm text-text-secondary">가입 즉시 알 1개 · 200포인트 지급</p>
        </div>
        <div className="mt-6 flex gap-3.5">
          {SAMPLE_BIRDS.map((slug) => (
            <Image
              key={slug}
              src={`/characters/${slug}.png`}
              alt=""
              width={60}
              height={60}
              unoptimized
              className="pixelated opacity-85"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupContent />
    </Suspense>
  );
}
