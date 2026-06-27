"use client";

import { useState } from "react";
import Image from "next/image";
import { PomodoroTimer } from "@/components/pomodoro/pomodoro-timer";
import { usePomodoroSession } from "@/components/pomodoro/session-context";
import { PageContainer } from "@/components/layout/page-container";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { getRarityMeta } from "@/lib/rarity";
import type { HomeDataResponse } from "@/lib/types/api";

const WEEKDAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;
const WEEK_DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;

// TODO: TASK-30/31 연동 후 실데이터로 교체
const WEEKLY_PLACEHOLDER = {
  pomodoroCount: 0,
  focusTime: "0h 00m",
  streakDays: 0,
  earnedPoints: 0,
  bars: [0, 0, 0, 0, 0, 0, 0] as number[],
};

type HomeClientProps = {
  data: HomeDataResponse | null;
};

export function HomeClient({ data }: HomeClientProps) {
  const { isSessionActive, enterSession } = usePomodoroSession();
  const [onboarded, setOnboarded] = useState(data?.onboardingCompleted ?? true);

  const now = new Date();
  const ampm = now.getHours() < 12 ? "오전" : "오후";
  const eyebrow = `${WEEKDAYS[now.getDay()]} · ${ampm}`;
  const today = now.getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  const character = data?.mainCharacter ?? null;
  const rarity = character ? getRarityMeta(character.rarity) : null;

  if (data && !onboarded && character) {
    return (
      <OnboardingFlow
        starter={{ slug: character.slug, name: character.name, rarity: character.rarity }}
        onDone={() => setOnboarded(true)}
      />
    );
  }

  if (isSessionActive) {
    return (
      <main className="relative z-10 flex flex-1 flex-col py-5">
        <PageContainer width="narrow" className="flex flex-col">
          <PomodoroTimer />
        </PageContainer>
      </main>
    );
  }

  return (
    <main className="relative z-10 flex flex-1 flex-col bg-grid py-6">
      <PageContainer width="narrow" className="flex flex-col">
        {/* 인사 */}
        <p className="mb-2 font-pixel text-[11px] tracking-[1.5px] text-primary">{eyebrow}</p>
        <h1 className="mb-5 text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
          오늘도 한 판,
          <br />
          집중해볼까요?
        </h1>

        {/* 버디 허브 */}
        <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-md)]">
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[10px] tracking-[1.5px] text-muted-foreground">MY BUDDY</span>
            {rarity && (
              <span
                className="font-pixel rounded-full border px-2.5 py-1 text-[9px] tracking-[1px]"
                style={{ color: rarity.accent, borderColor: rarity.accent, backgroundColor: `${rarity.accent}14` }}
              >
                {rarity.label}
              </span>
            )}
          </div>

          <div className="relative flex h-52 items-center justify-center">
            <div
              className="absolute h-56 w-56 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(224,177,94,.26), rgba(224,177,94,0) 62%)" }}
            />
            <span className="animate-sparkle-pulse absolute left-12 top-8 text-sm text-gold">✦</span>
            <span className="animate-sparkle-pulse absolute right-14 top-14 text-xs text-primary" style={{ animationDelay: ".4s" }}>
              ✦
            </span>
            {character ? (
              <Image
                src={`/characters/${character.slug}.png`}
                alt={character.name}
                width={144}
                height={144}
                unoptimized
                priority
                className="pixelated animate-buddy-bob"
              />
            ) : (
              <Image src="/icons/egg-smooth.png" alt="알" width={120} height={120} unoptimized className="pixelated animate-buddy-bob" />
            )}
          </div>

          <div className="text-center">
            <p className="text-xl font-extrabold text-foreground">{character?.name ?? "아직 친구가 없어요"}</p>
            <div className="mt-2 flex justify-center gap-1.5">
              {character && (
                <span className="font-mono rounded-full border border-border px-3 py-1 text-xs font-semibold text-text-secondary">
                  Lv. {character.level}
                </span>
              )}
              <span
                className="rounded-full px-3 py-1 text-xs font-bold text-primary-foreground"
                style={{ background: "var(--primary-gradient)" }}
              >
                집중의 동반자
              </span>
            </div>
          </div>
        </section>

        {/* CTA */}
        <button
          type="button"
          onClick={enterSession}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] py-4 text-base font-bold text-primary-foreground shadow-[0_8px_20px_rgba(212,149,106,.4)] transition-transform hover:scale-[1.01]"
          style={{ background: "var(--primary-gradient)" }}
        >
          <span className="text-xs">▶</span> 집중 시작
        </button>
        <p className="font-mono mt-2 text-center text-[11px] text-muted-foreground">25분 집중 · 4사이클 예정</p>

        {/* 이번 주 */}
        <section className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow)]">
          <p className="font-pixel mb-4 text-[10px] tracking-[1.5px] text-muted-foreground">THIS WEEK</p>
          <div className="grid grid-cols-2 gap-4">
            <Stat value={String(WEEKLY_PLACEHOLDER.pomodoroCount)} label="완료한 포모도로" color="var(--focus)" />
            <Stat value={WEEKLY_PLACEHOLDER.focusTime} label="총 집중 시간" />
            <Stat value={String(WEEKLY_PLACEHOLDER.streakDays)} label="연속 집중일" color="var(--break)" />
            <Stat value={`+${WEEKLY_PLACEHOLDER.earnedPoints}`} label="획득 포인트" color="var(--gold)" />
          </div>
          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-3 text-xs font-semibold text-text-secondary">일별 완료 포모도로</p>
            <div className="flex h-16 items-end gap-1.5">
              {WEEKLY_PLACEHOLDER.bars.map((height, i) => (
                <div
                  key={WEEK_DAYS[i]}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${Math.max(height, 5)}%`,
                    background: i === todayIndex ? "var(--primary)" : "color-mix(in srgb, var(--primary) 22%, transparent)",
                    opacity: height === 0 ? 0.5 : 1,
                  }}
                />
              ))}
            </div>
            <div className="mt-1.5 flex gap-1.5">
              {WEEK_DAYS.map((d, i) => (
                <span
                  key={d}
                  className="font-mono flex-1 text-center text-[10px]"
                  style={{ color: i === todayIndex ? "var(--primary)" : "var(--muted-foreground)", fontWeight: i === todayIndex ? 700 : 400 }}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div>
      <p className="font-mono text-2xl font-semibold leading-none" style={color ? { color } : undefined}>
        {value}
      </p>
      <p className="mt-1.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
