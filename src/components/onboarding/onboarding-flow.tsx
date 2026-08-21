"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { EggReveal } from "@/components/character/egg-reveal";
import { completeOnboarding, NicknameTakenError } from "@/lib/api/onboarding";
import { checkNickname } from "@/lib/api/check-nickname";

// 닉네임 형식: 한글·영문·숫자 2~12자 (DB CHECK 제약과 동일)
const NICKNAME_PATTERN = /^[0-9A-Za-z가-힣]{2,12}$/;

type Starter = { slug: string; name: string; rarity: string };

type OnboardingFlowProps = {
  starter: Starter;
  onDone: () => void;
};

const FEATURES = [
  { icon: "/icons/tomato.png", tint: "focus", step: "01", title: "집중하기", desc: "25분 타이머를 켜고 딴짓 없이 한 판 몰입해요." },
  { icon: "/icons/star.png", tint: "gold", step: "02", title: "포인트 모으기", desc: "집중을 마치면 포인트 적립, 모아서 알을 뽑아요." },
  { icon: "/icons/gift.png", tint: "break", step: "03", title: "친구 모으기", desc: "새로운 새를 도감에 채우고 집중 파트너로 함께해요." },
] as const;

const TINT_BG: Record<string, string> = {
  focus: "border-focus/25 bg-focus/10",
  break: "border-break/25 bg-break/10",
  gold: "border-border-warm bg-gold/10",
};

const TOTAL_STEPS = 4;

function GradientButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-14 w-full items-center justify-center rounded-[14px] text-base font-bold text-primary-foreground shadow-[0_8px_20px_rgba(212,149,106,.4)] transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
      style={{ background: "var(--primary-gradient)" }}
    >
      {children}
    </button>
  );
}

