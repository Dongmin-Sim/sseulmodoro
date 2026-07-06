#!/usr/bin/env python3
"""spec.py — create / update / show workspace spec files, deterministically.

The writing-* skills call this instead of hand-editing files, so frontmatter
is written the same way every time (no model-side arithmetic or typos). Bodies
are created as skeletons; skills fill prose afterward with Edit.

Artifact types and their layout under workspace/:
  task, issue   → <type>s/<id>/spec.md   (subdir layout)
  milestone     → milestones/<id>.md     (flat layout)
  feature, metric, event → <type>s/<id>.md (flat layout)

Usage:
  spec.py create <type> <id> [key=value ...] [--force]   create from skeleton
  spec.py set    <type> <id> <key=value> ...             patch frontmatter only
  spec.py show   <type> <id>                             print the spec

Stdlib only.
"""

import subprocess
import sys
from pathlib import Path

# --- Per-type config -------------------------------------------------------
# dir: workspace subdirectory. layout: "subdir" → <dir>/<id>/spec.md, "flat" → <dir>/<id>.md.
# fm: frontmatter keys in order. defaults: values used when not supplied on create.

TYPES = {
    "task": {
        "dir": "tasks", "layout": "subdir",
        "fm": ["status", "branch", "pr", "start_date", "end_date", "milestone", "track"],
        "defaults": {"status": "backlog", "branch": None, "pr": None,
                     "start_date": None, "end_date": None},
    },
    "issue": {
        "dir": "issues", "layout": "subdir",
        "fm": ["status", "branch", "pr", "start_date", "end_date", "severity", "track"],
        "defaults": {"status": "backlog", "branch": None, "pr": None,
                     "start_date": None, "end_date": None},
    },
    "milestone": {
        "dir": "milestones", "layout": "flat",
        "fm": ["title", "feature", "status"], "defaults": {"status": "candidate"},
    },
    "feature": {
        "dir": "features", "layout": "flat",
        "fm": ["title", "status"], "defaults": {"status": "active"},
    },
    "metric": {
        "dir": "metrics", "layout": "flat",
        "fm": ["title", "status"], "defaults": {"status": "active"},
    },
    "event": {
        "dir": "events", "layout": "flat",
        "fm": ["title", "status"], "defaults": {"status": "active"},
    },
}

# Body skeletons live in each skill's writing-<kind>/TEMPLATE.md, read by
# render_body(). No built-in copies here — the template is the single source.


def die(msg):
    print(f"[spec] {msg}", file=sys.stderr)
    sys.exit(1)


def _read(path, what):
    """Read a file, or die() cleanly instead of dumping a traceback."""
    try:
        return path.read_text(encoding="utf-8")
    except OSError as e:
        die(f"cannot read {what} {path}: {e}")


def resolve_repo_root():
    """git repo root (falls back to cwd)."""
    try:
        root = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
        if root:
            return Path(root)
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass
    return Path.cwd()


_WORKSPACE_OVERRIDE = None


def resolve_workspace():
    """workspace/ dir — an explicit --workspace path if given, else under the
    git repo root. Worktrees pass --workspace to reach the primary's canonical
    workspace (workspace/ is gitignored, so it is absent inside a worktree)."""
    if _WORKSPACE_OVERRIDE is not None:
        return _WORKSPACE_OVERRIDE
    return resolve_repo_root() / "workspace"


def render_body(kind, item_id, title):
    """Body skeleton for a new spec, from the type's own template at
    .claude/skills/writing-<kind>/TEMPLATE.md, so templates live with their
    skill; a minimal heading is used only if that file is missing. Uses
    str.replace (not .format) so literal braces — e.g. LaTeX — survive."""
    tpl = resolve_repo_root() / ".claude" / "skills" / f"writing-{kind}" / "TEMPLATE.md"
    raw = _read(tpl, "template") if tpl.exists() else "# {title}\n"
    return raw.replace("{id}", item_id).replace("{title}", title)


def spec_path(kind, item_id):
    cfg = TYPES[kind]
    base = resolve_workspace() / cfg["dir"]
    return base / item_id / "spec.md" if cfg["layout"] == "subdir" else base / f"{item_id}.md"


def parse_kv(pairs):
    """['a=b', 'c=d'] -> {'a':'b','c':'d'}. 'null'/'' -> None."""
    out = {}
    for p in pairs:
        if "=" not in p:
            die(f"expected key=value, got: {p}")
        k, _, v = p.partition("=")
        v = v.strip()
        out[k.strip()] = None if v == "" or v.lower() == "null" else v
    return out


