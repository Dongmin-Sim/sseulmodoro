# Workflows, feedback loops, content guidelines

## Workflows — copyable checklist
For multi-step work, give a checklist Claude copies and checks off (prevents skipped validation):
```markdown
Copy this checklist and track progress:
- [ ] Step 1: Read all source documents
- [ ] Step 2: Identify key themes
- [ ] Step 3: Cross-reference claims
- [ ] Step 4: Create structured summary
- [ ] Step 5: Verify citations
```

## Feedback loops — validator → fix → repeat
```markdown
1. Make edits to word/document.xml
2. Validate immediately: python ooxml/scripts/validate.py unpacked_dir/
3. If validation fails: read the error, fix, run validation again
4. Only proceed when validation passes
```
The "validator" can be a script OR a reference doc (STYLE_GUIDE.md) Claude reads and compares against.

## Content guidelines
**No time-sensitive info** — it goes stale. Live IDs/dates in examples count.
- Bad: "If before August 2025 use the old API. After, use the new API."
- Good: a "## Current method" section + an "## Old patterns" `<details>` block for history.

**Consistent terminology** — one word per concept. Bad: mixing "API endpoint" / "URL" / "route" / "path".

## Templates & examples
- **Strict** template: "ALWAYS use this exact structure:" + block. **Flexible**: "a sensible default, use judgment:" + block.
- **Example pattern** (when output quality needs examples) — input/output pairs:
```markdown
Input: Added user authentication with JWT tokens
Output:
feat(auth): implement JWT-based authentication

Add login endpoint and token validation middleware
```

## Anti-pattern — too many options
- Bad: "use pypdf, or pdfplumber, or PyMuPDF, or pdf2image, or…"
- Good: one default + an escape hatch ("Use pdfplumber. For scanned PDFs needing OCR, use pdf2image + pytesseract instead.")
