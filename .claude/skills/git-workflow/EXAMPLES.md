# git-workflow examples

Concrete good examples per case. Korean, because the outputs (branches, commits, PR bodies) are written in Korean.

## Contents
- 브랜치 이름
- 커밋 메시지
- PR 제목
- PR 본문 (작성 예)
- 요약식 Before / After

## 브랜치 이름
동기화된 `dev`에서, 영어 슬러그만:
- 기능: `feature/TASK-51-etl-load`
- 버그: `fix/ISSUE-5-logout-warning-restore`

## 커밋 메시지
`type(scope): 내용` · 제목 50자 이내 · 명령형 · 푸터 없음:
- `feat(auth): 이메일 로그인 라우트 추가`
- `fix(pomodoro): 백그라운드 탭 완료 미발생 결함 수정`
- `refactor(harness): pr-writer→git-workflow 응집`

나쁨:
- `로그인 관련 여러가지 수정했습니다` (설명체·비명령형·scope 없음)
- 본문 끝 `Co-Authored-By: Claude ...` / `Generated with Claude Code` (금지)

## PR 제목
- `[TASK-21] 캐릭터 뽑기 DB/API 구현`
- `[ISSUE-5] 로그아웃 경고 복원`

## PR 본문 (작성 예)
결함 PR — 증상·원인 1줄씩, 개조식:

```
## Summary
- 백그라운드 탭에서 세션 완료가 뜨지 않던 결함 수정
- 원인: 탭 비활성 시 rAF 정지 → 완료 트리거 미발화

## 작업 내용
- 완료 트리거를 setTimeout 기반으로 전환
- 복귀 시 경과시간 보정 로직 추가

## 선행 PR
없음

## 관련 태스크
ISSUE-12

## 후속 작업
- 여러 탭 동시 실행 시 중복 알림 억제 (별도 이슈)

## Test plan
- [ ] build / lint / test
- [ ] 백그라운드 탭 전환 후 완료 알림 확인
```

## 요약식 Before / After
나쁨 (구현 디테일 나열):
```
- notify.ts(신규): 알림 유틸 분리 — OS 알림(requireInteraction·라운드별 tag·아이콘),
  페이지 내 사운드(파일 우선 → Web Audio 비프 폴백), 백그라운드 시 탭 제목 깜박임 +
  소리 5초 반복(복귀 시 정지, 2분 캡)
```
좋음 (요약 — What·Why만, How는 코드가):
```
- notify.ts(신규): 백그라운드 완료 알림 분리 — 소리·탭 제목 깜박임·OS 알림
```
