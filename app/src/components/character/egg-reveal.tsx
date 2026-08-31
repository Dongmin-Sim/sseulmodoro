"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
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
  common: "일반",
  rare: "레어",
  epic: "에픽",
  legendary: "전설",
  mythic: "신화",
};

// reveal 시 적용되는 레어리티별 빛·sparkle 테마 (rarity.ts accent 계열과 정합)
const RARITY_THEME: Record<string, { light: string; glow: string; sparkles: number }> = {
  common: { light: "#F4ECD9", glow: "rgba(244,236,217,0.85)", sparkles: 4 },
  rare: { light: "#7FA8D4", glow: "rgba(127,168,212,0.9)", sparkles: 4 },
  epic: { light: "#B79BE0", glow: "rgba(156,111,203,0.9)", sparkles: 8 },
  legendary: { light: "#E8C45A", glow: "rgba(224,177,94,0.95)", sparkles: 12 },
  mythic: { light: "#DCC0E8", glow: "rgba(201,168,214,0.95)", sparkles: 16 },
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

const DARK_BG = "radial-gradient(circle at 50% 42%, #4A3F4E 0%, #2C2630 55%, #1E1A22 100%)";
const CONIC_RAYS =
  "conic-gradient(from 0deg, rgba(224,177,94,.18) 0deg, transparent 24deg, rgba(224,177,94,.18) 48deg, transparent 72deg, rgba(224,177,94,.18) 96deg, transparent 120deg, rgba(224,177,94,.18) 144deg, transparent 168deg, rgba(224,177,94,.18) 192deg, transparent 216deg, rgba(224,177,94,.18) 240deg, transparent 264deg, rgba(224,177,94,.18) 288deg, transparent 312deg, rgba(224,177,94,.18) 336deg, transparent 360deg)";
type SparklePos = {
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  size: number;
  color: string;
  delay: string;
};

const IMMERSIVE_SPARKLES: SparklePos[] = [
  { left: "24%", top: "18%", size: 22, color: "#E0B15E", delay: "0s" },
  { right: "26%", top: "23%", size: 16, color: "#D4956A", delay: ".4s" },
  { left: "30%", bottom: "22%", size: 18, color: "#7BA68E", delay: ".8s" },
  { right: "28%", bottom: "26%", size: 14, color: "#E0B15E", delay: "1.1s" },
  { left: "38%", top: "13%", size: 12, color: "#fff", delay: ".6s" },
];

type EggRevealProps = {
  // 알을 깨는 동안(cracking) 결과를 resolve — 그동안 연출이 대기를 가린다.
  onReveal: () => Promise<RevealResult>;
  onConfirm: () => void;
  onError?: (msg: string) => void;
  confirmLabel?: string;
  variant?: "inline" | "immersive";
};

export function EggReveal({
  onReveal,
  onConfirm,
  onError,
  confirmLabel = "확인",
  variant = "inline",
}: EggRevealProps) {
  const immersive = variant === "immersive";
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
    <div
      className={cn(
        immersive
          ? "fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-6 text-center text-white"
          : "flex flex-1 flex-col items-center justify-center gap-6 py-8",
      )}
      style={immersive ? { background: DARK_BG } : undefined}
    >
      {immersive &&
        IMMERSIVE_SPARKLES.map((s, i) => (
          <span
            key={i}
            aria-hidden
            className="animate-sparkle-pulse pointer-events-none absolute"
            style={{ left: s.left, right: s.right, top: s.top, bottom: s.bottom, fontSize: s.size, color: s.color, animationDelay: s.delay }}
          >
            ✦
          </span>
        ))}

      {immersive && stage === "revealed" && result && (
        <p className="font-pixel mb-2 text-[13px] tracking-[2px] text-gold">
          {(RARITY_LABEL[result.rarity] ?? result.rarity).toUpperCase()}!
        </p>
      )}

      <div
        className={cn(
          "relative flex items-center justify-center",
          immersive ? "h-[300px] w-[300px]" : "h-[220px] w-[220px]",
        )}
      >
        {/* 광선 (immersive 공개) */}
        {immersive && stage === "revealed" && (
          <div
            aria-hidden
            className="animate-sparkle-pulse absolute"
            style={{ width: 420, height: 420, borderRadius: "50%", background: CONIC_RAYS }}
          />
        )}
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

        {/* 공개 — immersive: 대형 스프라이트 / inline: 카드 */}
        {stage === "revealed" && result && (
          immersive ? (
            <div className="animate-in fade-in zoom-in-95 relative z-10 flex flex-col items-center duration-500">
              <Image
                src={`/characters/${result.slug}.png`}
                alt={result.name}
                width={210}
                height={210}
                unoptimized
                className="pixelated animate-buddy-bob"
                style={{ filter: "drop-shadow(0 12px 24px rgba(0,0,0,.4))" }}
              />
              <div className="mt-1 h-4 w-40 rounded-full bg-black/30 blur-[5px]" />
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <BirdCard slug={result.slug} rarity={result.rarity} name={result.name} />
            </div>
          )
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
        <p className={cn("text-sm font-medium", immersive ? "mt-2 text-white/70" : "text-muted-foreground")}>
          알을 탭해서 깨보세요!
        </p>
      )}
      {stage === "cracking" && (
        <p className={cn("text-sm font-medium", immersive ? "mt-2 text-white/70" : "text-muted-foreground")}>
          {crackStep === 0 ? "두근두근..." : crackStep === 1 ? "조금만 더..." : "거의 다 됐어!"}
        </p>
      )}

      {/* immersive 공개 결과 */}
      {immersive && stage === "revealed" && result && (
        <div className="mt-5 flex flex-col items-center">
          <h1 className="text-3xl font-extrabold tracking-tight">{result.name}</h1>
          <div className="mt-3.5 inline-flex items-center gap-2 rounded-full border border-gold/45 bg-gold/15 px-4 py-1.5">
            <span className="text-gold">✦</span>
            <span className="font-pixel text-[11px] tracking-[1px] text-gold">
              {(RARITY_LABEL[result.rarity] ?? result.rarity)} · {result.isNew ? "새로운 친구" : "이미 함께한 친구"}
            </span>
          </div>
          <div className="mt-7 flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/collection"
              className="flex h-13 min-w-[150px] items-center justify-center rounded-[14px] border border-white/25 bg-white/10 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-white/15"
            >
              도감에서 보기
            </Link>
            <button
              type="button"
              onClick={onConfirm}
              className="flex h-13 min-w-[170px] items-center justify-center rounded-[14px] px-6 text-[15px] font-bold text-primary-foreground shadow-[0_8px_24px_rgba(212,149,106,.5)] transition-transform hover:scale-[1.01]"
              style={{ background: "var(--primary-gradient)" }}
            >
              한 번 더 뽑기
            </button>
          </div>
        </div>
      )}

      {/* inline 공개 결과 */}
      {!immersive && stage === "revealed" && result && (
        <>
          <div className="flex flex-col items-center gap-2.5">
            <h1 className="text-[22px] font-bold tracking-tight text-foreground">
              {result.name}
            </h1>
            <div className="flex gap-2">
              <Badge
                className="rounded-full px-3.5 py-1 text-xs font-semibold text-white"
                style={{
                  background: "linear-gradient(135deg, var(--accent), var(--chart-2))",
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
                  background: result.isNew ? "var(--break)" : "var(--muted-foreground)",
                  border: "none",
                }}
              >
                {result.isNew ? "NEW!" : "이미 보유"}
              </Badge>
            </div>
          </div>

          <Button size="cta" className="mt-1 w-full" onClick={onConfirm}>
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
