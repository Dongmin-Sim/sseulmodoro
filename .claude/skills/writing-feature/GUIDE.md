# writing-feature — section guide

Reference when filling `TEMPLATE.md`. A feature is WHAT / why, not HOW.

- **정의** — one line: what this feature does.
- **왜 필요한가** — tie to vision / NSM / the user problem. The anti-"why did we build this?" section — skip it and the same decision gets re-litigated later.
- **사용자 시나리오** — who meets it, in what flow. 1–3 flows.
- **요구사항** — conditions to satisfy; the first input to task breakdown.
- **시스템 규칙** — the most important section. Game rules / policy / formulas (probability tables, conversions, level curves, balance checks, transaction scope). Once these are settled, implementation is mostly decided and the execution session won't stall.
- **이벤트 로깅** — which events must fire; keep consistent with the DE event catalog.
- **검증 기준** — checkboxes defining "done".
- **연결 task** — tasks broken out from this spec (IDs), accrued after breakdown.

Optional sections when needed: 데이터 스키마 영향 (new/changed tables — Supabase & BigQuery), 상호작용 규칙 (per-screen input→action), 의사결정/미정 (open forks — move settled ones to a decision file).
