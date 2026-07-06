# Structure — progressive disclosure, references, naming

## Progressive disclosure
SKILL.md is a table of contents (< 500 lines). Bundle detail in separate files loaded on demand — no context cost until read.

Directory example:
```text
pdf/
├── SKILL.md        # Main instructions (loaded when triggered)
├── FORMS.md        # Form-filling guide (loaded as needed)
├── reference.md    # API reference (loaded as needed)
└── scripts/
    └── fill_form.py  # Utility script (executed, not loaded)
```

- **Pattern 1**: high-level guide + links ("Form filling: See [FORMS.md](FORMS.md)").
- **Pattern 2**: domain-split `reference/` (finance.md, sales.md…) — load only the relevant domain.
- **Pattern 3**: conditional detail — show basics, link advanced/edge cases.

## Reference depth — one level only
Every reference is linked directly from SKILL.md.

**Bad (too deep):**
```markdown
# SKILL.md → See advanced.md
# advanced.md → See details.md
# details.md → the actual info
```
**Good (one level):**
```markdown
# SKILL.md
Advanced features: See advanced.md
API reference: See reference.md
```
Reason: Claude may partial-read (`head -100`) a nested file and get incomplete info.

## Long reference files (> 100 lines)
Put a `## Contents` (TOC) at the top so a partial read still shows the full scope.

## Naming
Gerund preferred (`processing-pdfs`, `analyzing-spreadsheets`). Acceptable: noun-phrase (`pdf-processing`), action (`process-pdfs`). Avoid: vague (`helper`/`utils`/`tools`), too-generic (`documents`/`data`), reserved (`claude`/`anthropic`). Lowercase · digits · hyphens, ≤ 64 chars. Keep the pattern consistent across the library.
