# 분해 예시

입력(사용자): "접속·세션 데이터를 계측해서 활성 유저 지표를 만들고 싶다."

## 분해 결과

```
기능: 이벤트 계측 파이프라인
└ M-S-11 · 접속·세션 이벤트 계측
    ├ TASK-85 [BE] app_visited 접속 이벤트 기록
    └ TASK-87 [DE] 세션 fact 테이블

기능: 활성 유저 지표
└ M-S-12 · 활성 유저 mart (후보)
    ├ TASK-104 [DE] 일별 활성 유저 fact
    └ TASK-105 [DE] 활성 유저 mart 집계
```

## 판단 근거
- **계측(수집)** 과 **지표(활용)** 를 다른 기능으로 분리 — 관심사가 다르다.
- M-S-12는 M-S-11의 데이터에 의존 → 후보(candidate)로 두고 M-S-11을 먼저.
- 이벤트 기록(BE) vs fact/mart(DE)로 세션을 나눔.
- `app_visited`는 이벤트라 `writing-event`로도 정의 대상.

## 위임 순서
1. `writing-feature` × 2 (이벤트 계측 파이프라인, 활성 유저 지표)
2. `writing-milestone` × 2 (M-S-11, M-S-12)
3. `writing-task` × 4 (85, 87, 104, 105)
4. (선택) `writing-event` (app_visited)
