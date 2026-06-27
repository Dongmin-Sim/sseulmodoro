# 쓸모도로 Design System

> 이 파일은 프로젝트의 디자인 소스 오브 트루스입니다.
> UI 구현 시 이 파일의 토큰과 패턴을 따릅니다.
> 토큰 정의는 `src/app/globals.css`(`@theme inline` + `:root`), 폰트 배선은 `src/app/layout.tsx`.

## Aesthetic

**Warm Minimal + 픽셀-게임 무드** — 따뜻한 크림 뉴트럴 위에 깨끗한 타이포그래피. 캐릭터(픽셀아트 새)가 색감의 주인공이고 UI는 배경 역할을 한다. 로고·라벨에 픽셀 폰트(Silkscreen)와 미세 그리드 텍스처로 "집중을 게임처럼"의 무드를 더한다.

**Decoration: Intentional** — 완전한 flat이 아니다. 카드에 미묘한 그림자, 버디(마스코트) 주변에 오라/스파클, 골드 포인트 액센트.

## Color Palette

토큰은 `:root`의 hex 변수이고, `@theme inline`을 통해 Tailwind 유틸로 노출된다(예: `--gold` → `bg-gold`/`text-gold`).

| Token (CSS var) | Tailwind | Hex | Usage |
|---|---|---|---|
| `--background` | `bg-background` | `#FAF7F2` | 페이지 배경(따뜻한 크림) |
| `--background-focus` | `bg-background-focus` | `#F3ECE4` | 집중 모드 배경(따뜻한 그림자) |
| `--card` | `bg-card` | `#FFFFFF` | 카드·모달 표면 |
| `--surface-2` | `bg-surface-2` | `#F3EDE6` | 보조 표면(연베이지 pill) |
| `--surface-3` | `bg-surface-3` | `#FBF6EF` | 보조 표면(밝은 톤) |
| `--foreground` | `text-foreground` | `#2D2A26` | 제목·본문(진한 브라운) |
| `--text-secondary` | `text-text-secondary` | `#6F665E` | 보조 텍스트 |
| `--muted-foreground` | `text-muted-foreground` | `#9C9590` | 흐린 텍스트·라벨 |
| `--text-faint` | `text-text-faint` | `#B8AEA3` | placeholder·가장 흐린 |
| `--primary` / `--accent` | `bg-primary` | `#D4956A` | 주요 액션·CTA(테라코타) |
| `--primary-deep` / `--focus` | `bg-primary-deep` | `#C4725C` | primary hover·집중 모드 |
| `--primary-grad-end` | — | `#C97F58` | primary 그라데이션 종점 |
| `--break` | `bg-break` | `#7BA68E` | 휴식 모드(세이지 그린) |
| `--gold` | `text-gold` | `#E0B15E` | 골드 액센트(스파클·잔액·포인트) |
| `--gold-deep` | `text-gold-deep` | `#B68A3E` | 골드 진하게(전설 라벨) |
| `--success` | `text-success` | `#A8C7A0` | 성공·완료 |
| `--destructive` | `bg-destructive` | `#D4806A` | 에러·경고 |
| `--border` | `border-border` | `#EDE8E1` | 구분선·입력 테두리 |
| `--border-warm` | `border-border-warm` | `#F0E7D9` | 따뜻한 보더(골드 톤) |

추가 유틸: `--primary-gradient` = `linear-gradient(135deg,#D4956A,#C97F58)` (CTA·로고칩).

### 모드별 색상 사용

- **집중 모드**: 배경 `--background-focus`, 타이머 링·상태 텍스트 `--focus`(=primary-deep)
- **휴식 모드**: 타이머 링·상태 텍스트 `--break`
- **기본 상태**: 액센트 `--primary`

### Rarity(등급) 색 — `src/lib/rarity.ts`

| 등급 | Label | Panel bg / ring |
|---|---|---|
| common | 일반 | `#E8EFE6` / `#C7D3C0` (세이지) |
| rare | 레어 | `#E4ECF4` / `#C2D2E0` (블루) |
| epic | 에픽 | `#ECE5F4` / `#D2C2E4` (라벤더) |
| legendary | 전설 | `#F4ECD9` / `#E2D2A8` (골드) |
| **mythic** | **신화** | 홀로그래픽 카드 프레임(`cards/mythic.png`). 패널 임시 톤 `#F1ECF6`/`#C9A8D6` |

> 등급체계는 `Rarity` 유니온(`src/lib/characters/birds.ts`)이 SSOT. 신화는 전설보다 낮은 확률의 최상위.

