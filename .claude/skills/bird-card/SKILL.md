# bird-card

새 카드 sprite를 일관된 톤·규격으로 **내부 생성**하는 절차. M-S-4 수집 자산(TASK-75). 외부 소싱·AI·Python 없이 전량 in-repo TS로 생성한다.

## 구성

- **단일 출처(SSOT)**: `src/lib/characters/birds.ts` (`BIRDS` 매니페스트) — 앱·생성기·DB시드가 공유
- **생성기**: `tools/bird-card-gen/` (raster·families·generate) — 외부 의존 0 (Node 내장 zlib + `--experimental-strip-types`)
- **출력**:
  - `public/characters/{slug}.png` — 투명 배경 sprite (앱이 소비하는 정식 자산)
  - `tools/bird-card-gen/preview.png` — 카드 미리보기(틀+패널+새, 검수용)
- **카드 크롬**(틀·이름·레어리티·레벨)은 PNG에 굽지 않고 **React가 얹는다**(TASK-76). sprite는 재사용 가능한 순수 자산으로 유지.

## 규격 (고정)

- 48×48 도트 → ×12 nearest = **576px** sprite, 투명 배경, **1px 자동 외곽선**
- 종 차이 = **family(실루엣) + palette(색)** 조합. 몸 음영은 body에서 자동 −35.

## 새 종 추가법

1. `src/lib/characters/birds.ts`의 `BIRDS`에 한 줄 추가:
   ```ts
   { slug: "robin", nameKo: "울새", family: "songbird", rarity: "common",
     palette: { body: [200, 90, 70, 255], belly: [235, 225, 210, 255], accent: [120, 70, 55, 255] } }
   ```
2. `npm run gen:birds` → `public/characters/robin.png` 생성 + 미리보기 갱신
3. `tools/bird-card-gen/preview.png`를 열어 톤 확인

## palette 키

| 키 | 의미 | 기본값 |
|---|---|---|
| `body` | 몸 (필수) | — |
| `head` | 머리 | = body |
| `belly` | 배/가슴 | body +60 |
| `wing` | 날개 패치 | body 음영 |
| `face` | 얼굴 패치(앵무·부엉이) | (없음) |
| `accent` | 볼·볏 포인트 | (없음) |
| `beak` | 부리 | 어두운 회색 |
| `foot` | 발 | 주황 |
| `crest`(bool) | 볏 | false |

## 과(family) — 실루엣 템플릿 5종

- `songbird` — 작은 머리 + 둥근 몸 + 작은 부리 (참새·파랑새·비둘기)
- `corvid` — 슬림한 몸 + 긴 꼬리 + 직선 부리 (까치)
- `raptor` — 큰 머리 + 귀깃 + 정면 두 눈 (부엉이)
- `parrot` — hooked 부리 + 볏 옵션 + 얼굴 패치 (앵무·공작)
- `waterfowl` — 수평 몸 + S넥 + 납작 부리 (오리)

**새 과 추가**: `tools/bird-card-gen/families.ts`의 `FAMILIES`에 `Family` 함수 추가 + `BirdDef["family"]`(birds.ts) 타입에 키 추가.

## 한계 / 업그레이드 경로

- 절차적 "큐트 기하학" 톤이 상한. 완성도·고유성이 더 필요하면 **sprite 소스만 교체** — 매니페스트·React 카드·DB 매핑은 그대로 둔 채 `public/characters/{slug}.png` 인터페이스만 유지하면 절차적 → CC0 에셋팩 → AI(PixelLab/Retro Diffusion)로 갈아끼울 수 있다.
