---
paths:
  - "app/supabase/migrations/**"
  - "app/src/app/api/**"
---

# DB 설계 원칙

- activity_log는 append-only. UPDATE/DELETE 금지.
- 포인트 잔액 변경 시 상대적 UPDATE 사용 (race condition 방지)
  예: `UPDATE users SET balance = balance + 10 WHERE id = ?`
- point_transaction에 running_balance 항상 기록
- 여러 테이블 동시 변경 시 반드시 PostgreSQL 함수(rpc)로 트랜잭션 처리
- Supabase 클라이언트로 여러 쿼리 순차 실행 금지 — 트랜잭션은 반드시 rpc 사용
- PostgreSQL 함수/ETL/dbt 모델 직접 구현 금지 — 스캐폴딩(시그니처 + TODO 주석)만 생성

## 마이그레이션 규율

- 파일명은 타임스탬프 `YYYYMMDDHHmmss_설명.sql` (기존 `001`~`011`은 그대로 둔다)
- 적용된 파일은 수정하지 않는다. 변경은 새 파일로 추가한다
- 되돌리지 않는다. 잘못된 마이그레이션은 새 파일을 얹어 고친다

## expand/contract

롤백은 코드만 되돌리므로, 새 스키마 위에서 구버전 코드가 동작해야 한다.

- 컬럼 추가는 `NULL` 허용이거나 `DEFAULT`를 가진다
- 컬럼 삭제와 이름 변경은 두 릴리스로 나눈다 — 새 컬럼을 추가해 양쪽에 쓰고, 다음 릴리스에서 구 컬럼을 삭제한다
- rpc 시그니처 변경도 같다 — 새 이름으로 추가하고 다음 릴리스에서 구 버전을 삭제한다
- 위 규칙 위반은 `app-ci`의 squawk가 잡는다. contract 단계에서 의도적으로 어길 때만 표시해 통과시킨다
