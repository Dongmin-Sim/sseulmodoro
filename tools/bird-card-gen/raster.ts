// 픽셀 래스터 + 내장 zlib PNG 인코더 (외부 의존 0).
// 도형 프리미티브(fill*)는 0..1 프랙션 좌표 → 해상도 독립.
// 시트 합성용 픽셀 좌표 헬퍼(*Px)는 별도.
import { deflateSync } from "node:zlib";

export type RGBA = readonly [number, number, number, number];
export type Grid = { W: number; H: number; buf: Buffer };

export const OUTLINE: RGBA = [28, 28, 34, 255];
const WHITE: RGBA = [255, 255, 255, 255];
const PUPIL: RGBA = [20, 20, 24, 255];

export function makeGrid(W: number, H: number): Grid {
  return { W, H, buf: Buffer.alloc(W * H * 4) };
}

export function setPx(g: Grid, x: number, y: number, c: RGBA): void {
  x |= 0;
  y |= 0;
  if (x < 0 || y < 0 || x >= g.W || y >= g.H) return;
  const i = (y * g.W + x) * 4;
  g.buf[i] = c[0];
  g.buf[i + 1] = c[1];
  g.buf[i + 2] = c[2];
  g.buf[i + 3] = c[3];
}

const span = (frac: number, dim: number): number => frac * dim;

// ── 프랙션 좌표 도형 ──────────────────────────────────────
export function fillRect(g: Grid, x0: number, y0: number, x1: number, y1: number, c: RGBA): void {
  for (let y = Math.round(span(y0, g.H)); y < Math.round(span(y1, g.H)); y++)
    for (let x = Math.round(span(x0, g.W)); x < Math.round(span(x1, g.W)); x++) setPx(g, x, y, c);
}

export function fillEllipse(g: Grid, x0: number, y0: number, x1: number, y1: number, c: RGBA): void {
  const ax0 = span(x0, g.W), ay0 = span(y0, g.H), ax1 = span(x1, g.W), ay1 = span(y1, g.H);
  const cx = (ax0 + ax1) / 2, cy = (ay0 + ay1) / 2;
  const rx = (ax1 - ax0) / 2, ry = (ay1 - ay0) / 2;
  for (let y = Math.floor(ay0); y < Math.ceil(ay1); y++)
    for (let x = Math.floor(ax0); x < Math.ceil(ax1); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) setPx(g, x, y, c);
    }
}

export function fillPoly(g: Grid, pts: ReadonlyArray<readonly [number, number]>, c: RGBA): void {
  const P = pts.map(([fx, fy]) => [span(fx, g.W), span(fy, g.H)] as const);
  let miny = Infinity, maxy = -Infinity;
  for (const [, y] of P) {
    miny = Math.min(miny, y);
    maxy = Math.max(maxy, y);
  }
  for (let y = Math.floor(miny); y <= Math.ceil(maxy); y++) {
    const xs: number[] = [];
    for (let i = 0; i < P.length; i++) {
      const [x1, y1] = P[i];
      const [x2, y2] = P[(i + 1) % P.length];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y))
        xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) setPx(g, x, y, c);
  }
}

// ── 새 공통 부위 ──────────────────────────────────────────
export function eye(g: Grid, x0: number, y0: number, x1: number, y1: number): void {
  fillEllipse(g, x0, y0, x1, y1, WHITE);
  const w = x1 - x0, h = y1 - y0;
  fillEllipse(g, x0 + w * 0.3, y0 + h * 0.3, x1 - w * 0.2, y1 - h * 0.2, PUPIL);
}

export function feet(g: Grid, x1: number, x2: number, c: RGBA): void {
  fillRect(g, x1, 0.9, x1 + 0.05, 0.99, c);
  fillRect(g, x2, 0.9, x2 + 0.05, 0.99, c);
}

export const shade = (c: RGBA): RGBA => [
  Math.max(0, c[0] - 35),
  Math.max(0, c[1] - 35),
  Math.max(0, c[2] - 35),
  255,
];

// ── 외곽선/스케일/합성 ────────────────────────────────────
export function outlinePass(g: Grid): Grid {
  const ring = makeGrid(g.W, g.H);
  for (let y = 0; y < g.H; y++)
    for (let x = 0; x < g.W; x++) {
      if (g.buf[(y * g.W + x) * 4 + 3] !== 0) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < g.W && ny < g.H && g.buf[(ny * g.W + nx) * 4 + 3] > 0) {
          setPx(ring, x, y, OUTLINE);
          break;
        }
      }
    }
  for (let i = 0; i < g.buf.length; i += 4)
    if (g.buf[i + 3] > 0) g.buf.copy(ring.buf, i, i, i + 4);
  return ring;
}

export function scale(g: Grid, f: number): Grid {
  const W = g.W * f, H = g.H * f, out = makeGrid(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (((y / f) | 0) * g.W + ((x / f) | 0)) * 4;
      g.buf.copy(out.buf, (y * W + x) * 4, i, i + 4);
    }
  return out;
}

// 픽셀 좌표 src-over 합성 (불투명 픽셀만 덮음)
export function blit(dst: Grid, src: Grid, ox: number, oy: number): void {
  for (let y = 0; y < src.H; y++)
    for (let x = 0; x < src.W; x++) {
      const si = (y * src.W + x) * 4;
      if (src.buf[si + 3] === 0) continue;
      const dx = ox + x, dy = oy + y;
      if (dx < 0 || dy < 0 || dx >= dst.W || dy >= dst.H) continue;
      src.buf.copy(dst.buf, (dy * dst.W + dx) * 4, si, si + 4);
    }
}

// ── 시트/카드 미리보기용 픽셀 헬퍼 ────────────────────────
export function fillPx(g: Grid, c: RGBA): void {
  for (let i = 0; i < g.buf.length; i += 4) {
    g.buf[i] = c[0];
    g.buf[i + 1] = c[1];
    g.buf[i + 2] = c[2];
    g.buf[i + 3] = c[3];
  }
}

function inRoundRect(x: number, y: number, x0: number, y0: number, x1: number, y1: number, r: number): boolean {
  if (x < x0 || x >= x1 || y < y0 || y >= y1) return false;
  // 모서리 반경 r만큼 안쪽으로 클램프한 점과의 거리로 판정 (둥근 모서리 제외)
  const nx = Math.min(Math.max(x, x0 + r), x1 - 1 - r);
  const ny = Math.min(Math.max(y, y0 + r), y1 - 1 - r);
  const dx = x - nx, dy = y - ny;
  return dx * dx + dy * dy <= r * r;
}

export function roundRectFillPx(
  g: Grid, x0: number, y0: number, x1: number, y1: number, r: number, c: RGBA,
): void {
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) if (inRoundRect(x, y, x0, y0, x1, y1, r)) setPx(g, x, y, c);
}

// ── PNG 인코딩 (RGBA8, filter None) ───────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

export function encodePNG(g: Grid): Buffer {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(g.W, 0);
  ihdr.writeUInt32BE(g.H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const stride = 1 + g.W * 4;
  const raw = Buffer.alloc(g.H * stride);
  for (let y = 0; y < g.H; y++) {
    raw[y * stride] = 0; // filter None
    g.buf.copy(raw, y * stride + 1, y * g.W * 4, (y + 1) * g.W * 4);
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
