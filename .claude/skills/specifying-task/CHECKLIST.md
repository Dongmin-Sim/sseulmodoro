# Ready checklist — task refinement

Before implementing, the spec must contain the following. If any can't be confirmed against real code, don't fill it — ask the user.

- [ ] **구현 접근** — how to build it (one paragraph, grounded in real code)
- [ ] **영향 파일** — files to create/modify (`file:section`)
- [ ] **API 계약** — request/response types (from `src/lib/types/api.ts` if any)
- [ ] **엣지 케이스** — failure / boundary conditions
- [ ] **테스트** — what to verify and how (`route.test.ts` etc.)
- [ ] **완료 조건 재확인** — is the skeleton's done-condition still valid

## Spec body sections to append (written in Korean, into the spec)

```markdown
## 구현 접근
{실제 코드 기준 한 문단}

## 영향 파일
- `경로/파일.ts` — {무엇을}

## API 계약
{요청/응답 타입 or "해당 없음"}

## 엣지 케이스
- {실패·경계}

## 테스트
- {검증 항목}
```
