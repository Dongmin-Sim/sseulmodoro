from __future__ import annotations

import json

from .simulate import SimResult

_HEADER = """-- =============================================================
-- 합성 시드 (생성기 산출물 — 수정 금지, seeds/generate.py로 재생성)
-- supabase db reset 시 자동 실행 (config.toml [db.seed])
-- =============================================================
"""

_AUTH_USER = """INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, confirmation_token, recovery_token, email_change,
  email_change_token_new, email_change_token_current, phone_change,
  phone_change_token, reauthentication_token, raw_app_meta_data, raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000', '{id}', 'authenticated', 'authenticated',
  '{email}', crypt('synthetic', gen_salt('bf')), '{ts}', '{ts}', '{ts}',
  '', '', '', '', '', '', '', '',
  '{{"provider":"email","providers":["email"]}}', '{{}}'
) ON CONFLICT (id) DO NOTHING;"""


def _q(s: str) -> str:
    return s.replace("'", "''")


def emit_sql(result: SimResult) -> str:
    lines = [_HEADER, "-- 유저 (auth.users -> 트리거가 profiles 이벤트 생성)"]
    for u in result.users:
        lines.append(_AUTH_USER.format(id=u.user_id, email=_q(u.email), ts=u.created_at))

    lines.append("\n-- app_visited 이벤트")
    for e in result.events:
        meta = _q(json.dumps(e.metadata, ensure_ascii=False))
        lines.append(
            "INSERT INTO public.activity_log (user_id, event_category, event_type, metadata, created_at) "
            f"VALUES ('{e.user_id}', '{e.event_category}', '{e.event_type}', '{meta}'::jsonb, '{e.created_at}');"
        )

    lines.append("\n-- pomodoro_sessions")
    for s in result.sessions:
        lines.append(
            "INSERT INTO public.pomodoro_sessions "
            "(user_id, target_count, completed_count, focus_minutes, short_break_minutes, long_break_minutes, status, started_at) "
            f"VALUES ('{s.user_id}', {s.target_count}, {s.completed_count}, {s.focus_minutes}, "
            f"{s.short_break_minutes}, {s.long_break_minutes}, '{s.status}', '{s.started_at}');"
        )

    return "\n".join(lines) + "\n"
