"use client";

import { useState, useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BirdCard } from "@/components/character/bird-card";

// 알 리빌 결과 — 가챠(뽑기) / 온보딩 선물 등 출처 무관.
export type RevealResult = {
  slug: string;
  name: string;
  rarity: string;
  isNew: boolean;
};

const RARITY_LABEL: Record<string, string> = {
  common: "커먼",
  rare: "레어",
  epic: "에픽",
  legendary: "레전더리",
};

// reveal 시 적용되는 레어리티별 빛·sparkle 테마
const RARITY_THEME: Record<string, { light: string; glow: string; sparkles: number }> = {
  common: { light: "#F4ECD9", glow: "rgba(244,236,217,0.85)", sparkles: 4 },
  rare: { light: "#7FA8D4", glow: "rgba(127,168,212,0.9)", sparkles: 4 },
  epic: { light: "#9B7FD4", glow: "rgba(155,127,212,0.9)", sparkles: 8 },
  legendary: { light: "#E8C45A", glow: "rgba(232,196,90,0.95)", sparkles: 12 },
};

// 단계적 크랙 타임라인 (기대감 증폭): 흔들 → 금1 → 금2 → 팡
const WIGGLE_MS = 600; // 흔들흔들
const CRACK1_HOLD = 520; // 금 조금
const CRACK2_HOLD = 520; // 금 더
const MIN_CRACK_MS = WIGGLE_MS + CRACK1_HOLD + CRACK2_HOLD;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// prefers-reduced-motion (SSR 안전, setState-in-effect 회피)
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCED_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

type Stage = "egg" | "cracking" | "revealed";

type EggRevealProps = {
  // 알을 깨는 동안(cracking) 결과를 resolve — 그동안 연출이 대기를 가린다.
  onReveal: () => Promise<RevealResult>;
  onConfirm: () => void;
  onError?: (msg: string) => void;
  confirmLabel?: string;
};

