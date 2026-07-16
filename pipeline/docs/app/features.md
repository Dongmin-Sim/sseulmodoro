# 앱 기능 · API

포모도로 서비스의 API 엔드포인트

## API

경로는 모두 `/api` 하위

| 영역   | 메서드 · 엔드포인트 | 설명                                    |
|------| --- |---------------------------------------|
| 인증   | POST `/auth/logout` | 로그아웃                                  |
| 프로필  | POST `/profile/nickname` | 닉네임 등록·변경                             |
| 포모도로 | POST `/sessions` | 포모도로 세션 시작                            |
| 포모도로 | POST `/sessions/[id]/pomodoros` | 포모도로 시작                               |
| 포모도로 | POST `/pomodoros/[id]/complete` | 포모도로 완료                               |
| 포모도로 | POST `/pomodoros/[id]/stop` | 포모도로 중단                               |
| 포모도로 | POST `/sessions/[id]/end` | 포모도로 세션 종료                            |
| 홈·이력 | GET `/home` | 홈 데이터                                 |
| 계측   | POST `/events/app-visited` | 접속 이벤트 기록 → `activity_log` (활성 유저 원천) |