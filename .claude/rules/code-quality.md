# 코드 품질

## 일반 원칙

- 시니어 개발자 오버라이드: 아키텍처에 결함이 있거나, 상태가 중복되거나, 패턴이 일관되지 않으면 — 구조적 수정을 제안하고 구현하라.
- `console.log`는 디버깅 잔류물. 커밋 전 반드시 제거 (`console.error`는 서버 에러 로깅용으로 허용).
- 단일 파일 400줄 초과 시 분리 검토

## TypeScript 규칙

- `any` 타입 사용 금지. 타입을 알 수 없는 경우 `unknown` + 타입 가드 사용
- `type` 우선 사용. 확장이 필요한 경우만 `interface` 사용
- 불변성 우선: `const` 기본, `let` 최소화. 배열/객체 변이 대신 spread (`[...arr]`, `{...obj}`) 사용

## 네이밍 컨벤션

- 함수/변수: `camelCase`
- 컴포넌트/타입/인터페이스: `PascalCase`
- 상수: `UPPER_SNAKE_CASE`
- 이벤트 핸들러: `handleXxx` 접두사
- 불리언: `isXxx`, `hasXxx`, `canXxx` 접두사

## 커밋 컨벤션

- 형식: `type(scope): 내용` (feat/fix/refactor/style/chore/docs/test)
- 제목은 50자 이내, 명령형으로 작성
- 관련 이슈가 있으면 footer에 `Closes #이슈번호`