export function OnboardingFlow({ starter, onDone }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState("");
  const [isNicknameVerified, setIsNicknameVerified] = useState(false);
  const [checking, setChecking] = useState(false);
  const [nicknameMsg, setNicknameMsg] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    setIsNicknameVerified(false);
    setNicknameMsg(null);
  };

  const handleCheckNickname = async () => {
    if (checking) return;
    const trimmed = nickname.trim();
    if (!NICKNAME_PATTERN.test(trimmed)) {
      setNicknameMsg("한글·영문·숫자 2~12자로 입력해주세요.");
      setIsNicknameVerified(false);
      return;
    }
    setChecking(true);
    setNicknameMsg(null);
    try {
      const available = await checkNickname(trimmed);
      setIsNicknameVerified(available);
      setNicknameMsg(available ? "사용할 수 있는 닉네임이에요." : "이미 사용 중인 닉네임이에요.");
    } catch {
      setNicknameMsg("확인에 실패했어요. 다시 시도해주세요.");
      setIsNicknameVerified(false);
    } finally {
      setChecking(false);
    }
  };

  const handleFinish = async () => {
    if (finishing) return;
    setFinishing(true);
    setError(null);
    try {
      await completeOnboarding(nickname.trim());
      onDone();
    } catch (e) {
      if (e instanceof NicknameTakenError) {
        setIsNicknameVerified(false);
        setNicknameMsg("이미 사용 중인 닉네임이에요. 다시 확인해주세요.");
        setStep(2);
      } else {
        setError("저장에 실패했어요. 다시 시도해주세요.");
      }
      setFinishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background bg-grid">
      <div className={cn("mx-auto flex w-full flex-1 flex-col px-7 py-8", step === 1 ? "max-w-4xl" : "max-w-md")}>
        {/* 진행 인디케이터 */}
        <div className="mb-9 flex justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 28 : 16,
                background: i <= step ? "var(--primary)" : "var(--border)",
              }}
            />
          ))}
        </div>

        {/* 0. 서비스 소개 */}
        {step === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute h-44 w-44 rounded-full" style={{ background: "radial-gradient(circle, rgba(224,177,94,.24), rgba(224,177,94,0) 62%)" }} />
              <Image src="/characters/owl-grad.png" alt="포모" width={130} height={130} unoptimized priority className="pixelated animate-buddy-bob" />
            </div>
            <div>
              <p className="font-pixel text-[10px] tracking-[1.5px] text-primary">WELCOME</p>
              <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-foreground">쓸모도로에 오신 걸 환영해요</h1>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                집중하면 캐릭터가 자라고,
                <br />그 시간이 고스란히 기록으로 남아요.
              </p>
            </div>
            <GradientButton onClick={goNext}>다음</GradientButton>
          </div>
        )}

        {/* 1. 메인 기능 소개 */}
        {step === 1 && (
          <div className="flex flex-1 flex-col">
            <div className="mb-6 text-center lg:mb-9">
              <p className="font-pixel text-[10px] tracking-[1.5px] text-primary">HOW IT WORKS</p>
              <h1 className="mt-2.5 text-xl font-extrabold tracking-tight text-foreground lg:text-3xl">집중하고, 모으고, 키워요</h1>
            </div>
            <div className="grid flex-1 content-center gap-3 lg:grid-cols-3 lg:gap-6">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow)] lg:flex-col lg:items-start lg:gap-3 lg:p-6"
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${TINT_BG[f.tint]} lg:h-16 lg:w-16`}>
                    <Image src={f.icon} alt="" width={26} height={26} unoptimized className="pixelated lg:h-8 lg:w-8" />
                  </div>
                  <div className="flex flex-col">
                    <p className="font-pixel text-[9px] tracking-[1px] text-primary">STEP {f.step}</p>
                    <span className="mt-0.5 text-sm font-bold text-foreground lg:text-base">{f.title}</span>
                    <span className="mt-0.5 text-xs leading-relaxed text-text-secondary lg:mt-1.5">{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 w-full lg:mx-auto lg:max-w-sm">
              <GradientButton onClick={goNext}>다음</GradientButton>
            </div>
          </div>
        )}

        {/* 2. 닉네임 */}
        {step === 2 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute h-36 w-36 rounded-full" style={{ background: "radial-gradient(circle, rgba(212,149,106,.18), rgba(212,149,106,0) 62%)" }} />
              <Image src="/characters/owl.png" alt="포모" width={110} height={110} unoptimized className="pixelated animate-buddy-bob" />
            </div>
            <div>
              <p className="font-pixel text-[10px] tracking-[1.5px] text-primary">NICKNAME</p>
              <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-foreground">어떻게 불러드릴까요?</h1>
            </div>
            <div className="flex w-full flex-col gap-2">
              <div className="flex w-full gap-2">
                <Input
                  value={nickname}
                  onChange={(e) => handleNicknameChange(e.target.value)}
                  placeholder="닉네임"
                  maxLength={12}
                  aria-label="닉네임"
                  className="h-12 flex-1 rounded-[13px] text-center"
                />
                <button
                  type="button"
                  onClick={handleCheckNickname}
                  disabled={checking || nickname.trim().length === 0}
                  className="h-12 shrink-0 rounded-[13px] border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-2 disabled:opacity-50"
                >
                  {checking ? "확인 중..." : "중복확인"}
                </button>
              </div>
              {nicknameMsg ? (
                <p className={`text-xs ${isNicknameVerified ? "text-break" : "text-destructive"}`} aria-live="polite">
                  {nicknameMsg}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">한글·영문·숫자 2~12자. 나중에 바꿀 수 있어요.</p>
              )}
            </div>
            <GradientButton onClick={goNext} disabled={!isNicknameVerified}>다음</GradientButton>
          </div>
        )}

        {/* 3. 환영 + 첫 친구 선물 (알 리빌) */}
        {step === 3 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <p className="font-pixel text-[10px] tracking-[1.5px] text-primary">FIRST FRIEND</p>
            <h1 className="mt-1 text-xl font-extrabold tracking-tight text-foreground">
              {nickname.trim() ? `${nickname.trim()}님, 환영해요 🎉` : "환영해요 🎉"}
            </h1>
            <p className="text-sm text-text-secondary">첫 친구를 선물로 드려요. 알을 깨보세요!</p>
            <EggReveal
              onReveal={async () => ({
                slug: starter.slug,
                name: starter.name,
                rarity: starter.rarity,
                isNew: true,
              })}
              onConfirm={handleFinish}
              confirmLabel={finishing ? "시작하는 중..." : "시작하기"}
            />
            {error && (
              <p role="alert" aria-live="assertive" className="text-xs text-destructive">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
