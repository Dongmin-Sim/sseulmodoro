/**
 * 컴파일 타임 상수. 프로덕션 빌드에서 `false`로 치환되어
 * IS_DEV 가드 안의 코드는 dead code elimination으로 번들에서 제거됨.
 */
export const IS_DEV = process.env.NODE_ENV === "development";

/** 개발 환경 전용 테스트 시간 옵션 (분 단위) */
export const DEV_DURATION_OPTIONS = [
  { minutes: 3 / 60, label: "3초" },
  { minutes: 30 / 60, label: "30초" },
  { minutes: 1, label: "1분" },
] as const;

/** 개발 환경 전용 휴식 테스트 옵션 (분 단위) */
export const DEV_BREAK_OPTION = { minutes: 3 / 60, label: "3초" } as const;
