# writing-event — section guide

Reference when filling `TEMPLATE.md`. Definition only — not the instrumentation code. Declarative; no work-log prose.

- **정의** — one line: what the event represents.
- **트리거** — when it fires, and by whom (user | system).
- **속성 스키마** — the payload columns: 속성 · 타입 (string / int / bool / timestamp / …) · 설명.
- **비고** — ingestion confirmation (row counts / task), source consistency, name-drift notes — only when there is something to say.

Note: the source of truth is the code (`activity_log`); this catalog follows it. On a mismatch, fix to match the code's actual data and let metrics follow.
