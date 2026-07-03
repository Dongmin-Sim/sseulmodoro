# Decomposition example

Fictional IDs — for shape only, not real project items.

User input: "사용자에게 마감 임박 알림을 보내고 싶다."

## Result

```
feature: 마감 알림
└ M-S-90 · 마감 임박 알림
    ├ TASK-901 [APP] 알림 발송 API
    └ TASK-902 [APP] 알림 설정 UI

feature: 알림 효과 지표
└ M-S-91 · 알림 반응률 (candidate)
    ├ TASK-903 [DE] 알림 발송 이벤트 기록
    └ TASK-904 [DE] 반응률 mart 집계
```

## Rationale
- Split delivery (feature) from effect metrics (feature) — different concerns.
- M-S-91 depends on M-S-90's events → keep it a candidate, do M-S-90 first.
- APP (send API, settings UI) vs DE (events / mart).
- `notification_sent` is an event → also a `writing-event` target.

## Dispatch order
1. `writing-feature` × 2 (마감 알림, 알림 효과 지표)
2. `writing-milestone` × 2 (M-S-90, M-S-91)
3. `writing-task` × 4 (901–904)
4. (optional) `writing-event` (notification_sent)
