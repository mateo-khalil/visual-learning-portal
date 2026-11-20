# PORTAL.md — <Portal name>

<One paragraph: what the learner prepares (exam, oral defence, presentation), when, and why stage lessons: the subject is a set of mechanisms the learner must be able to explain step by step.>

Stack: Next 16 (App Router, fully static) · React 19 · TS strict · Tailwind v4 · plain SVG isometric stage (no WebGL). Dev: `npm run dev`. Language: <language and register>.

## Golden rule

<Where the truth comes from: the course slides, the delivered project, the official solutions. Every number, equation, register value and line of code in a lesson matches it.> Numbers come from the area engines in `lib/<area>/`: **no figure typed by hand if an engine can compute it**.

## Sources (in order of authority)

| Source | What it is | Where |
|---|---|---|
| | | |

## Structure

| What | Where |
|---|---|
| Framework (change it on purpose, not per lesson) | `lib/stage/{types,iso,geom,anim,resolve,build}.ts`, `components/stage/*` |
| Pieces: core and electronics | `components/stage/kits/{core,electronics}.tsx` + geometry in `lib/stage/geom.ts` |
| Pieces of one area | `components/stage/kits/<area>.tsx` + `lib/stage/areas/<area>.ts` |
| Lessons | `content/<area>/<lesson>.ts`, registered in `content/<area>/index.ts` and `content/course.ts` |
| World builders | `content/<area>/world.ts`: pure functions `(engine state, options) → Scene` |
| Canonical checks | `scripts/checks/<area>.ts` |
| Interface strings, step and callout kinds | `lib/ui.ts` |
| Name, language, links | `lib/site.ts` |
| Piece gallery | `/pieces` (not in the navigation) |

## Areas and owners

| Area | Files |
|---|---|
| **<area>** | `content/<area>/*`, `components/stage/kits/<area>.tsx`, `lib/stage/areas/<area>.ts`, `scripts/checks/<area>.ts` |
| **integrator** | everything else |

## Decisions

- <Where sources disagree, what the portal says and why.>

## Canonical results

- <Every number a lesson shows that comes from the sources, asserted in scripts/checks/<area>.ts.>

## Conventions

- One change per step; 8–14 steps per lesson; every lesson ends with an exam/defence step (what to say, what to draw).
- Real notation in text (subscripts, overlines with U+0305, ×, ≤), never ASCII stand-ins.
- Screenshots: `node scripts/shot-steps.mjs /<chapter>/<lesson> [steps] [--dark] [--mobile] [--mid=400]` → `shots/` (on Git Bash prefix `MSYS_NO_PATHCONV=1`).
- Before calling anything done: `npm run verify` (All OK), `npx tsc --noEmit`, `npm run lint`, `npm run build`, and the screenshots read.
