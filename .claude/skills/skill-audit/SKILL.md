---
name: skill-audit
description: Audits a Claude Code skill against the skill-authoring guide and DoD checklist, reporting pass/gaps by category. Runs on a review model in isolation. Use before committing a skill, or when the user says "이 스킬 점검", "체크리스트 돌려", "가이드로 점검".
context: fork
agent: skill-reviewer
---

# skill-audit

Audit a skill against the guide + checklist.

- Target = the skill named in the invocation argument (e.g. `planning-spec`).
- No argument → audit the skills changed in the working tree.

Follow the skill-reviewer agent's checklist and method, and produce its Korean report.

## Reference (criteria + examples)
- [reference/descriptions.md](reference/descriptions.md)
- [reference/conciseness-and-freedom.md](reference/conciseness-and-freedom.md)
- [reference/structure.md](reference/structure.md)
- [reference/workflows-and-content.md](reference/workflows-and-content.md)
- [reference/scripts.md](reference/scripts.md)
- [reference/evaluation.md](reference/evaluation.md)
