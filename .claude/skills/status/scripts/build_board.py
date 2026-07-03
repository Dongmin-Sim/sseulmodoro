#!/usr/bin/env python3
"""Build workspace/board.md — a cached summary of task/issue/milestone status.

The source of truth is each spec's YAML frontmatter (workspace/tasks/<id>/spec.md,
workspace/issues/<id>/spec.md, workspace/milestones/<id>.md). This script scans
that frontmatter and materializes board.md as a read cache (like a DB view).
board.md is never hand-edited — rerun this script to refresh it.

Freshness: the board stores the newest source-file mtime it was built from. On
rerun, if no source is newer, the build is skipped unless --force is passed.

Stdlib only — frontmatter here is flat `key: value`, so no PyYAML dependency.

Usage:
    python3 build_board.py [--workspace PATH] [--force]
"""

import argparse
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# --- Constants (documented so values are not "voodoo") ---------------------

# Tasks and issues live in <id>/spec.md subdirs; milestones are flat files.
SPEC_FILENAME = "spec.md"
DIR_TASKS = "tasks"
DIR_ISSUES = "issues"
DIR_MILESTONES = "milestones"
BOARD_FILENAME = "board.md"

# Marker line the board carries so a later run can read the mtime it was built
# from without parsing markdown. Epoch seconds = trivial float comparison.
SOURCE_MTIME_MARKER = "<!-- source_mtime:"

# A "done" task counts toward milestone completion.
STATUS_DONE = "done"

# Progress bar: fixed width so bars line up across milestones; filled by the
# proportion of the milestone's tasks in each state. Pre-computed here so the
# report just copies the string (no model-side arithmetic, which is error-prone).
BAR_WIDTH = 10
BAR_DONE, BAR_INPROGRESS, BAR_TODO = "█", "▓", "░"
# Statuses that render as the middle "in progress" shade.
INPROGRESS_STATUSES = ("in-progress", "in-review")


# --- Frontmatter parsing ---------------------------------------------------

def parse_frontmatter(path):
    """Return the flat frontmatter dict for a spec file.

    Missing/absent frontmatter yields {} rather than raising, so one malformed
    file never breaks the whole board. `null`/empty values become None.
    """
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        print(f"[build_board] skip {path}: {exc}", file=sys.stderr)
        return {}

    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}

    fields = {}
    for line in lines[1:]:
        if line.strip() == "---":
            break
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        value = value.strip()
        if value == "" or value.lower() == "null":
            value = None
        fields[key.strip()] = value
    return fields


def _numeric_suffix(item_id):
    """Sort key: trailing integer of an id (TASK-85 -> 85), else 0."""
    tail = item_id.rsplit("-", 1)[-1]
    return int(tail) if tail.isdigit() else 0


def collect_subdir_specs(workspace, dirname):
    """Collect <workspace>/<dirname>/<id>/spec.md entries (tasks, issues)."""
    base = workspace / dirname
    specs = []
    if not base.is_dir():
        return specs
    for entry in sorted(base.iterdir()):
        spec = entry / SPEC_FILENAME
        if entry.is_dir() and spec.is_file():
            specs.append({
                "id": entry.name,
                "fields": parse_frontmatter(spec),
                "mtime": spec.stat().st_mtime,
            })
    specs.sort(key=lambda s: _numeric_suffix(s["id"]))
    return specs


def collect_milestones(workspace):
    """Collect <workspace>/milestones/<id>.md entries (flat files)."""
    base = workspace / DIR_MILESTONES
    specs = []
    if not base.is_dir():
        return specs
    for entry in sorted(base.glob("*.md")):
        specs.append({
            "id": entry.stem,
            "fields": parse_frontmatter(entry),
            "mtime": entry.stat().st_mtime,
        })
    return specs


# --- Rendering -------------------------------------------------------------

def _cell(value):
    """Render a frontmatter value as a table cell (None -> em dash)."""
    return "—" if value is None else str(value)


def render_bar(milestone_tasks):
    """Return the fixed-width progress bar string for a milestone's tasks.

    done -> BAR_DONE, in-progress/in-review -> BAR_INPROGRESS, rest -> BAR_TODO.
    Pre-computed so the report copies it verbatim instead of doing the math.
    """
    total = len(milestone_tasks)
    if total == 0:
        return BAR_TODO * BAR_WIDTH
    done = sum(1 for t in milestone_tasks
               if t["fields"].get("status") == STATUS_DONE)
    inprog = sum(1 for t in milestone_tasks
                 if t["fields"].get("status") in INPROGRESS_STATUSES)
    done_cells = round(done / total * BAR_WIDTH)
    inprog_cells = min(round(inprog / total * BAR_WIDTH), BAR_WIDTH - done_cells)
    todo_cells = BAR_WIDTH - done_cells - inprog_cells
    return BAR_DONE * done_cells + BAR_INPROGRESS * inprog_cells + BAR_TODO * todo_cells


