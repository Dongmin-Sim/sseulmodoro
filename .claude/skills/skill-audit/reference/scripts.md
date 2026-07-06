# Scripts (skills that bundle code)

## Solve, don't punt — handle errors in the script
**Good:**
```python
def process_file(path):
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:
        print(f"File {path} not found, creating default")
        with open(path, "w") as f:
            f.write("")
        return ""
    except PermissionError:
        print(f"Cannot access {path}, using default")
        return ""
```
**Bad** — punts to Claude:
```python
def process_file(path):
    return open(path).read()  # just fail and let Claude handle it
```

## No voodoo constants — justify every value
**Good:**
```python
# HTTP requests usually complete within 30s; longer allows slow links
REQUEST_TIMEOUT = 30
# 3 retries balances reliability vs speed; most flakes clear by the 2nd
MAX_RETRIES = 3
```
**Bad:** `TIMEOUT = 47  # why 47?` · `RETRIES = 5  # why 5?`

## Other
- Prefer utility scripts over generated code (reliable, save tokens, consistent). State intent: execute ("run `analyze_form.py`") vs read-as-reference ("see `analyze_form.py` for the algorithm").
- Slash paths always (`scripts/helper.py`), never backslashes. Descriptive filenames (`form_validation_rules.md`, not `doc2.md`).
- List needed packages and confirm availability; don't assume installed. Stdlib-only → say so.
- Plan-validate-execute for batch/destructive/high-risk: emit a structured plan file, validate it with a script, then execute.
