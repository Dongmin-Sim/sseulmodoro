// 새 카드 매니페스트 — 단일 출처(SSOT).
// 생성기(tools/bird-card-gen)가 sprite를 만들고, 앱(홈·가챠·도감)이 slug로 자산을 매핑한다.
// DB character_types('모또'→'새') 시드 교체는 후속(TASK-76)에서 이 매니페스트를 근거로 진행한다.

export type BirdFamily =
  | "songbird" // 명금류: 작은 머리 + 둥근 몸 + 작은 부리 (참새·파랑새·비둘기)
  | "corvid" // 까마귀과: 슬림한 몸 + 긴 꼬리 + 직선 부리 (까치)
  | "raptor" // 맹금류: 큰 머리 + 귀깃 + 정면 두 눈 (부엉이)
  | "parrot" // 앵무·꿩류: hooked 부리 + 볏 옵션 + 얼굴 패치 (앵무·공작)
  | "waterfowl"; // 물새류: 수평 몸 + S넥 + 납작 부리 (오리)

export type Rarity = "common" | "rare" | "epic" | "legendary";

export type RGBA = readonly [number, number, number, number];

export type BirdPalette = {
  body: RGBA;
  head?: RGBA; // 기본 = body
  belly?: RGBA; // 배/가슴 (밝은 톤)
  wing?: RGBA; // 날개 패치 (기본 = body 음영)
  face?: RGBA; // 얼굴 패치 (앵무·부엉이)
  accent?: RGBA; // 볼·볏 포인트
  beak?: RGBA; // 부리 (기본 어두운 회색)
  foot?: RGBA; // 발 (기본 주황)
};

export type BirdDef = {
  slug: string; // 자산 파일명 = public/characters/{slug}.png
  nameKo: string;
  family: BirdFamily;
  rarity: Rarity;
  palette: BirdPalette;
  crest?: boolean; // 볏
  starter?: boolean; // 가입 시 자동부여 고정 1종
};

export const BIRDS: readonly BirdDef[] = [
  {
    slug: "bluebird",
    nameKo: "파랑새",
    family: "songbird",
    rarity: "common",
    starter: true, // 행복의 파랑새 — 시작 새
    palette: {
      body: [70, 130, 210, 255],
      head: [60, 116, 196, 255],
      belly: [226, 232, 242, 255],
      accent: [240, 160, 60, 255],
      beak: [70, 60, 55, 255],
      foot: [235, 150, 45, 255],
    },
  },
  {
    slug: "sparrow",
    nameKo: "참새",
    family: "songbird",
    rarity: "common",
    palette: {
      body: [150, 112, 72, 255],
      head: [120, 88, 56, 255],
      belly: [216, 196, 166, 255],
      accent: [95, 64, 42, 255],
      beak: [70, 60, 52, 255],
      foot: [235, 150, 45, 255],
    },
  },
  {
    slug: "pigeon",
    nameKo: "비둘기",
    family: "songbird",
    rarity: "common",
    palette: {
      body: [150, 158, 172, 255],
      head: [120, 130, 148, 255],
      belly: [206, 212, 222, 255],
      accent: [110, 150, 175, 255],
      beak: [70, 62, 62, 255],
      foot: [214, 120, 120, 255],
    },
  },
  {
    slug: "magpie",
    nameKo: "까치",
    family: "corvid",
    rarity: "rare",
    palette: {
      body: [40, 42, 52, 255],
      head: [30, 32, 42, 255],
      belly: [240, 242, 246, 255],
      wing: [236, 240, 246, 255],
      beak: [28, 28, 34, 255],
      foot: [72, 62, 56, 255],
    },
  },
  {
    slug: "owl",
    nameKo: "부엉이",
    family: "raptor",
    rarity: "rare",
    palette: {
      body: [158, 120, 80, 255],
      head: [176, 138, 96, 255],
      face: [224, 208, 178, 255],
      belly: [214, 194, 162, 255],
      beak: [210, 150, 45, 255],
      foot: [210, 150, 45, 255],
    },
  },
  {
    slug: "parrot",
    nameKo: "앵무",
    family: "parrot",
    rarity: "epic",
    palette: {
      body: [70, 170, 85, 255],
      face: [225, 75, 75, 255],
      accent: [245, 205, 70, 255],
      beak: [60, 60, 72, 255],
      foot: [235, 150, 45, 255],
    },
  },
  {
    slug: "peacock",
    nameKo: "공작",
    family: "parrot",
    rarity: "legendary",
    crest: true,
    palette: {
      body: [30, 150, 150, 255],
      head: [24, 122, 142, 255],
      belly: [58, 172, 162, 255],
      accent: [245, 205, 70, 255],
      beak: [60, 60, 72, 255],
      foot: [80, 90, 130, 255],
    },
  },
];

export const STARTER_BIRD: BirdDef =
  BIRDS.find((b) => b.starter) ?? BIRDS[0];
