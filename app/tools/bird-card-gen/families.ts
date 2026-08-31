// 과(family)별 실루엣 템플릿 — 같은 부위 헬퍼를 공유하되 몸/머리/꼬리/부리 형태로 과를 구분.
// 종 차이는 palette + family 조합으로 표현. 좌표는 0..1 프랙션(해상도 독립).
import type { BirdDef, BirdPalette } from "../../src/lib/characters/birds.ts";
import {
  type Grid,
  type RGBA,
  makeGrid,
  fillEllipse,
  fillPoly,
  eye,
  feet,
  outlinePass,
  shade,
} from "./raster.ts";

export const DOTS = 48;

type Resolved = {
  body: RGBA;
  head: RGBA;
  belly: RGBA;
  wing: RGBA;
  beak: RGBA;
  foot: RGBA;
  face?: RGBA;
  accent?: RGBA;
};

const lighten = (c: RGBA, n: number): RGBA => [
  Math.min(255, c[0] + n),
  Math.min(255, c[1] + n),
  Math.min(255, c[2] + n),
  255,
];

function resolve(p: BirdPalette): Resolved {
  return {
    body: p.body,
    head: p.head ?? p.body,
    belly: p.belly ?? lighten(p.body, 60),
    wing: p.wing ?? shade(p.body),
    beak: p.beak ?? [60, 60, 72, 255],
    foot: p.foot ?? [235, 150, 45, 255],
    face: p.face,
    accent: p.accent,
  };
}

type Family = (g: Grid, p: Resolved, def: BirdDef) => void;

// 명금류: 작은 머리 + 둥근 몸 + 작은 삼각 부리
const songbird: Family = (g, p) => {
  fillPoly(g, [[0.16, 0.60], [0.36, 0.52], [0.30, 0.82]], shade(p.body)); // 꼬리
  fillEllipse(g, 0.30, 0.44, 0.76, 0.92, p.body);
  fillEllipse(g, 0.44, 0.56, 0.70, 0.90, p.belly);
  fillEllipse(g, 0.30, 0.50, 0.52, 0.80, p.wing);
  fillEllipse(g, 0.42, 0.16, 0.78, 0.54, p.head);
  if (p.accent) fillEllipse(g, 0.50, 0.36, 0.62, 0.48, p.accent); // 볼
  fillPoly(g, [[0.76, 0.30], [0.92, 0.36], [0.76, 0.42]], p.beak);
  eye(g, 0.58, 0.27, 0.69, 0.40);
  feet(g, 0.50, 0.60, p.foot);
};

// 맹금류: 큰 머리 + 귀깃 + 정면 두 눈 + 얼굴판
const raptor: Family = (g, p) => {
  fillEllipse(g, 0.28, 0.50, 0.72, 0.95, p.body);
  fillEllipse(g, 0.36, 0.58, 0.64, 0.92, p.belly);
  fillPoly(g, [[0.30, 0.16], [0.22, 0.02], [0.40, 0.14]], p.head); // 귀깃 L
  fillPoly(g, [[0.70, 0.16], [0.78, 0.02], [0.60, 0.14]], p.head); // 귀깃 R
  fillEllipse(g, 0.20, 0.10, 0.80, 0.64, p.head);
  fillEllipse(g, 0.30, 0.22, 0.70, 0.60, p.face ?? p.belly); // 얼굴판
  eye(g, 0.32, 0.26, 0.49, 0.46);
  eye(g, 0.51, 0.26, 0.68, 0.46);
  fillPoly(g, [[0.46, 0.42], [0.54, 0.42], [0.50, 0.54]], p.beak);
  feet(g, 0.42, 0.53, p.foot);
};

// 물새류: 수평 몸 + S넥 + 납작 부리
const waterfowl: Family = (g, p) => {
  fillPoly(g, [[0.08, 0.56], [0.24, 0.50], [0.16, 0.70]], shade(p.body)); // 꼬리
  fillEllipse(g, 0.10, 0.52, 0.82, 0.90, p.body);
  fillEllipse(g, 0.28, 0.60, 0.66, 0.86, p.belly);
  fillEllipse(g, 0.30, 0.56, 0.60, 0.80, p.wing);
  fillEllipse(g, 0.60, 0.40, 0.82, 0.66, p.head); // 목
  fillEllipse(g, 0.62, 0.16, 0.92, 0.48, p.head); // 머리
  fillPoly(g, [[0.86, 0.26], [1.0, 0.30], [1.0, 0.40], [0.86, 0.42]], p.beak); // 납작 부리
  eye(g, 0.74, 0.24, 0.83, 0.35);
  feet(g, 0.42, 0.54, p.foot);
};

// 앵무·꿩류: 둥근 몸 + hooked 부리 + 얼굴 패치 + 볏 옵션 + 긴 꼬리
const parrot: Family = (g, p, def) => {
  fillPoly(g, [[0.28, 0.74], [0.48, 0.68], [0.42, 0.98], [0.12, 0.95]], shade(p.body)); // 긴 꼬리
  fillEllipse(g, 0.26, 0.42, 0.74, 0.92, p.body);
  fillEllipse(g, 0.30, 0.50, 0.58, 0.84, p.wing);
  fillEllipse(g, 0.42, 0.55, 0.66, 0.88, p.belly);
  fillEllipse(g, 0.30, 0.08, 0.74, 0.54, p.head);
  if (def.crest) fillPoly(g, [[0.44, 0.08], [0.52, 0.0], [0.60, 0.08]], p.accent ?? p.head); // 볏
  if (p.face) fillEllipse(g, 0.36, 0.14, 0.66, 0.50, p.face); // 얼굴 패치
  if (p.accent) fillEllipse(g, 0.40, 0.34, 0.54, 0.48, p.accent); // 볼
  fillPoly(g, [[0.64, 0.18], [0.90, 0.28], [0.88, 0.38], [0.70, 0.40], [0.64, 0.30]], p.beak); // hooked
  fillPoly(g, [[0.73, 0.37], [0.88, 0.37], [0.78, 0.48]], p.beak);
  eye(g, 0.46, 0.20, 0.58, 0.34);
  feet(g, 0.42, 0.54, p.foot);
};

// 까마귀과: 슬림한 몸 + 긴 꼬리 + 직선 뾰족 부리 (까치 = 흑백)
const corvid: Family = (g, p) => {
  fillPoly(g, [[0.48, 0.66], [0.64, 0.62], [0.84, 0.95], [0.60, 0.93]], p.body); // 긴 꼬리
  fillEllipse(g, 0.28, 0.40, 0.66, 0.88, p.body);
  fillEllipse(g, 0.40, 0.54, 0.62, 0.86, p.belly); // 가슴
  fillEllipse(g, 0.30, 0.46, 0.50, 0.78, p.wing); // 어깨 패치
  fillEllipse(g, 0.36, 0.12, 0.70, 0.52, p.head);
  fillPoly(g, [[0.68, 0.26], [0.92, 0.30], [0.68, 0.34]], p.beak); // 직선 부리
  eye(g, 0.52, 0.24, 0.62, 0.36);
  feet(g, 0.42, 0.54, p.foot);
};

const FAMILIES: Record<BirdDef["family"], Family> = {
  songbird,
  raptor,
  waterfowl,
  parrot,
  corvid,
};

// 한 종을 48×48 도트로 렌더 (외곽선까지). 스케일·프레이밍은 호출부에서.
export function renderBird(def: BirdDef): Grid {
  const g = makeGrid(DOTS, DOTS);
  FAMILIES[def.family](g, resolve(def.palette), def);
  return outlinePass(g);
}
