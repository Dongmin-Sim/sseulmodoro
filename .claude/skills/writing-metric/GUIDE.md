# writing-metric — section guide

Reference when filling `TEMPLATE.md`. The DE planning artifact, not the pipeline implementation. Write as a document, declaratively — no section-explanation asides, no work-log, no unsettled items.

Key distinction: **data grain = fact design (atomic unit)**; **derivation = fact → mart transform**. Different layers — don't mix them.

- **한눈 요약** — one sentence: what this measures and how it moves NSM.
- **정의** — one sentence + the formula (LaTeX `$$…$$`).
- **목적** — why the metric exists — which part of NSM it explains; how to read a rise/fall; caveats.
- **소스 데이터** — which user behavior / events it comes from.
- **데이터 단위 (grain)** — the fact table: table name, what one row is, PK, and the column table (컬럼 · 타입 · 제약 · 의미).
- **산출 방식** — how the fact aggregates into the metric: aggregation, dimensions (e.g. `week_kst`), filters (exclude test/internal), the result mart.
- **품질관리** — value-range / consistency checks, test-account exclusion, edge cases.
- **변경 이력** — 날짜 · 변경 · 이유.

Metric code/category (NSM / MAIN-N / SUP-N / LAG-N) and related feature/events go in the body as prose — not Obsidian wikilinks/Dataview (this isn't Obsidian).