## Typography

폰트 3종 + 한글. CSS var는 `layout.tsx`에서 `next/font`로 배선.

| Role | Font | var / Tailwind | Size |
|------|------|---|------|
| 로고·eyebrow·대문자 마이크로 라벨 | **Silkscreen**(픽셀) | `--font-pixel` / `font-pixel` | 9–15px, letter-spacing 1–1.5px, UPPERCASE |
| Display / 제목 | Plus Jakarta Sans | `font-sans` | h1 23px(모바일)~30px(데스크톱), weight 800, letter-spacing -.4~-.5px |
| Body / Label | Plus Jakarta Sans | `font-sans` | 본문 14–16px, 라벨 11–13px(weight 500–700) |
| Timer / 숫자 / 카운트 | Geist Mono | `font-mono` | 타이머 62px, 통계·레벨·`760/800` 등 |

- **한글**: Pretendard self-host(`src/app/fonts/PretendardVariable.woff2`). 폰트 스택이 글자별로 `Plus Jakarta → Pretendard → 시스템` 선택(Plus Jakarta엔 한글 글리프 없음).
- **Silkscreen**: 한글 글리프 없음 → 픽셀 라벨은 영문/숫자(`TUESDAY · 오후`처럼 혼용 시 한글은 폴백). 로고 "쓸모도로"는 픽셀 폰트로 노출하되 폴백 한글 글리프 사용.
- **타이머 숫자**는 반드시 `font-mono`(tabular-nums).

## Spacing / Layout

- **Base unit**: 4px. 카드 내부 패딩 `p-6`(24px)~`px-8`, 카드 간 `gap-4`~`gap-6`. 밀도 comfortable.
- **데스크톱(≥ ~1024px)**: 가로 대시보드. 콘텐츠 컨테이너 **1280px**, 본문 패딩 36–52px. 좌우 2~3컬럼 grid(예: 홈 `1.32fr 1fr`).
- **모바일(< ~1024px)**: **단일 컬럼**, 콘텐츠 폭 390px 기준, 본문 패딩 18–24px. 하단 탭 nav.
- ⚠️ **모든 고정폭 컨테이너에 `box-sizing:border-box`** (패딩 포함 폭 유지 — 우측 잘림 방지).
- 카드 기반 콘텐츠, 타이머/완료/캐릭터 화면은 중앙 정렬.

### Navigation

- **데스크톱**: 상단 nav 바(로고 + 중앙 섹션 탭 `홈·도감·상점·기록` + 우측 잔액 칩·프로필).
- **모바일**: 상단은 로고/잔액 최소화, **하단 탭 nav**(홈·도감·상점·기록). 시안은 데스크톱/모바일을 별도 프레임으로 제공 → 동일 컴포넌트의 반응형 분기로 구현.

## Pixel Rendering / Texture

- 모든 캐릭터·카드·아이콘 이미지에 `.pixelated`(`image-rendering:pixelated`) — 도트 또렷하게.
- 대시보드 배경 그리드: `.bg-grid`(미세 2축 그리드, `background-size:26px`).
- 픽셀 로고칩: 14–18px 정사각 `radius 4px` + inset 그림자(도트 큐브 느낌).

## Border Radius

| Element | Radius |
|---------|--------|
| 카드 | 16–24px (`rounded-2xl`~`rounded-3xl`) |
| 버튼·인풋 | 13–14px |
| 배지·pill | `rounded-full` |
| 픽셀 로고칩 | 4px |
| 세션 dot | 50% |

## Shadows

```css
--shadow:    0 1px 3px rgba(45,42,38,0.06), 0 1px 2px rgba(45,42,38,0.04);
--shadow-md: 0 4px 6px rgba(45,42,38,0.07), 0 2px 4px rgba(45,42,38,0.04);
--shadow-cta: 0 6px 16px color-mix(in srgb, var(--accent) 38%, transparent); /* accent 연동 */
```

- 카드 `--shadow`, 타이머/인증 카드 `--shadow-md`, CTA 버튼 `--shadow-cta`(primary 바꾸면 글로우도 따라옴).
- 브라운 톤(rgba 45,42,38) — 회색 아닌 따뜻한 그림자.

## Components (`src/components/ui/`)

### Button (`button.tsx`)
- variant: `default`(primary)·`focus`·`break`·`secondary`·`outline`·`ghost`·`destructive`·`link`
- size: `default`·`xs`·`sm`·`lg`·`cta`(py-3.5 px-6 + `--shadow-cta`)·`icon*`
- 호버 `scale(1.02)` 150ms, 폰트 weight 600–700.

