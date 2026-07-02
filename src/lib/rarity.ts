// 레어리티 런타임 메타 — 라벨·라벨색·카드 프레임. character_types.rarity(string) 기준.
export type RarityMeta = { label: string; accent: string };

export const RARITY_META: Record<string, RarityMeta> = {
  common: { label: "일반", accent: "#5E8A72" },
  rare: { label: "레어", accent: "#4376B6" },
  epic: { label: "에픽", accent: "#9C6FCB" },
  legendary: { label: "전설", accent: "#B68A3E" },
  mythic: { label: "신화", accent: "#C9A8D6" },
};

export function getRarityMeta(rarity: string): RarityMeta {
  return RARITY_META[rarity] ?? RARITY_META.common;
}

// 레어리티별 카드 프레임 (public/cards/{rarity}.png). 미정의 등급은 common 폴백.
export function getRarityCard(rarity: string): string {
  const known = RARITY_META[rarity] ? rarity : "common";
  return `/cards/${known}.png`;
}
