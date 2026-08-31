"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BirdCard } from "@/components/character/bird-card";
import { LockCard } from "@/components/collection/lock-card";
import { setMainCharacter } from "@/lib/api/characters";
import { getRarityMeta } from "@/lib/rarity";
import { cn } from "@/lib/utils";
import type {
  CollectionResponse,
  CollectionType,
  CollectionOwnedType,
  CollectionLockedType,
} from "@/lib/types/api";

const RARITY_ORDER: Record<string, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
  mythic: 4,
};

function byRarityThenId(a: CollectionType, b: CollectionType): number {
  const ra = RARITY_ORDER[a.rarity] ?? 99;
  const rb = RARITY_ORDER[b.rarity] ?? 99;
  return ra !== rb ? ra - rb : a.typeId - b.typeId;
}

type Selected =
  | { kind: "owned"; type: CollectionOwnedType; instanceId: number; level: number }
  | { kind: "locked"; type: CollectionLockedType }
  | null;

export function CollectionClient({ data }: { data: CollectionResponse | null }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Selected>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!data) {
    return (
      <main className="relative z-10 flex flex-1 flex-col py-6">
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p role="alert" className="text-sm text-destructive">도감을 불러오지 못했어요.</p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-surface-2"
          >
            다시 시도
          </button>
        </div>
      </main>
    );
  }

  const sorted = [...data.types].sort(byRarityThenId);
  const ownedCards = sorted
    .filter((t): t is CollectionOwnedType => t.owned)
    .flatMap((t) => t.instances.map((inst) => ({ type: t, inst })));
  const lockedTypes = sorted.filter((t): t is CollectionLockedType => !t.owned);

  const handleFocusWith = async (instanceId: number) => {
    setIsSaving(true);
    try {
      await setMainCharacter(instanceId);
      router.push("/home");
      router.refresh();
    } catch {
      setIsSaving(false);
    }
  };

  const selectedRarity = selected ? getRarityMeta(selected.type.rarity) : null;

  return (
    <main className="relative z-10 flex flex-1 flex-col bg-grid py-6">
      <div className="mx-auto w-full max-w-[1000px] px-4">
        {/* 헤더 + 진척 */}
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-pixel text-[11px] tracking-[1.5px] text-primary">COLLECTION</p>
            <h1 className="mt-2 text-[26px] font-extrabold tracking-tight text-foreground">새 친구 도감</h1>
          </div>
          <div className="flex-1 sm:max-w-xs">
            <p className="font-mono mb-2 text-right text-sm font-semibold">
              <span className="text-primary">{data.ownedTypeCount}</span>
              <span className="text-muted-foreground"> / {data.totalTypeCount}종 수집</span>
            </p>
            <div className="flex gap-1.5">
              {Array.from({ length: data.totalTypeCount }).map((_, i) => (
                <div
                  key={i}
                  className="h-2 flex-1 rounded-full"
                  style={{ background: i < data.ownedTypeCount ? "var(--primary)" : "var(--border)" }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 보유 중 */}
        {ownedCards.length > 0 && (
          <>
            <p className="font-pixel mb-4 text-[10px] tracking-[1.5px] text-muted-foreground">
              보유 중 · {ownedCards.length}
            </p>
            <div className="mb-9 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {ownedCards.map(({ type, inst }) => (
                <CardTile
                  key={inst.instanceId}
                  onClick={() => setSelected({ kind: "owned", type, instanceId: inst.instanceId, level: inst.level })}
                >
                  <BirdCard slug={type.slug} rarity={type.rarity} name={type.name} />
                  <p className="text-sm font-bold text-foreground">{type.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {getRarityMeta(type.rarity).label} · Lv.{inst.level}
                  </p>
                </CardTile>
              ))}
            </div>
          </>
        )}

        {/* 아직 못 만난 친구 */}
        {lockedTypes.length > 0 && (
          <>
            <p className="font-pixel mb-4 text-[10px] tracking-[1.5px] text-muted-foreground">
              아직 못 만난 친구 · {lockedTypes.length}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {lockedTypes.map((type) => (
                <CardTile key={type.typeId} onClick={() => setSelected({ kind: "locked", type })}>
                  <LockCard rarity={type.rarity} />
                  <p className="text-sm font-bold text-muted-foreground">???</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{getRarityMeta(type.rarity).label}</p>
                </CardTile>
              ))}
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-warm bg-card/40 p-4 text-center">
                <span className="text-2xl text-gold">✦</span>
                <p className="text-xs font-semibold leading-snug text-muted-foreground">
                  집중을 모아
                  <br />
                  새 친구를 만나요
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 상세 모달 */}
      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent showCloseButton className="max-w-sm rounded-3xl p-7 text-center ring-0">
          {selected && (
            <div className="flex flex-col items-center">
              <div className="my-1">
                {selected.kind === "owned" ? (
                  <BirdCard slug={selected.type.slug} rarity={selected.type.rarity} name={selected.type.name} size={180} animated />
                ) : (
                  <LockCard rarity={selected.type.rarity} size={180} />
                )}
              </div>
              <DialogTitle className="mt-3 text-2xl font-extrabold text-foreground">
                {selected.kind === "owned" ? selected.type.name : "???"}
              </DialogTitle>
              <p
                className="font-pixel mt-2 text-[10px] tracking-[1px]"
                style={{ color: selectedRarity?.accent }}
              >
                {selectedRarity?.label}
              </p>

              {selected.kind === "owned" ? (
                <>
                  {selected.type.description && (
                    <DialogDescription className="mt-3.5 text-[13px] leading-relaxed text-text-secondary">
                      {selected.type.description}
                    </DialogDescription>
                  )}
                  <div className="mt-5 w-full rounded-2xl border border-border-warm bg-surface-3 py-3.5 text-center">
                    <p className="font-mono text-xl font-semibold leading-none text-focus">Lv.{selected.level}</p>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">친밀도</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFocusWith(selected.instanceId)}
                    disabled={isSaving}
                    className="mt-5 h-12 w-full rounded-[14px] text-[15px] font-bold text-primary-foreground shadow-[0_8px_20px_rgba(212,149,106,.4)] transition-transform hover:scale-[1.01] disabled:opacity-60"
                    style={{ background: "var(--primary-gradient)" }}
                  >
                    {isSaving ? "바꾸는 중..." : "이 친구와 집중하기"}
                  </button>
                </>
              ) : (
                <>
                  <DialogDescription className="mt-3.5 text-[13px] leading-relaxed text-text-secondary">
                    아직 만나지 못한 친구예요. 집중을 모아 만나보세요.
                  </DialogDescription>
                  <button
                    type="button"
                    onClick={() => router.push("/shop")}
                    className="mt-5 h-12 w-full rounded-[14px] border border-border bg-card text-[15px] font-semibold text-text-secondary transition-colors hover:bg-surface-2"
                  >
                    상점에서 알 뽑기
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function CardTile({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card p-3.5 shadow-[var(--shadow)] transition-all",
        "hover:-translate-y-1 hover:shadow-[var(--shadow-md)] focus:outline-none",
      )}
    >
      {children}
    </button>
  );
}
