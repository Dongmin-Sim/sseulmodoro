# DB 설계 원칙

- activity_log는 append-only. UPDATE/DELETE 금지.
- 포인트 잔액 변경 시 상대적 UPDATE 사용 (race condition 방지)
  예: `UPDATE users SET balance = balance + 10 WHERE id = ?`
- point_transaction에 running_balance 항상 기록
- 여러 테이블 동시 변경 시 반드시 PostgreSQL 함수(rpc)로 트랜잭션 처리
- Supabase 클라이언트로 여러 쿼리 순차 실행 금지 — 트랜잭션은 반드시 rpc 사용
- PostgreSQL 함수/ETL/dbt 모델 직접 구현 금지 — 스캐폴딩(시그니처 + TODO 주석)만 생성