def render_board(milestones, tasks, issues, source_mtime):
    generated_at = datetime.now().isoformat(timespec="seconds")
    lines = [
        "<!-- generated by /status build_board.py — do not edit by hand -->",
        f"<!-- generated_at: {generated_at} -->",
        f"{SOURCE_MTIME_MARKER} {source_mtime} -->",
        "",
        "# 작업 보드",
        "",
        "## Milestones",
        "",
        # `display` is the pre-assembled milestone line the report copies verbatim
        # (id · title · bar · done/total) — the model never recomputes done/total.
        "| milestone | feature | status | display |",
        "| --- | --- | --- | --- |",
    ]
    for m in milestones:
        m_tasks = [t for t in tasks if t["fields"].get("milestone") == m["id"]]
        total = len(m_tasks)
        done = sum(1 for t in m_tasks if t["fields"].get("status") == STATUS_DONE)
        bar = render_bar(m_tasks)
        title = _cell(m["fields"].get("title"))
        display = f"{m['id']} · {title}  {bar} {done}/{total}"
        lines.append(
            f"| {m['id']} | {_cell(m['fields'].get('feature'))} "
            f"| {_cell(m['fields'].get('status'))} | {display} |"
        )

    lines += ["", "## Tasks", "",
              "| id | status | session | milestone | branch | pr |",
              "| --- | --- | --- | --- | --- | --- |"]
    for t in tasks:
        f = t["fields"]
        lines.append(
            f"| {t['id']} | {_cell(f.get('status'))} | {_cell(f.get('session'))} "
            f"| {_cell(f.get('milestone'))} | {_cell(f.get('branch'))} "
            f"| {_cell(f.get('pr'))} |"
        )

    lines += ["", "## Issues", "",
              "| id | status | severity | branch | pr |",
              "| --- | --- | --- | --- | --- |"]
    for i in issues:
        f = i["fields"]
        lines.append(
            f"| {i['id']} | {_cell(f.get('status'))} | {_cell(f.get('severity'))} "
            f"| {_cell(f.get('branch'))} | {_cell(f.get('pr'))} |"
        )

    return "\n".join(lines) + "\n"


# --- Freshness -------------------------------------------------------------

def read_board_source_mtime(board_path):
    """Return the source_mtime the existing board was built from, or None."""
    if not board_path.is_file():
        return None
    for line in board_path.read_text(encoding="utf-8").splitlines():
        if line.startswith(SOURCE_MTIME_MARKER):
            token = line[len(SOURCE_MTIME_MARKER):].strip().rstrip("->").strip()
            try:
                return float(token)
            except ValueError:
                return None
    return None


# --- Workspace resolution --------------------------------------------------

def resolve_workspace(arg):
    """Resolve the canonical workspace dir.

    Priority: --workspace, else <git repo root>/workspace, else <cwd>/workspace.
    Note: with git worktrees the canonical workspace lives in the PRIMARY repo
    (it is gitignored, not shared across worktrees) — run from there or pass
    --workspace explicitly.
    """
    if arg:
        return Path(arg).expanduser().resolve()
    try:
        root = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
        if root:
            return Path(root) / "workspace"
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass
    return Path.cwd() / "workspace"


def main():
    parser = argparse.ArgumentParser(description="Build workspace/board.md cache.")
    parser.add_argument("--workspace", help="workspace dir (default: <repo>/workspace)")
    parser.add_argument("--force", action="store_true", help="rebuild even if fresh")
    args = parser.parse_args()

    workspace = resolve_workspace(args.workspace)
    board_path = workspace / BOARD_FILENAME

    if not workspace.is_dir():
        # Nothing to summarize yet — write an empty board instead of failing.
        workspace.mkdir(parents=True, exist_ok=True)
        board_path.write_text(render_board([], [], [], 0.0), encoding="utf-8")
        print(f"[build_board] no sources; wrote empty {board_path}")
        return

    milestones = collect_milestones(workspace)
    tasks = collect_subdir_specs(workspace, DIR_TASKS)
    issues = collect_subdir_specs(workspace, DIR_ISSUES)

    all_specs = milestones + tasks + issues
    source_mtime = max((s["mtime"] for s in all_specs), default=0.0)

    prev = read_board_source_mtime(board_path)
    if not args.force and prev is not None and prev >= source_mtime:
        print(f"[build_board] up to date ({board_path})")
        return

    board_path.write_text(
        render_board(milestones, tasks, issues, source_mtime), encoding="utf-8"
    )
    print(f"[build_board] wrote {board_path} "
          f"({len(milestones)} milestones, {len(tasks)} tasks, {len(issues)} issues)")


if __name__ == "__main__":
    main()
