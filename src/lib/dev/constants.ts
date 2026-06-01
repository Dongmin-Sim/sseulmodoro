/**
 * 컴파일 타임 상수. 프로덕션 빌드에서 `false`로 치환되어
 * IS_DEV 가드 안의 코드는 dead code elimination으로 번들에서 제거됨.
 */
export const IS_DEV = process.env.NODE_ENV === "development";

/** 개발 환경 타이머 배속 선택지 (1× = 정상 속도) */
export const DEV_SPEED_OPTIONS = [1, 10, 60] as const;
