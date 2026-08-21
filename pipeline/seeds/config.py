from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Activity:
    power_ratio: float = 0.2
    target_range: tuple[int, int] = (1, 4)
    completion_mean: float = 0.7
    completion_spread: float = 0.15
    sessions: dict | list[float] | None = None   # 활동일당 세션수 트렌드 (없으면 상수)


@dataclass(frozen=True)
class Segment:
    start_date: str
    end_date: str
    inflow: dict | list[int]        # 일 신규 유입
    retention: dict                 # 일간 활동 {active, decay} — active * decay**tenure
    activity: Activity


@dataclass(frozen=True)
class Scenario:
    seed: int
    segments: list[Segment]


DAILY_PRESETS: dict[str, dict] = {
    "growth":       {"inflow": {"shape": "growth",  "base": 2}, "retention": {"active": 0.35, "decay": 0.97}},
    "leaky-bucket": {"inflow": {"shape": "growth",  "base": 2}, "retention": {"active": 0.35, "decay": 0.88}},
    "plateau":      {"inflow": {"shape": "flat",    "base": 2}, "retention": {"active": 0.35, "decay": 0.97}},
    "decline":      {"inflow": {"shape": "decline", "base": 3}, "retention": {"active": 0.30, "decay": 0.94}},
}


def _activity(a: dict) -> Activity:
    comp = a.get("completion", {})
    return Activity(
        power_ratio=a.get("power_ratio", 0.2),
        target_range=tuple(a.get("target_range", (1, 4))),
        completion_mean=comp.get("mean", 0.7),
        completion_spread=comp.get("spread", 0.15),
        sessions=a.get("sessions"),
    )


def _segment(s: dict) -> Segment:
    users = s.get("users", {})
    preset = DAILY_PRESETS.get(users.get("preset", ""), {})
    inflow = users.get("inflow", preset.get("inflow"))
    retention = users.get("retention", preset.get("retention"))
    if inflow is None or retention is None:
        raise ValueError("users.inflow·retention은 preset 또는 명시값으로 지정해야 함")
    return Segment(
        start_date=s["start_date"],
        end_date=s["end_date"],
        inflow=inflow,
        retention=retention,
        activity=_activity(s.get("activity", {})),
    )


def load_scenario(path: str | Path) -> Scenario:
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    segments = [_segment(s) for s in raw.get("segments", [])]
    if not segments:
        raise ValueError("segments가 비어 있음 — 최소 1개 구간 필요")
    return Scenario(seed=raw["seed"], segments=segments)