### Card (`card.tsx`)
- `bg-card`, `rounded-2xl`~`3xl`, `--shadow`, 내부 패딩 24px. (Header/Title/Content/Footer 컴포지션)

### Badge (`badge.tsx`)
- `rounded-full`. 비활성 `bg-surface-2`/`text-muted-foreground`, 활성 `bg-primary`/white. eyebrow 라벨은 `font-pixel`.

### Input (`input.tsx`)
- `border-[1.5px] border-input`, focus `border-primary` + ring. radius 13–14px, placeholder `text-text-faint`.

### Timer
- 원형 SVG progress(stroke 6, linecap round). 트랙 `--border`, progress 모드색(`--focus`/`--break`). 중앙 `font-mono` 62px(데스크톱)·44px(모바일).

### Card Frame (캐릭터)
- 레어리티별 프레임(`public/cards/<rarity>.png`) 위에 캐릭터를 ~19% inset / 62% 크기로 합성. mythic은 홀로그래픽 프레임.

### Session Dots / Cycle
- 사이클 흐름 `[집중→짧은휴식]×4 → 긴휴식`. 아이콘은 PNG(`tomato`·`coffee`·`tree`)로 이모지 대체.

## Motion (`globals.css`)

| 클래스 | 용도 |
|---|---|
| `.animate-buddy-bob` | 마스코트 둥실(translateY ±7px) |
| `.animate-aura-pulse` / `.animate-ring-glow` | 버디 오라·링 글로우 |
| `.animate-sparkle-pulse` | 무대 주변 앰비언트 스파클(무한) |
| `.animate-sparkle` | 가챠 NEW 1회성 파티클(`--sx/--sy/--sd` 주입) |
| `.animate-egg-*` (`bob`·`wiggle`·`jolt`·`split-top/bottom`·`light-*`) | 알 뽑기 연출 타임라인 |
| `.animate-bird-bob` | 카드 sprite 가벼운 bob |
| `.animate-marquee` | 친구 컨베이어(리스트 2회 복제 후 -50%, 모바일 duration 단축) |

- 페이지 전환 fade 200ms, 버튼 호버 scale 150ms. 그 외 minimal-functional.

## Character

- 픽셀아트 PNG(투명 배경), `.pixelated` 렌더. 카드엔 카드 프레임 합성, 홈/연출엔 standalone.
- 마스코트 = 부엉이(`owl`). 변형: `owl-grad`(학사모, 홈), `owl-helmet`(404), `owl-confused`(5xx).

## Page Structure

```
src/app/(main)/page.tsx          — 랜딩(서비스 소개) [신규]
src/app/(auth)/login·signup      — Google OAuth 중심 인증
src/app/(app)/layout.tsx         — 인증 가드 + AppShell + 반응형 nav(데스크톱 상단/모바일 하단)
src/app/(app)/home               — 홈(버디 허브 + 통계 카드)
src/app/(app)/collection         — 도감(카드 그리드 + 상세 모달)
src/app/(app)/shop               — 상점(알 뽑기 + 친구 카드)
src/app/(app)/history            — 기록(12주 히트맵 + 세션 로그)
src/app/(app)/profile            — 프로필
```

### 신규/확장 화면 (M-S-9 리디자인)
- **진입**: 랜딩(히어로·WHY POMODORO 4카드·친구 마퀴), 온보딩 3스텝.
- **포모도로 플로우**: 세션 준비 → 집중 중 → 휴식 → 완료/결과 → 중단 확인.
- **수집**: 친구 선택, 알 뽑기 연출.
- **상태/에러**: 404(안전모 부엉이+공사장), 5xx(당황 부엉이), 오프라인 배지, 알림 권한 안내, API 에러 패턴(토스트·인라인·빈 상태).

### 공통 레이아웃 컴포넌트 (`src/components/layout/`)
```
app-shell.tsx       — min-h-screen 래퍼 + 배경
top-nav / auth-header — 반응형 nav(데스크톱 상단 / 모바일 하단 탭)
page-container.tsx  — 콘텐츠 컨테이너(데스크톱 1280 / 모바일 단일컬럼)
```

## Assets

`public/` 에 픽셀아트 PNG: `characters/<slug>.png`, `cards/<rarity>.png`, `icons/*`, `items/*`. 원본은 핸드오프 번들 `desing_handoff/assets/`(git 미추적). 반입은 T2(TASK-91).
