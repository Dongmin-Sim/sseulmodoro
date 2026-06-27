// 레어리티별 카드 패널 톤 (BirdCard·LockCard 공용). preview.png 톤 참고.
// DESIGN.md에 브랜드 토큰으로 정의돼 있지 않은 도메인 색이라 여기서 단일 관리한다.
export type RarityPanel = { bg: string; ring: string };

export const RARITY_PANEL: Record<string, RarityPanel> = {
  common: { bg: "#E8EFE6", ring: "#C7D3C0" }, // 세이지
  rare: { bg: "#E4ECF4", ring: "#C2D2E0" }, // 블루
  epic: { bg: "#ECE5F4", ring: "#D2C2E4" }, // 라벤더
  legendary: { bg: "#F4ECD9", ring: "#E2D2A8" }, // 크림·골드
  mythic: { bg: "#F1ECF6", ring: "#C9A8D6" }, // 신화 — 홀로그래픽(임시 톤). 카드 프레임은 T4(mythic.png)에서 정식화
};

// 알 수 없는 rarity는 common으로 폴백.
export function getRarityPanel(rarity: string): RarityPanel {
  return RARITY_PANEL[rarity] ?? RARITY_PANEL.common;
}
