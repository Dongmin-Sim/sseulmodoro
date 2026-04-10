"use client";

import { useState } from "react";
import { CharacterBlob } from "@/components/home/character-blob";
import { BottomNav } from "@/components/home/bottom-nav";
import { PomodoroTimer } from "@/components/pomodoro/pomodoro-timer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { HomeDataResponse } from "@/lib/types/api";

const RARITY_LABEL: Record<string, string> = {
  common: "커먼",
  uncommon: "언커먼",
  rare: "레어",
  epic: "에픽",
  legendary: "레전더리",
};

type HomeClientProps = {
  data: HomeDataResponse | null;
};

export function HomeClient({ data }: HomeClientProps) {
  const [isSessionActive, setIsSessionActive] = useState(false);

  const character = data?.mainCharacter ?? null;
  const balance = data?.balance ?? 0;
  const rarityLabel = character
    ? (RARITY_LABEL[character.rarity] ?? character.rarity)
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Radial gradient overlay */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: "50%",
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(212,149,106,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-7 pt-4 pb-2">
        <span className="text-sm font-medium tracking-wide text-muted-foreground">
          쓸모도로
        </span>
        <div
          className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold"
          style={{ backdropFilter: "blur(4px)" }}
        >
          <span className="text-primary">✦</span>
          <span>{balance.toLocaleString()}</span>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-7 pb-5">
        {isSessionActive ? (
          <PomodoroTimer
            autoStart
            onReset={() => setIsSessionActive(false)}
          />
        ) : (
          <>
            {character ? (
              <>
                <CharacterBlob rarity={rarityLabel ?? undefined} className="mb-6" />
                <h1 className="mb-2.5 text-[22px] font-bold tracking-tight text-foreground">
                  {character.name}
                </h1>
                <div className="mb-52 flex gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-full px-3.5 py-1 text-xs font-semibold"
                  >
                    Lv. {character.level}
                  </Badge>
                  <Badge
                    className="rounded-full px-3.5 py-1 text-xs font-semibold text-white"
                    style={{
                      background: "linear-gradient(135deg, #D4956A, #C4725C)",
                      boxShadow: "0 2px 8px rgba(212,149,106,0.35)",
                      border: "none",
                    }}
                  >
                    {rarityLabel}
                  </Badge>
                </div>
              </>
            ) : (
              <>
                <div
                  className="mb-6 flex items-center justify-center"
                  style={{
                    width: 140,
                    height: 140,
                    background: "#EDE8E1",
                    borderRadius: "50%",
                  }}
                >
                  <span className="text-4xl">?</span>
                </div>
                <h1 className="mb-2.5 text-[22px] font-bold tracking-tight text-foreground">
                  캐릭터 없음
                </h1>
                <div className="mb-52 flex gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-full px-3.5 py-1 text-xs font-semibold text-muted-foreground"
                  >
                    뽑기로 시작하세요
                  </Badge>
                </div>
              </>
            )}

            <Button
              className="w-full rounded-[10px] py-4 text-base font-bold text-white"
              style={{
                background: "#D4956A",
                boxShadow: "0 6px 16px rgba(212,149,106,0.38)",
                border: "none",
                height: "auto",
              }}
              onClick={() => setIsSessionActive(true)}
            >
              집중 시작
            </Button>
          </>
        )}
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