def fmt_value(v):
    return "null" if v is None else str(v)


def read_frontmatter_and_body(path):
    """Return (ordered [(key, value)], body_str). Empty frontmatter -> ([], text)."""
    text = _read(path, "spec")
    lines = text.splitlines(keepends=True)
    if not lines or lines[0].strip() != "---":
        return [], text
    fm, body_start = [], None
    for i, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            body_start = i + 1
            break
        if ":" in line:
            k, _, v = line.partition(":")
            v = v.strip()
            fm.append((k.strip(), None if v == "" or v.lower() == "null" else v))
    body = "".join(lines[body_start:]) if body_start is not None else ""
    return fm, body


def write_spec(path, fm_pairs, body):
    lines = ["---\n"]
    lines += [f"{k}: {fmt_value(v)}\n" for k, v in fm_pairs]
    lines += ["---\n", body if body.startswith("\n") else "\n" + body]
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("".join(lines), encoding="utf-8")
    except OSError as e:
        die(f"cannot write {path}: {e}")


def cmd_create(kind, item_id, kv, force):
    cfg = TYPES[kind]
    path = spec_path(kind, item_id)
    if path.exists() and not force:
        die(f"{path} exists (use --force to overwrite, or `set` to patch)")

    # `title` is always accepted for the body heading; it only lands in
    # frontmatter for types that declare it (feature/milestone/metric/event).
    title = kv.get("title", item_id)
    fm = dict(cfg["defaults"])
    for k, v in kv.items():
        if k == "title" and "title" not in cfg["fm"]:
            continue
        if k not in cfg["fm"]:
            die(f"'{k}' is not a {kind} field: {cfg['fm']}")
        fm[k] = v
    # Keep declared order; unset keys default to None.
    fm_pairs = [(k, fm.get(k)) for k in cfg["fm"]]
    body = render_body(kind, item_id, title)
    write_spec(path, fm_pairs, body)
    print(f"[spec] created {path}")


def cmd_set(kind, item_id, kv):
    cfg = TYPES[kind]
    path = spec_path(kind, item_id)
    if not path.exists():
        die(f"{path} not found (use `create` first)")
    for k in kv:
        if k not in cfg["fm"]:
            die(f"'{k}' is not a {kind} field: {cfg['fm']}")

    fm, body = read_frontmatter_and_body(path)
    keys = [k for k, _ in fm]
    for k, v in kv.items():
        if k in keys:
            fm = [(kk, v if kk == k else vv) for kk, vv in fm]
        else:
            fm.append((k, v))
    write_spec(path, fm, body)
    print(f"[spec] set {path}: {', '.join(f'{k}={fmt_value(v)}' for k, v in kv.items())}")


def cmd_show(kind, item_id):
    path = spec_path(kind, item_id)
    if not path.exists():
        die(f"{path} not found")
    print(_read(path, "spec"), end="")


def main():
    argv = sys.argv[1:]
    if len(argv) < 3:
        die("usage: spec.py <create|set|show> <type> <id> [key=value ...] [--force]")
    action, kind, item_id = argv[0], argv[1], argv[2]
    if kind not in TYPES:
        die(f"unknown type '{kind}': {list(TYPES)}")

    rest = argv[3:]
    global _WORKSPACE_OVERRIDE
    force = "--force" in rest
    filtered, i = [], 0
    while i < len(rest):
        r = rest[i]
        if r == "--force":
            i += 1
        elif r == "--workspace":
            if i + 1 >= len(rest):
                die("--workspace needs a path")
            _WORKSPACE_OVERRIDE = Path(rest[i + 1])
            i += 2
        elif r.startswith("--workspace="):
            _WORKSPACE_OVERRIDE = Path(r.split("=", 1)[1])
            i += 1
        else:
            filtered.append(r)
            i += 1
    kv = parse_kv(filtered)

    if action == "create":
        cmd_create(kind, item_id, kv, force)
    elif action == "set":
        if not kv:
            die("set needs at least one key=value")
        cmd_set(kind, item_id, kv)
    elif action == "show":
        cmd_show(kind, item_id)
    else:
        die(f"unknown action '{action}' (create|set|show)")


if __name__ == "__main__":
    main()