export function EggReveal({
  onReveal,
  onConfirm,
  onError,
  confirmLabel = "확인",
}: EggRevealProps) {
  const [stage, setStage] = useState<Stage>("egg");
  const [crackStep, setCrackStep] = useState(0); // 0 흔들 · 1 금조금 · 2 금더
  const [result, setResult] = useState<RevealResult | null>(null);
  const reduced = useReducedMotion();

  const handleTap = async () => {
    if (stage !== "egg") return; // 응답 대기 중 중복 호출 방지
    setStage("cracking");
    setCrackStep(0);

    // 크랙 단계 진행 (결과 resolve와 동시에 — 연출이 대기를 가린다)
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (!reduced) {
      timers.push(setTimeout(() => setCrackStep(1), WIGGLE_MS));
      timers.push(setTimeout(() => setCrackStep(2), WIGGLE_MS + CRACK1_HOLD));
    }

    const t0 = performance.now();
    try {
      const res = await onReveal();
      const minWait = reduced ? 0 : MIN_CRACK_MS;
      const elapsed = performance.now() - t0;
      if (elapsed < minWait) await sleep(minWait - elapsed);
      setResult(res); // 팡 → 공개
      setStage("revealed");
    } catch (e) {
      timers.forEach(clearTimeout);
      onError?.(e instanceof Error ? e.message : "reveal_failed");
    }
  };

  const theme = result
    ? (RARITY_THEME[result.rarity] ?? RARITY_THEME.common)
    : RARITY_THEME.common;
  const sparkleCount = result?.isNew ? theme.sparkles : 0;

  // 빛 레이어 — 크랙 단계마다 점점 밝게(틈에서 빛이 새어나옴)
  const leakOpacity = stage === "egg" ? 0.12 : ([0.3, 0.55, 0.85][crackStep] ?? 0.85);
  const leakScale = stage === "egg" ? 0.6 : ([0.72, 0.86, 1.05][crackStep] ?? 1.05);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8">
      <div className="relative flex h-[220px] w-[220px] items-center justify-center">
        {/* 빛 레이어 */}
        <div
          aria-hidden
          className={stage === "revealed" && !reduced ? "animate-light-burst" : ""}
          style={{
            position: "absolute",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${
              stage === "revealed" ? theme.glow : "rgba(255,250,235,0.95)"
            } 0%, transparent 70%)`,
            opacity: stage === "revealed" ? undefined : leakOpacity,
            transform: stage === "revealed" ? undefined : `scale(${leakScale})`,
            transition:
              !reduced && stage !== "revealed"
                ? "opacity 0.4s ease-out, transform 0.4s ease-out"
                : undefined,
          }}
        />

        {/* sparkle (NEW일 때) */}
        {stage === "revealed" &&
          !reduced &&
          Array.from({ length: sparkleCount }).map((_, i) => {
            const angle = (i / sparkleCount) * Math.PI * 2;
            const radius = 78 + (i % 3) * 20;
            return (
              <span
                key={i}
                aria-hidden
                className="animate-sparkle pointer-events-none absolute text-lg"
                style={
                  {
                    color: theme.light,
                    "--sx": `${Math.cos(angle) * radius}px`,
                    "--sy": `${Math.sin(angle) * radius}px`,
                    "--sd": `${(i % 5) * 90}ms`,
                  } as React.CSSProperties
                }
              >
                ✦
              </span>
            );
          })}

        {/* 카드 (공개) */}
        {stage === "revealed" && result && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <BirdCard slug={result.slug} rarity={result.rarity} name={result.name} />
          </div>
        )}

        {/* 알 — egg(탭 대기) / cracking(흔들→금→금) */}
        {stage === "egg" && (
          <button
            type="button"
            onClick={handleTap}
            aria-label="알 깨기"
            className={`relative z-20 cursor-pointer ${reduced ? "" : "animate-egg-bob"}`}
            style={{ background: "transparent", border: "none", padding: 0 }}
          >
            <Egg crackStep={0} />
          </button>
        )}
        {stage === "cracking" && (
          <div
            // crackStep 변할 때마다 remount → 흔들(0)/쿵(1·2) 재생
            key={crackStep}
            className={`relative z-20 ${
              reduced ? "" : crackStep === 0 ? "animate-egg-wiggle" : "animate-egg-jolt"
            }`}
          >
            <Egg crackStep={crackStep} />
          </div>
        )}
        {/* 공개 순간 알 두 쪽이 갈라져 날아감 */}
        {stage === "revealed" && !reduced && (
          <>
            <EggHalf half="top" className="animate-egg-split-top" />
            <EggHalf half="bottom" className="animate-egg-split-bottom" />
          </>
        )}
      </div>

      {/* 안내 / 결과 */}
      {stage === "egg" && (
        <p className="text-sm font-medium text-muted-foreground">알을 탭해서 깨보세요!</p>
      )}
      {stage === "cracking" && (
        <p className="text-sm font-medium text-muted-foreground">
          {crackStep === 0 ? "두근두근..." : crackStep === 1 ? "조금만 더..." : "거의 다 됐어!"}
        </p>
      )}
      {stage === "revealed" && result && (
        <>
          <div className="flex flex-col items-center gap-2.5">
            <h1 className="text-[22px] font-bold tracking-tight text-foreground">
              {result.name}
            </h1>
            <div className="flex gap-2">
              <Badge
                className="rounded-full px-3.5 py-1 text-xs font-semibold text-white"
                style={{
                  background: "linear-gradient(135deg, #D4956A, #C4725C)",
                  border: "none",
                }}
              >
                {RARITY_LABEL[result.rarity] ?? result.rarity}
              </Badge>
              <Badge
                className={`rounded-full px-3.5 py-1 text-xs font-semibold text-white ${
                  result.isNew && !reduced ? "animate-bounce" : ""
                }`}
                style={{
                  background: result.isNew ? "#7BA68E" : "#9C9590",
                  border: "none",
                }}
              >
                {result.isNew ? "NEW!" : "이미 보유"}
              </Badge>
            </div>
          </div>

          <Button
            className="mt-1 w-full rounded-[10px] py-4 text-base font-bold text-white"
            style={{
              background: "#D4956A",
              boxShadow: "0 6px 16px rgba(212,149,106,0.38)",
              border: "none",
              height: "auto",
            }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      )}
    </div>
  );
}

const EGG_BG =
  "radial-gradient(circle at 38% 30%, #FBF5E8 0%, #F0E4CC 55%, #E4D4B2 100%)";

// crackStep: 0 금 없음 · 1 금 조금 · 2 금 더
function Egg({ crackStep }: { crackStep: number }) {
  const dashOffset = crackStep >= 2 ? 10 : crackStep >= 1 ? 52 : 100;
  return (
    <div
      style={{
        width: 120,
        height: 150,
        borderRadius: "50% 50% 50% 50% / 60% 60% 42% 42%",
        background: EGG_BG,
        boxShadow:
          "inset -6px -8px 14px rgba(180,150,110,0.35), 0 8px 20px rgba(180,150,110,0.3)",
        position: "relative",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 38,
          left: 30,
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "rgba(180,150,110,0.3)",
        }}
      />
      <span
        style={{
          position: "absolute",
          top: 78,
          left: 70,
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: "rgba(180,150,110,0.28)",
        }}
      />
      {crackStep > 0 && (
        <svg
          aria-hidden
          viewBox="0 0 120 150"
          style={{ position: "absolute", inset: 0, width: 120, height: 150 }}
        >
          <path
            d="M62,10 L54,38 L70,58 L50,84 L66,110 L56,140"
            fill="none"
            stroke="rgba(95,72,48,0.75)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={100}
            style={{ strokeDasharray: 100, strokeDashoffset: dashOffset }}
          />
        </svg>
      )}
    </div>
  );
}

function EggHalf({ half, className }: { half: "top" | "bottom"; className?: string }) {
  const isTop = half === "top";
  return (
    <div
      aria-hidden
      className={`absolute z-20 ${className ?? ""}`}
      style={{
        width: 120,
        height: 76,
        top: isTop ? "calc(50% - 75px)" : "calc(50% - 1px)",
        background: EGG_BG,
        borderRadius: isTop
          ? "50% 50% 8% 8% / 64% 64% 14% 14%"
          : "8% 8% 50% 50% / 14% 14% 78% 78%",
        boxShadow: "inset -6px -8px 14px rgba(180,150,110,0.35)",
      }}
    />
  );
}
