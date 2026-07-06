# Conciseness & freedom level

## Conciseness — assume Claude is smart
Add only context Claude lacks. Ask: does Claude already know this? Does this paragraph justify its tokens?

**Good (~50 tokens)** — assumes Claude knows what a PDF is and how libraries work:
````markdown
## Extract PDF text
Use pdfplumber for text extraction:
```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```
````

**Bad (~150 tokens)** — explains what a PDF is, surveys libraries, spells out pip install:
> "PDF (Portable Document Format) files are a common file format that contains text, images… There are many libraries available… but pdfplumber is recommended because… First, install it using pip. Then…"

## Freedom level — match the task's fragility

**High** (prose, many valid paths — e.g. code review):
```markdown
1. Analyze the code structure and organization
2. Check for potential bugs or edge cases
3. Suggest improvements for readability and maintainability
4. Verify adherence to project conventions
```

**Medium** (parameterized pattern, some variation ok):
```python
def generate_report(data, format="markdown", include_charts=True):
    ...
```

**Low** (exact, order/consistency-critical — e.g. migration):
```markdown
Run exactly this script:
python scripts/migrate.py --verify --backup
Do not modify the command or add additional flags.
```

Analogy: narrow bridge with cliffs → low freedom (precise guardrails); open field → high freedom (trust Claude to find the path).
