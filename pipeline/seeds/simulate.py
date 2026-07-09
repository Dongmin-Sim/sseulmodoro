from __future__ import annotations

import random
import uuid
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone

from .config import Scenario

_NS = uuid.UUID("0f9a2b8c-0000-4000-8000-0000000000ff")


@dataclass(frozen=True)
class UserRecord:
    user_id: str
    email: str
    created_at: str


@dataclass(frozen=True)
class EventRecord:
    user_id: str
    event_category: str
    event_type: str
    metadata: dict
    created_at: str


@dataclass(frozen=True)
class SessionRecord:
    user_id: str
    target_count: int
    completed_count: int
    focus_minutes: int
    short_break_minutes: int
    long_break_minutes: int
    status: str
    started_at: str


@dataclass(frozen=True)
class SimResult:
    users: list[UserRecord]
    events: list[EventRecord]
    sessions: list[SessionRecord]
    dau: dict[str, int]   # date_iso -> 활성 유저 수


def _expand_inflow(spec: dict | list[int], n: int) -> list[int]:
    if isinstance(spec, list):
        return spec
    shape, base = spec["shape"], spec["base"]
    if n == 1 or shape == "flat":
        return [base] * n
    if shape == "growth":
        return [round(base * (1 + i / (n - 1))) for i in range(n)]
    if shape == "decline":
        return [max(0, round(base * (1 - 0.8 * i / (n - 1)))) for i in range(n)]
    raise ValueError(f"unknown inflow shape: {shape}")


def _expand_mult(spec: dict | list[float] | None, n: int) -> list[float]:
    if spec is None:
        return [1.0] * n
    if isinstance(spec, list):
        return spec
    shape, base = spec["shape"], spec.get("base", 2.0)
    if n == 1 or shape == "flat":
        return [1.0] * n
    if shape == "growth":
        return [1.0 + (base - 1.0) * i / (n - 1) for i in range(n)]
    if shape == "decline":
        return [1.0 - (1.0 - 1.0 / base) * i / (n - 1) for i in range(n)]
    raise ValueError(f"unknown sessions shape: {shape}")


def _ts(d: date, rng: random.Random) -> str:
    dt = datetime(d.year, d.month, d.day, rng.randint(5, 14), rng.randint(0, 59), tzinfo=timezone.utc)
    return dt.isoformat()


def simulate(scenario: Scenario) -> SimResult:
    rng_life = random.Random(scenario.seed)       # 축1: 활동/리텐션
    rng_act = random.Random(scenario.seed + 1)    # 축2: 세션·완료·시각
    today = date.today()

    users: list[UserRecord] = []
    events: list[EventRecord] = []
    sessions: list[SessionRecord] = []
    dau: dict[str, int] = {}

    completion: dict[str, float] = {}
    is_power: dict[str, bool] = {}
    join_day: dict[str, date] = {}
    live: list[str] = []
    idx = 0

    for seg in sorted(scenario.segments, key=lambda s: s.start_date):
        start = date.fromisoformat(seg.start_date)
        end = date.fromisoformat(seg.end_date)
        n_days = (end - start).days + 1
        inflow = _expand_inflow(seg.inflow, n_days)
        sess_mult = _expand_mult(seg.activity.sessions, n_days)
        act = seg.activity
        r_active, r_decay = seg.retention["active"], seg.retention["decay"]

        for di in range(n_days):
            d = start + timedelta(days=di)
            if d > today:
                break

            for _ in range(inflow[di]):
                uidx, idx = idx, idx + 1
                uid = str(uuid.uuid5(_NS, f"{scenario.seed}:{uidx}"))
                completion[uid] = min(1.0, max(0.1, rng_act.gauss(act.completion_mean, act.completion_spread)))
                is_power[uid] = rng_act.random() < act.power_ratio
                join_day[uid] = d
                live.append(uid)
                users.append(UserRecord(uid, f"synth{uidx}@sseulmodoro.local", _ts(d, rng_act)))

            active_count = 0
            for uid in live:
                tenure = (d - join_day[uid]).days
                if tenure > 0 and rng_life.random() >= r_active * (r_decay ** tenure):
                    continue
                active_count += 1
                events.append(EventRecord(uid, "app", "app_visited", {}, _ts(d, rng_act)))
                base_n = rng_act.randint(1, 3) if is_power[uid] else rng_act.randint(0, 1)
                for _ in range(round(base_n * sess_mult[di])):
                    target = rng_act.randint(act.target_range[0], act.target_range[1])
                    completed = max(0, min(target, round(target * completion[uid])))
                    status = "completed" if completed >= target else "stopped"
                    sessions.append(SessionRecord(uid, target, completed, 25, 5, 15, status, _ts(d, rng_act)))

            dau[d.isoformat()] = active_count

    return SimResult(users, events, sessions, dau)
