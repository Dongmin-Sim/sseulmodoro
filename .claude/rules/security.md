# 보안 규칙

## 환경변수 관리

- `NEXT_PUBLIC_` 접두사: 퍼블릭 키(anon key, URL)에만 사용. 시크릿 키 절대 금지
- 서버 전용 변수(`SUPABASE_SERVICE_ROLE_KEY` 등)는 API Route/서버 컴포넌트에서만 접근
- `.env.local` 커밋 금지. 시크릿은 Vercel 환경변수 또는 GitHub Secrets에 보관
- 하드코딩된 API 키, user_id, 시크릿 금지 — 항상 환경변수 사용

## 인증 경계

- 모든 API Route 첫 번째 작업: `getAuthUser()` 호출 + `user` null 체크
- null 체크 전 다른 로직 실행 금지

```typescript
// 올바른 패턴
const user = await getAuthUser();
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
// 이후 로직
```

- 클라이언트에서 전달된 `user_id` 파라미터 신뢰 금지 — 항상 서버 세션의 `user.id` 사용

## RLS 의존 금지

- API Route에서 직접 권한 검증 필수 (소유권 확인: `session.user_id === user.id`)
- RLS는 2차 방어선. API Route 검증을 생략하는 구실로 사용 금지

## 응답 정보 최소화

- 에러 응답에 스택 트레이스, SQL 에러 메시지, 내부 구조 노출 금지
- 서버 에러는 `{ error: "Internal server error" }` 로 통일, 상세는 `console.error`로만 기록

```typescript
// 올바른 패턴
if (error) {
  console.error("rpc error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

## 입력 검증

- `request.json()` 이후 필수 필드 존재 여부 검증 후 사용
- 타입 assertion(`as XxxRequest`) 전 런타임 검증 선행

```typescript
const body = await request.json();
if (!body.session_id) {
  return NextResponse.json({ error: "session_id is required" }, { status: 400 });
}
```
