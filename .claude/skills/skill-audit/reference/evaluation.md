# Evaluation & iteration

## Eval-first
Before writing lots of docs: (1) run the task WITHOUT the skill, document concrete gaps; (2) build 3 scenarios testing those gaps; (3) baseline performance; (4) write the minimal instructions needed to pass; (5) iterate. Eval shape: `{skills, query, files, expected_behavior[]}`.

## Test on every target model
- Haiku (fast/cheap): does the skill give enough guidance?
- Sonnet (balanced): clear and efficient?
- Opus (strong reasoning): avoids over-explaining?

Opus-perfect instructions may need more detail for Haiku. If a skill runs on a cheap model (fork), Haiku-followability is the real bar.

## Claude A / Claude B loop
Claude A designs/refines the skill; Claude B uses it on real work; observe B's behavior (missed references, over-read sections, ignored bundled files, unexpected paths); feed observations back to A. Iterate on observed behavior, not assumptions.
