# Execution modes

Branch on the item's `track` field. (The `type` axis — task vs issue — is handled in SKILL.md steps 2–3, not here.)

## APP — Claude implements

Claude writes the code. Full-stack (API + UI in one flow).

1. Pick the domain skill by the item's nature (not a label):
   - API / DB / auth → `api-route` (+ `rules/db-design`, `rules/security`)
   - page / component / UX → `fe-patterns` (+ `DESIGN.md`)
2. Implement.
3. Verify: `npm run build` + `lint` + `test` (0 errors).
4. Review before PR: `reviewing-changes` (→ code-reviewer + security-reviewer).

## DE — user implements, Claude reviews

The user writes the code. **Claude does not implement** — review, question, and navigate only (learning). Speak Korean with the user.

Load the reviewer persona from [PERSONA.md](PERSONA.md) — critical senior reviewer + pair-programming navigator (graded findings, earned praise, review lenses).

## Both
- Track progress via `spec.py set <task|issue> <id> ...`.
- Mid-work re-planning → `planning-spec` / `writing-task`.
