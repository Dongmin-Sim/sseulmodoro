from __future__ import annotations

import argparse
from pathlib import Path

from .config import load_scenario
from .emit import emit_sql
from .simulate import simulate

DEFAULT_OUT = Path(__file__).resolve().parents[2] / "supabase" / "seeds" / "synthetic.sql"


def main() -> None:
    parser = argparse.ArgumentParser(description="합성 데이터 시드 생성기 → supabase/seeds/synthetic.sql")
    parser.add_argument("--scenario", required=True, help="시나리오 JSON 경로")
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="출력 SQL 경로")
    args = parser.parse_args()

    scenario = load_scenario(args.scenario)
    result = simulate(scenario)
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(emit_sql(result), encoding="utf-8")

    print(f"users={len(result.users)} events={len(result.events)} sessions={len(result.sessions)}")
    days = sorted(result.dau)
    if days:
        vals = [result.dau[d] for d in days]
        print(f"days={len(days)} ({days[0]}~{days[-1]}) DAU {min(vals)}~{max(vals)}")
    print(f"→ {out}")


if __name__ == "__main__":
    main()
