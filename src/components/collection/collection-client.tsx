"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { ContentNav } from "@/components/layout/content-nav";
import { MAIN_NAV_ITEMS } from "@/components/layout/nav-items";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BirdCard } from "@/components/character/bird-card";
import { LockCard } from "@/components/collection/lock-card";
import { logout } from "@/lib/api/logout";
import type {
  CollectionResponse,
  CollectionType,
  CollectionOwnedType,
  CollectionLockedType,
} from "@/lib/types/api";

// rarity 정렬 우선순위 (낮을수록 먼저). 같은 rarity 내에서는 종 id 오름차순.
const RARITY_ORDER: Record<string, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
};

const RARITY_LABEL: Record<string, string> = {
  common: "일반",
  rare: "레어",
  epic: "에픽",
  legendary: "전설",
};

function rarityLabel(rarity: string): string {
  return RARITY_LABEL[rarity] ?? rarity;
}

function byRarityThenId(a: CollectionType, b: CollectionType): number {
  const ra = RARITY_ORDER[a.rarity] ?? 99;
  const rb = RARITY_ORDER[b.rarity] ?? 99;
  return ra !== rb ? ra - rb : a.typeId - b.typeId;
}

export function CollectionClient({ data }: { data: CollectionResponse | null }) {
  const router = useRouter();

  // 상세 모달 — 목록에 이미 있는 종 데이터를 그대로 표시 (추가 fetch 없음).
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CollectionType | null>(null);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const openDetail = (type: CollectionType) => {
    setSelected(type);
    setOpen(true);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    // 모달을 닫으면 포커스가 트리거 카드로 복귀하며 focus ring이 남는다
    // (특히 ESC는 keyboard 조작으로 간주). 닫힌 직후 포커스를 해제해 테두리 제거.
    if (!next) {
      setTimeout(() => {
        const active = document.activeElement;
        if (active instanceof HTMLElement) active.blur();
      }, 0);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
      router.replace("/login");
    } catch {
      setLogoutError("로그아웃에 실패했습니다.");
      setIsLoggingOut(false);
    }
  };

  const logoutAction = (
    <div className="flex items-center gap-2">
      {logoutError && (
        <p role="alert" aria-live="assertive" className="text-xs text-destructive">
          {logoutError}
        </p>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground"
        onClick={handleLogout}
        disabled={isLoggingOut}
        aria-label={isLoggingOut ? "로그아웃 처리 중" : "로그아웃"}
      >
        {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
      </Button>
    </div>
  );

  const sortedTypes = data ? [...data.types].sort(byRarityThenId) : [];

  // 보유: 인스턴스 단위로 전부 표시 (같은 종 다중 보유 시 여러 장)
  const ownedCards = sortedTypes
    .filter((t): t is CollectionOwnedType => t.owned)
    .flatMap((t) => t.instances.map((inst) => ({ type: t, inst })));

  // 미보유: 종 단위 (1마리도 없는 종만)
  const lockedTypes = sortedTypes.filter(
    (t): t is CollectionLockedType => !t.owned,
  );

  // 미보유는 rarity별로 줄을 나눠 표시 (일반 → 레어 → 에픽 → 전설 순)
  const lockedByRarity = Array.from(new Set(lockedTypes.map((t) => t.rarity)))
    .sort((a, b) => (RARITY_ORDER[a] ?? 99) - (RARITY_ORDER[b] ?? 99))
    .map((rarity) => ({
      rarity,
      types: lockedTypes.filter((t) => t.rarity === rarity),
    }));

  return (
    <main className="relative z-10 flex flex-1 flex-col py-5">
      <PageContainer className="flex flex-col">
        <ContentNav items={MAIN_NAV_ITEMS} action={logoutAction} />

        {!data && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p role="alert" className="text-sm text-destructive">
              도감을 불러오지 못했습니다.
            </p>
            <Button variant="outline" size="sm" onClick={() => router.refresh()}>
              다시 시도
            </Button>
          </div>
        )}

        {data && (
          <div className="flex flex-col gap-8">
            {/* 수집 진척 */}
            <div className="flex flex-col items-center gap-1">
              <h1 className="text-lg font-bold text-foreground">도감</h1>
              <p className="text-sm text-muted-foreground">
                {data.ownedTypeCount} / {data.totalTypeCount}종 수집
              </p>
            </div>

            {/* 보유 섹션 (비어 있으면 숨김) */}
            {ownedCards.length > 0 && (
              <section className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  보유 중
                </span>
                <div className="flex flex-wrap justify-center gap-4">
                  {ownedCards.map(({ type, inst }) => (
                    <button
                      key={inst.instanceId}
                      type="button"
                      onClick={() => openDetail(type)}
                      className="flex flex-col items-center gap-2 rounded-[24px] transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label={`${type.name} 상세 보기`}
                    >
                      <BirdCard
                        slug={type.slug}
                        rarity={type.rarity}
                        name={type.name}
                        animated={false}
                      />
                      <span className="text-sm font-bold text-foreground">
                        {type.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {rarityLabel(type.rarity)} · Lv.{inst.level}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* 미보유 섹션 (비어 있으면 숨김) — rarity별로 줄 분리 */}
            {lockedTypes.length > 0 && (
              <section className="flex flex-col gap-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  아직 못 만난 친구
                </span>
                {lockedByRarity.map((group) => (
                  <div
                    key={group.rarity}
                    className="flex flex-wrap justify-start gap-4"
                  >
                    {group.types.map((type) => (
                      <button
                        key={type.typeId}
                        type="button"
                        onClick={() => openDetail(type)}
                        className="flex flex-col items-center gap-2 rounded-[24px] transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={`미보유 ${rarityLabel(type.rarity)} 종 상세 보기`}
                      >
                        <LockCard rarity={type.rarity} />
                        <span className="text-sm font-bold text-muted-foreground">
                          ???
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {rarityLabel(type.rarity)}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </section>
            )}
          </div>
        )}
      </PageContainer>

      {/* 상세 모달 — 닫기만 (카드 전환 없음) */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          {selected?.owned && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>{rarityLabel(selected.rarity)}</DialogDescription>
              </DialogHeader>
              <div className="flex justify-center py-2">
                <BirdCard
                  slug={selected.slug}
                  rarity={selected.rarity}
                  name={selected.name}
                  animated={false}
                />
              </div>
              {selected.description && (
                <p className="text-center text-sm text-muted-foreground">
                  {selected.description}
                </p>
              )}
            </>
          )}

          {selected && !selected.owned && (
            <>
              <DialogHeader>
                <DialogTitle>???</DialogTitle>
                <DialogDescription>{rarityLabel(selected.rarity)}</DialogDescription>
              </DialogHeader>
              <div className="flex justify-center py-2">
                <LockCard rarity={selected.rarity} />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                아직 만나지 못한 친구예요. 집중을 모아 만나보세요.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
