"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  { emoji: "🍅", title: "집중 타이머", desc: "포모도로로 몰입하고, 끝나면 포인트를 받아요." },
  { emoji: "🐦", title: "캐릭터 수집", desc: "모은 포인트로 알을 까서 새 친구를 모아요." },
  { emoji: "📊", title: "집중 기록", desc: "집중한 시간이 차곡차곡 기록으로 남아요." },
];

const TOTAL_STEPS = 4;

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
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-7 py-8">
        {/* 진행 인디케이터 */}
        <div className="mb-8 flex justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 24 : 8,
                background: i <= step ? "var(--accent)" : "var(--border)",
              }}
            />
          ))}
        </div>

        {/* 0. 서비스 소개 */}
        {step === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <span className="text-6xl">🐣</span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              쓸모도로에 오신 걸 환영해요
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              집중하면 캐릭터가 자라고,
              <br />그 시간이 고스란히 기록으로 남아요.
            </p>
            <Button size="cta" className="mt-4 w-full" onClick={goNext}>
              다음
            </Button>
          </div>
        )}

        {/* 1. 메인 기능 소개 */}
        {step === 1 && (
          <div className="flex flex-1 flex-col gap-5">
            <h1 className="text-center text-xl font-bold tracking-tight text-foreground">
              이렇게 쓸 수 있어요
            </h1>
            <div className="flex flex-1 flex-col justify-center gap-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
                >
                  <span className="text-3xl">{f.emoji}</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">{f.title}</span>
                    <span className="text-xs text-muted-foreground">{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button size="cta" className="w-full" onClick={goNext}>
              다음
            </Button>
          </div>
        )}

        {/* 2. 닉네임 */}
        {step === 2 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <span className="text-5xl">✏️</span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              어떻게 불러드릴까요?
            </h1>
            <div className="flex w-full flex-col gap-2">
              <div className="flex w-full gap-2">
                <Input
                  value={nickname}
                  onChange={(e) => handleNicknameChange(e.target.value)}
                  placeholder="닉네임"
                  maxLength={12}
                  aria-label="닉네임"
                  className="flex-1 text-center"
                />
                <Button
                  variant="outline"
                  className="shrink-0"
                  onClick={handleCheckNickname}
                  disabled={checking || nickname.trim().length === 0}
                >
                  {checking ? "확인 중..." : "중복확인"}
                </Button>
              </div>
              {nicknameMsg ? (
                <p
                  className={`text-xs ${isNicknameVerified ? "text-muted-foreground" : "text-destructive"}`}
                  aria-live="polite"
                >
                  {nicknameMsg}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  한글·영문·숫자 2~12자. 나중에 바꿀 수 있어요.
                </p>
              )}
            </div>
            <Button
              size="cta"
              className="mt-2 w-full"
              onClick={goNext}
              disabled={!isNicknameVerified}
            >
              다음
            </Button>
          </div>
        )}

        {/* 3. 환영 + 첫 친구 선물 (알 리빌) */}
        {step === 3 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {nickname.trim() ? `${nickname.trim()}님, 환영해요 🎉` : "환영해요 🎉"}
            </h1>
            <p className="text-sm text-muted-foreground">
              첫 친구를 선물로 드려요. 알을 깨보세요!
            </p>
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
