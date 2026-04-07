# 쓸모도로 Design System

> 이 파일은 프로젝트의 디자인 소스 오브 트루스입니다.
> UI 구현 시 이 파일의 토큰과 패턴을 따릅니다.

## Aesthetic

**Warm Minimal** — 따뜻한 뉴트럴 톤 위에 깨끗한 타이포그래피. 캐릭터가 색감의 주인공이고 UI는 배경 역할.

**Decoration: Intentional** — 미니멀이지만 완전히 flat은 아님. 카드에 미묘한 그림자, 캐릭터 주변에 살짝 음영.

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#FAF7F2` | 페이지 배경 (따뜻한 크림) |
| `--surface` | `#FFFFFF` | 카드, 모달 배경 |
| `--text-primary` | `#2D2A26` | 제목, 본문 텍스트 (진한 브라운) |
| `--text-muted` | `#9C9590` | 보조 텍스트, 라벨 |
| `--accent` | `#D4956A` | 주요 액션, CTA 버튼 (테라코타) |
| `--focus` | `#C4725C` | 집중 모드 색상 (차분한 레드) |
| `--break` | `#7BA68E` | 휴식 모드 색상 (차분한 세이지 그린) |
| `--success` | `#A8C7A0` | 성공, 완료 |
| `--danger` | `#D4806A` | 에러, 경고 |
| `--border` | `#EDE8E1` | 구분선, 입력 필드 테두리 |

### 모드별 색상 사용

- **집중 모드**: 타이머 링 `--focus`, 상태 텍스트 `--focus`, 세션 dot `--focus`
- **휴식 모드**: 타이머 링 `--break`, 상태 텍스트 `--break`, 세션 dot `--break`
- **기본 상태**: 액센트 `--accent` 사용

## Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display / 제목 | Plus Jakarta Sans | 700 | 24-32px |
| Body | Plus Jakarta Sans | 400, 500 | 14-16px |
| Label | Plus Jakarta Sans | 500, 600 | 11-13px |
| Timer | Geist Mono | 500 | 44-48px |
| Code / Data | Geist Mono | 400 | 13-14px |

- Plus Jakarta Sans: Google Fonts에서 로드
- Geist Mono: 프로젝트에 이미 설치됨 (next/font)
- 타이머 숫자는 반드시 Geist Mono 사용 (tabular-nums)

## Spacing

- **Base unit**: 4px
- **카드 내부 패딩**: `p-6` (24px)
- **카드 간 간격**: `gap-4` (16px) 또는 `gap-6` (24px)
- **섹션 간 간격**: `gap-6` ~ `gap-8`
- **밀도**: comfortable (여백 넓직하게)

## Layout

- **모바일 퍼스트**: `max-w-sm mx-auto` (max-width: 384px)
- **카드 기반**: 주요 콘텐츠는 카드 안에 배치
- **중앙 정렬**: 타이머, 캐릭터, 완료 화면은 text-center

## Border Radius

| Element | Radius |
|---------|--------|
| 카드 | `16px` (rounded-2xl) |
| 버튼, 인풋 | `10px` (rounded-[10px]) |
| 배지 | `20px` (rounded-full) |
| 세션 dot | `50%` |

## Shadows

```css
--shadow: 0 1px 3px rgba(45,42,38,0.06), 0 1px 2px rgba(45,42,38,0.04);
--shadow-md: 0 4px 6px rgba(45,42,38,0.07), 0 2px 4px rgba(45,42,38,0.04);
```

- 카드: `--shadow`
- 타이머 카드, 인증 카드: `--shadow-md`
- 브라운 톤 그림자 (rgba 45,42,38) — 회색이 아닌 따뜻한 그림자

## Components

### Buttons

| Variant | Background | Text | Usage |
|---------|-----------|------|-------|
| Primary | `--accent` | white | 주요 CTA (시작하기, 로그인) |
| Focus | `--focus` | white | 집중 모드 액션 |
| Break | `--break` | white | 휴식 모드 액션 |
| Secondary | `--bg` | `--text-primary` | 보조 액션 (shadow 있음) |
| Outline | transparent | `--text-primary` | 비강조 액션 (border: --border) |

- 호버: `transform: scale(1.02)`, transition 150ms
- 패딩: `py-3.5 px-6` (14px 24px)
- 폰트: 600 weight, 14-15px

### Badge (선택 옵션)

- 비활성: `bg: --bg`, `text: --text-muted`, border transparent
- 활성: `bg: --accent`, `text: white`
- 호버(비활성): `border: --border`, `text: --text-primary`
- padding: `py-2 px-3.5`, border-radius: full

### Input

- border: `1.5px solid --border`
- focus: `border-color: --accent`
- padding: `py-3 px-4`
- placeholder: `--text-muted`
- border-radius: 10px

### Card

- background: `--surface`
- border-radius: 16px
- padding: 24px (`p-6`)
- shadow: `--shadow`

### Timer

- 원형 SVG 프로그레스 링 (stroke-width: 6, stroke-linecap: round)
- 트랙: `--border` 색상
- 프로그레스: 모드별 색상 (`--focus` / `--break`)
- 중앙 텍스트: Geist Mono, 44px
- 아래에 캐릭터 배치

### Session Dots

- 크기: 8px
- 완료: 모드 색상 (solid)
- 현재: 모드 색상 + `box-shadow: 0 0 0 3px rgba(color, 0.2)`
- 미완료: `--border`

## Motion

- **페이지 전환**: fade in, 200ms ease
- **버튼 호버**: scale(1.02), 150ms ease
- **캐릭터 성장/레벨업**: 표현적 애니메이션 (bounce, scale up)
- **그 외**: minimal-functional. 불필요한 애니메이션 없음.

## Character

- 기본 캐릭터: 베이지 (`#E8D5C0`) 블롭 형태
- 둥근 형태 (border-radius 변형으로 유기적 shape)
- 최소한의 이목구비 (눈 2개만, 6px 원형)
- 그림자: `0 2px 8px rgba(210,170,130,0.3)` (따뜻한 톤)
- 타이머 아래 중앙 배치

## Page Structure

```
src/app/(auth)/login/page.tsx      — 로그인
src/app/(auth)/signup/page.tsx     — 회원가입
src/app/(main)/page.tsx            — 홈 (타이머 + 캐릭터)
src/app/(main)/collection/         — 도감
src/app/(main)/shop/               — 상점 (띌기)
src/app/(main)/history/            — 기록 돌아보기
```

## Preview

디자인 프리뷰: `~/.gstack/projects/Dongmin-Sim-sseulmodoro/designs/design-system-20260407/preview.html`
