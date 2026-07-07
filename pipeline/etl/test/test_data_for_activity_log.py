"""
NSM transform 검증용 테스트 데이터 (known-answer fixture).

raw.activity_log를 이 fixture로 WRITE_TRUNCATE 교체 → TASK-54 transform 실행 →
fact/mart 결과가 아래 기대값과 일치하는지 대조 (TASK-55).
※ 적재 후 extract.py(Supabase full refresh) 재실행 금지 — 덮어써짐.

[입력 이벤트] created_at UTC 05시~ (< 15시 → KST 같은 날)
  Week 1 (2026-05-04 월 ~ 05-10)
    alice    05-04  pomodoro_completed x 3     # A: 하루 여러 건
    alice    05-05  pomodoro_completed x 2     # B: 주 내 여러 날
    bob      05-06  pomodoro_completed x 4
    charlie  05-07  pomodoro_completed x 3     # C: 한 주에 3명
  Week 2 (2026-05-11 월 ~ 05-17)
    alice    05-11  pomodoro_completed x 6
    dave     05-13  pomodoro_completed x 4     # F: dave week2만 / charlie·bob week1만
  필터 제외 (E) — completed 아님 → fact 진입 X
    alice    05-04  pomodoro_started x 1
    alice    05-04  session_started  x 1


[기대 fact] raw→fact, completed만 user day 집계 — 6행
    alice    2026-05-04  3
    alice    2026-05-05  2
    bob      2026-05-06  4
    charlie  2026-05-07  3
    alice    2026-05-11  6
    dave     2026-05-13  4

[기대 mart] fact→mart, 주별 NSM
    week_kst     nsm   total_completions   active_user_count
    2026-05-04   4.0   12                  3     # (alice 5 + bob 4 + charlie 3) / 3
    2026-05-11   5.0   10                  2     # (alice 6 + dave 4) / 2
"""

import os

from google.cloud import bigquery
from utils.gcp import get_bigquery_client
from utils.env import load_env
from utils.logger import get_logger

load_env()
logger = get_logger(__name__)


def _completed(start_id, user, date, n):
    """user가 date에 pomodoro_completed n건 (UTC 05시~, KST 같은 날 안전)"""
    return [
        {
            "id": start_id + i,
            "user_id": user,
            "event_category": "pomodoro",
            "event_type": "pomodoro_completed",
            "metadata": {"session_id": start_id + i, "pomodoro_id": start_id + i},
            "created_at": f"{date}T{5 + i:02d}:00:00+00:00",
        }
        for i in range(n)
    ]


TEST_RECORDS = [
    # Week 1 (2026-05-04 ~ 05-10)
    *_completed(1, "alice", "2026-05-04", 3),     # A: 하루 여러 건
    *_completed(4, "alice", "2026-05-05", 2),     # B: 주 내 여러 날
    *_completed(6, "bob", "2026-05-06", 4),
    *_completed(10, "charlie", "2026-05-07", 3),  # C: 한 주에 3명
    # Week 2 (2026-05-11 ~ 05-17)
    *_completed(13, "alice", "2026-05-11", 6),
    *_completed(19, "dave", "2026-05-13", 4),     # F: dave week2만
    # 필터 제외 검증 (E) — completed 아님
    {"id": 23, "user_id": "alice", "event_category": "pomodoro",
     "event_type": "pomodoro_started", "metadata": {}, "created_at": "2026-05-04T05:00:00+00:00"},
    {"id": 24, "user_id": "alice", "event_category": "session",
     "event_type": "session_started", "metadata": {}, "created_at": "2026-05-04T05:00:00+00:00"},
    {"id": 25, "user_id": "bob", "event_category": "pomodoro",
     "event_type": "pomodoro_stopped", "metadata": {}, "created_at": "2026-05-06T05:00:00+00:00"},
]


def load_test_data():
    bq_project = os.getenv("BQ_PROJECT")
    client = get_bigquery_client(bq_project)
    project_id = f'{client.project}'

    table_id = f'{project_id}.raw.activity_log'
    job_config = bigquery.LoadJobConfig(write_disposition='WRITE_TRUNCATE')
    load_job = client.load_table_from_json(TEST_RECORDS, table_id, job_config=job_config)
    load_job.result()
    logger.info(f"loaded {load_job.output_rows} rows into {table_id}")


if __name__ == '__main__':
    load_test_data()
