# 분해 예시

가상 예시(실제 ID 아님) — 형태만 참조한다.

입력(사용자): "사용자에게 마감 임박 알림을 보내고 싶다."

## 분해 결과

```
기능: 마감 알림
└ M-S-90 · 마감 임박 알림
    ├ TASK-901 [BE] 알림 발송 API
    └ TASK-902 [FE] 알림 설정 UI

기능: 알림 효과 지표
└ M-S-91 · 알림 반응률 (후보)
    ├ TASK-903 [DE] 알림 발송 이벤트 기록
    └ TASK-904 [DE] 반응률 mart 집계
```

## 판단 근거
- **발송(기능)** 과 **효과 지표(기능)** 를 분리 — 관심사가 다르다.
- M-S-91은 M-S-90의 발송 이벤트에 의존 → 후보(candidate)로 두고 M-S-90을 먼저.
- 발송 API(BE) · 설정 UI(FE) · 이벤트/mart(DE)로 세션을 나눔.
- `notification_sent`는 이벤트라 `writing-event`로도 정의 대상.

## 위임 순서
1. `writing-feature` × 2 (마감 알림, 알림 효과 지표)
2. `writing-milestone` × 2 (M-S-90, M-S-91)
3. `writing-task` × 4 (901~904)
4. (선택) `writing-event` (notification_sent)
