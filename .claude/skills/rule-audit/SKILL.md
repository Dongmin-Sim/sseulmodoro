---
name: rule-audit
description: Audits a Claude Code rule file (.claude/rules/*.md) against the rules-authoring guide and DoD checklist, reporting pass/gaps by category. Focuses on container fit (rule vs skill), path-scoping, duplication, and context cost. Runs on a review model in isolation. Use before committing a rule, to audit the whole set ("전체"), or when the user says "이 룰 점검", "룰 점검", "룰 감사".
context: fork
agent: rule-reviewer
---

# rule-audit

Audit a rule against the guide + checklist.

- Target = the rule named in the invocation argument (e.g. `db-design`).
- `all` / `전체` → audit every rule under `.claude/rules/`.
- No argument → audit the rules changed in the working tree.

Follow the rule-reviewer agent's checklist and method, and produce its Korean report.

## Reference (criteria + examples)
- [reference/rules-authoring.md](reference/rules-authoring.md)
