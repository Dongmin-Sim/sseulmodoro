// 새 카드 sprite 생성기 — 매니페스트(SSOT)를 읽어 종별 sprite PNG를 만든다.
// 실행: npm run gen:birds  (node --experimental-strip-types, 외부 의존 0)
//
// 출력
//   public/characters/{slug}.png   — 투명 배경 sprite (앱이 소비하는 정식 자산)
//   tools/bird-card-gen/preview.png — 카드 미리보기(틀+패널+새, 검수용. 텍스트는 React가 얹음)
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BIRDS, type Rarity } from "../../src/lib/characters/birds.ts";
import { renderBird } from "./families.ts";
import {
  type RGBA,
  blit,
  encodePNG,
  fillPx,
  makeGrid,
  roundRectFillPx,
  scale,
} from "./raster.ts";

const ROOT = process.cwd();
const SPRITE_SCALE = 12; // 48 도트 → 576px 정식 자산
const SPRITE_DIR = join(ROOT, "public", "characters");

// ── 1) 종별 sprite PNG ────────────────────────────────────
mkdirSync(SPRITE_DIR, { recursive: true });
for (const def of BIRDS) {
  const sprite = scale(renderBird(def), SPRITE_SCALE);
  writeFileSync(join(SPRITE_DIR, `${def.slug}.png`), encodePNG(sprite));
}

// ── 2) 카드 미리보기 시트 (검수용) ────────────────────────
const CARD = [245, 243, 236, 255] as RGBA; // 카드 바탕 (cream)
const BORDER = [60, 60, 70, 255] as RGBA;
const PANEL_TINT: Record<Rarity, RGBA> = {
  common: [225, 235, 228, 255],
  rare: [224, 232, 242, 255],
  epic: [234, 228, 242, 255],
  legendary: [244, 236, 214, 255],
};

const PREVIEW_SCALE = 7; // 48 → 336px
const BIRD_PX = 48 * PREVIEW_SCALE;
const PANEL_PAD = 22;
const PANEL = BIRD_PX + PANEL_PAD * 2;
const MARGIN = 26;
const LABEL_H = 116; // React가 이름·레어리티를 얹을 빈 영역
const CW = PANEL + MARGIN * 2;
const CH = MARGIN + PANEL + LABEL_H;

function composeCard(slug: string, rarity: Rarity): ReturnType<typeof makeGrid> {
  const card = makeGrid(CW, CH);
  fillPx(card, CARD);
  roundRectFillPx(card, 3, 3, CW - 3, CH - 3, 26, BORDER); // 외곽 라운드
  roundRectFillPx(card, 9, 9, CW - 9, CH - 9, 21, CARD); // 안쪽 → 6px 보더 링
  roundRectFillPx(card, MARGIN, MARGIN, MARGIN + PANEL, MARGIN + PANEL, 16, PANEL_TINT[rarity]); // 패널
  const sprite = scale(renderBird(BIRDS.find((b) => b.slug === slug)!), PREVIEW_SCALE);
  blit(card, sprite, MARGIN + PANEL_PAD, MARGIN + PANEL_PAD);
  return card;
}

const COLS = 4;
const ROWS = Math.ceil(BIRDS.length / COLS);
const GAP = 24;
const SW = COLS * CW + (COLS + 1) * GAP;
const SH = ROWS * CH + (ROWS + 1) * GAP;
const sheet = makeGrid(SW, SH);
fillPx(sheet, [250, 249, 245, 255]);
BIRDS.forEach((def, i) => {
  const r = Math.floor(i / COLS);
  const c = i % COLS;
  const ox = GAP + c * (CW + GAP);
  const oy = GAP + r * (CH + GAP);
  blit(sheet, composeCard(def.slug, def.rarity), ox, oy);
});
writeFileSync(join(ROOT, "tools", "bird-card-gen", "preview.png"), encodePNG(sheet));

console.log(
  `ok — sprites: ${BIRDS.map((b) => b.slug).join(", ")} → public/characters/*.png | preview: tools/bird-card-gen/preview.png`,
);
