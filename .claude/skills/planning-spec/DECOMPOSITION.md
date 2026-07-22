# Decomposition heuristics — feature → milestone → task

## Hierarchy
- **feature**: one chunk of user/business value. WHAT / why.
- **milestone**: a shippable step; groups tasks. Usually under a feature, but `feature` is optional — a milestone may stand alone (esp. DE/ops work).
- **task**: a unit one work session can finish. Cut at pickup (`executing-task`), not planned here.

## Good decomposition
- One task = one concern. Split if app work and data work mix.
- A milestone should be independently verifiable (demoable).
- State dependencies explicitly ("A precedes B"). No cycles.
- Decompose to milestones only. Tasks are cut one at a time against the code, because what the next piece should be changes as earlier pieces land.

## Track routing (`track`)
- App work (API · DB · auth · pages · components · UX) → **APP** — Claude implements
- Data engineering (pipeline · metrics · events · mart) → **DE** — user implements, Claude reviews

(Within APP, api vs ui is decided by the task's nature, not a label.)

## Anti-patterns
- One task mixing APP + DE → split.
- A "misc / other" milestone → the goal is unclear.
- A task larger than a day → room to split further.
