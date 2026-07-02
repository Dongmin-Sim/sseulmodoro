"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BirdCard } from "@/components/character/bird-card";
import { LockCard } from "@/components/collection/lock-card";
import { setMainCharacter } from "@/lib/api/characters";
import { useToast } from "@/components/feedback/toast";
import { getRarityMeta } from "@/lib/rarity";
import { cn } from "@/lib/utils";
import type { CollectionResponse, CollectionOwnedType } from "@/lib/types/api";

const RARITY_ORDER: Record<string, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
  mythic: 4,
};

type OwnedCard = {
  typeId: number;
  instanceId: number;
  slug: string;
  name: string;
  rarity: string;
  level: number;
  description: string | null;
};

function buildCards(collection: CollectionResponse, currentMainId: number | null): OwnedCard[] {
  return collection.types
    .filter((t): t is CollectionOwnedType => t.owned)
    .map((t) => {
      const rep =
        t.instances.find((i) => i.instanceId === currentMainId) ??
        [...t.instances].sort((a, b) => b.level - a.level)[0];
      return {
        typeId: t.typeId,
        instanceId: rep.instanceId,
        slug: t.slug,
        name: t.name,
        rarity: t.rarity,
        level: rep.level,
        description: t.description,
      };
    })
    .sort((a, b) => (RARITY_ORDER[a.rarity] ?? 99) - (RARITY_ORDER[b.rarity] ?? 99) || a.typeId - b.typeId);
}

export function SelectClient({
  collection,
  currentMainId,
}: {
  collection: CollectionResponse;
  currentMainId: number | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const cards = useMemo(() => buildCards(collection, currentMainId), [collection, currentMainId]);
  const lockedRarities = useMemo(
    () =>
      collection.types
        .filter((t) => !t.owned)
        .map((t) => t.rarity)
        .sort((a, b) => (RARITY_ORDER[a] ?? 99) - (RARITY_ORDER[b] ?? 99)),
    [collection],
  );

  const initial = cards.find((c) => c.instanceId === currentMainId) ?? cards[0] ?? null;
  const [selectedId, setSelectedId] = useState<number | null>(initial?.instanceId ?? null);
  const [isSaving, setIsSaving] = useState(false);

  const selected = cards.find((c) => c.instanceId === selectedId) ?? null;
  const rarity = selected ? getRarityMeta(selected.rarity) : null;

  const handleConfirm = async () => {
    if (!selected) return;
    setIsSaving(true);
    try {
      await setMainCharacter(selected.instanceId);
      router.push("/home");
      router.refresh();
    } catch {
      toast({ title: "대표 친구를 바꾸지 못했어요", description: "잠시 후 다시 시도해 주세요." });
      setIsSaving(false);
    }
  };

  return (
    <main className="relative z-10 flex flex-1 flex-col py-6">
      <div className="mx-auto flex w-full max-w-[1000px] flex-col px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="font-pixel text-[10px] tracking-[1.5px] text-primary">PARTNER</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">함께할 친구</h1>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr] lg:items-stretch">
          {/* 선택 프리뷰 */}
          <section className="flex flex-col items-center rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-md)]">
            <span className="font-pixel self-start text-[10px] tracking-[1.5px] text-muted-foreground">SELECTED</span>
            {selected ? (
              <>
                <div className="relative my-3 flex h-52 w-full items-center justify-center">
                  <div
                    className="absolute h-56 w-56 rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(224,177,94,.24), rgba(224,177,94,0) 62%)" }}
                  />
                  <span className="animate-sparkle-pulse absolute left-12 top-6 text-sm text-gold">✦</span>
                  <span className="animate-sparkle-pulse absolute right-14 top-12 text-xs text-primary" style={{ animationDelay: ".4s" }}>
                    ✦
                  </span>
                  <BirdCard slug={selected.slug} rarity={selected.rarity} name={selected.name} size={196} animated />
                </div>
                <p className="text-xl font-extrabold text-foreground">{selected.name}</p>
                <div className="mt-2 flex justify-center gap-1.5">
                  <span className="font-mono rounded-full border border-border px-3 py-1 text-xs font-semibold text-text-secondary">
                    Lv. {selected.level}
                  </span>
                  {rarity && (
                    <span
                      className="rounded-full px-3 py-1 text-xs font-bold text-primary-foreground"
                      style={{ backgroundColor: rarity.accent }}
                    >
                      {rarity.label}
                    </span>
                  )}
                </div>
                {selected.description && (
                  <p className="mt-3.5 text-center text-[13px] leading-relaxed text-muted-foreground">
                    {selected.description}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isSaving}
                  className="mt-6 flex h-13 w-full max-w-80 items-center justify-center rounded-[14px] text-[15px] font-bold text-primary-foreground shadow-[0_8px_20px_rgba(212,149,106,.4)] transition-transform hover:scale-[1.01] disabled:opacity-60 lg:mt-auto"
                  style={{ background: "var(--primary-gradient)" }}
                >
                  {isSaving ? "바꾸는 중..." : "이 친구와 집중하기"}
                </button>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
                <p className="text-sm text-muted-foreground">아직 함께할 친구가 없어요.</p>
              </div>
            )}
          </section>

          {/* 보유 그리드 */}
          <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-md)]">
            <span className="font-pixel text-[10px] tracking-[1.5px] text-muted-foreground">
              보유한 친구 · {cards.length}
            </span>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {cards.map((card) => {
                const isSelected = card.instanceId === selectedId;
                return (
                  <button
                    key={card.instanceId}
                    type="button"
                    onClick={() => setSelectedId(card.instanceId)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl p-2.5 transition-colors",
                      isSelected
                        ? "bg-surface-3 shadow-[inset_0_0_0_2px_var(--primary),0_4px_14px_rgba(212,149,106,.18)]"
                        : "border border-border bg-card hover:bg-surface-2",
                    )}
                    aria-pressed={isSelected}
                  >
                    <BirdCard slug={card.slug} rarity={card.rarity} name={card.name} />
                    <span className="text-[13px] font-bold text-foreground">{card.name}</span>
                  </button>
                );
              })}
              {lockedRarities.map((rarity, i) => (
                <div
                  key={`locked-${i}`}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border p-2.5 opacity-70"
                >
                  <LockCard rarity={rarity} />
                  <span className="text-[13px] font-bold text-muted-foreground">???</span>
                </div>
              ))}
            </div>
            <Link
              href="/shop"
              className="mt-4 flex items-center gap-3 rounded-2xl border border-border-warm bg-surface-3 px-4 py-3 transition-colors hover:bg-surface-2"
            >
              <span className="text-lg text-gold">✦</span>
              <span className="flex-1 text-xs font-medium text-text-secondary">
                상점에서 알을 뽑아 새 친구를 만나보세요
              </span>
              <span className="whitespace-nowrap text-xs font-bold text-primary">상점 →</span>
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
