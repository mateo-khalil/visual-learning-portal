# PORTAL.md — <Portal name>

The project brief: what this portal covers, where the content comes from and which results must never break. Fill in every `<…>`; delete the hints in *italics* once filled. `CLAUDE.md` imports this file, so every session starts from it.

Visual study portal for **<course> · <exam (e.g. midterm 1, final)>** (<institution>, <term>). Stack: Next 16 (App Router) · React 19 · TS strict · Tailwind v4 · react-markdown (gfm, math/KaTeX, highlight). Fully static (SSG) + `localStorage` (keys prefixed with `site.storagePrefix` in `lib/site.ts`). Language of the content: **<language>** (`site.locale`). The reader learns **visually**: intuition and a drawing first, the formula as backup. Dev server: `npx next dev -p <port>`.

## Scope

*Decided by the student / the syllabus. Be explicit: what is out is as important as what is in.*

**In:**
- <Area 1>: <topics, with the slide deck / chapter each comes from>
- <Area 2>: <…>

**Out:** <topics the course covers but this exam does not>.

**Lower priority** (only on the slides, never asked): <…> — kept, marked as such, or wrapped in `<!-- extra -->`.

**Exception:** <e.g. "every question of the past exams must have an answer", even if out of scope — then mark those answers "outside the scope">.

## Sources

| Source | What it is | Where |
|---|---|---|
| <Slides "…", author, year> | <the official scope> | `materials/<…>` (not committed) |
| <Past exam, date> | <n questions, points> | `content/exams/<slug>.md` |
| <Textbook, edition, chapters> | <depth beyond the slides: goes in `extra`> | — |

## Past exams

*One file per exam in `content/exams/` (`## Question N — …` + `### Solution`). Name them by date (`2025-may.md`) and say what each one contains.*

- `<slug>` — <date, number of questions, what stands out (e.g. "Gantt worth 6 points")>.

## Decisions where sources disagree

*Every time two sources say different things, write here what the portal says and why. The content repeats the decision where it matters ("the slides say X; we write X and note Y").*

- <Topic>: <source A says …, source B says …> → **<what the portal writes>**, because <…>.

## Areas

*Who owns what (useful when several agents build areas in parallel: each one only touches its own files and its registry/checks entry).*

| Area | Content | Engines (`lib/<area>/`) | Visuals (`components/<area>/`) | Kinds (`lib/registry/<area>.ts`) | Figures | Checks |
|---|---|---|---|---|---|---|
| example | `topics/binary-search`, `guides/by-hand`, `questions/binary-search`, `exams/sample-exam` | `binarySearch.ts`, `handshake.ts` | `BinarySearchSim`, `HandshakeSim` | `bsearch`, `handshake` | `FigsExample.tsx` | `scripts/checks/example.ts` |
| <area> | <…> | <…> | <…> | <…> | `Figs<Area>.tsx` | `scripts/checks/<area>.ts` |

## Canonical results (must not break)

*Every number the content states is asserted in `scripts/checks/<area>.ts` against the engines. List them here too, so a human can review them. `npm run verify` must print "All OK".*

- <Area>: <input> → <expected output> (<where it appears: topic, exam Q, quiz id>).
- Example area: search 21 in the 16-value array → index 4 in 4 comparisons; 50 → not found, insertion point 10; first 7 in [2, 4, 4, 7, 7, 7, 7, 9, 11, 13] → index 3 (classic → 4); worst case ⌊log₂ n⌋ + 1 (16 → 5, 1000 → 10); handshake acks 101 / 301, lost SYN-ACK → open at 1040 ms.

## Exam mode

`lib/mode.ts` → `EXAM_MODE = <true|false>`. When true, `<!-- extra -->…<!-- /extra -->` blocks, nav entries with `extra: true` and quiz questions with `extra: true` are hidden. What counts as extra here: <e.g. "anything only in the textbook">.

## Conventions

- Diagrams: never ```` ```text ```` ASCII art. Use a DSL block (```` ```steps ````, ```` ```flow ````, ```` ```sequence ````, ```` ```tree ````, ```` ```gantt ````, ```` ```queues ````; syntax in the header comment of each `components/diagrams/*.tsx`), a `[[vis:fig:<id>]]` or a frozen simulator (`:sheet`). ```` ```text ```` is only for literal console output.
- No line inside a fenced block may start with `## ` (it splits exam questions).
- A literal dollar sign in markdown is written `\$` (remark-math reads `$…$` as math).
- Engines are pure and return frozen snapshots; components only draw them. Presets live in the engine and the registry is generated from them.
- Components with state derived from a preset get a `key` so that a new preset resets them.
- Screenshots to review a page: `PORT=<port> scripts/shot.sh <route> <out.png>` (`THEME=dark|light`), phone width: `scripts/shot-mobile.sh`.
- Verification before shipping: `npm run verify`, `npm run build`, `npm run lint`, all green.
