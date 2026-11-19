# Engines and verification

## The rule: pure engine → immutable steps → UI replays them

```text
lib/<area>/<engine>.ts        pure TS, no React, no DOM
  PRESETS                     named inputs: the slide example, every past-exam instance
  run(preset, options?) → Step[]   the whole run, computed up front
components/<area>/<Sim>.tsx   draws steps[i] with Stage primitives, Player scrubs i
scripts/checks/<area>.ts      asserts the canonical results on run(...)
lib/registry/<area>.ts        kinds → valid presets, derived from PRESETS
```

Why up front: scrubbing backwards is free, autoplay is just `i++`, a frozen snapshot is `steps[n]`, and the checks test exactly what the UI shows. Why pure: `tsx` can run it in `verify` without a browser.

### Designing a step
A step is a **complete, immutable snapshot**, not a diff:

```ts
export type Step = {
  title: string;              // mono, short: "mid = 7 → go right"
  desc: string;               // 1–2 sentences of narration
  state: State;               // everything the drawing needs (arrays, registers, queues…)
  highlight?: string[];       // ids of the elements that changed in this step
  arrows?: { from: string; to: string; label?: string; tone?: ArrowTone }[];
  done?: boolean;
};
```
- Build each step with `structuredClone(state)` (or spread copies) so earlier steps never mutate.
- **The engine computes values, the narration only describes them.** Never hard-code "now R1 = 41" in text and separately set `R1: 41`. The text interpolates from the state.
- Keep steps at the granularity the slides use. If the slide shows 6 states, the default preset has ~6 steps, plus optional finer steps behind a "detailed" toggle.

### The "film" pattern (complex mechanisms)
When many components interact (CPU + cache + RAM + kernel + disk, or client + load balancer + replicas), write **primitives** that mutate a working state and push a snapshot, then write each scenario ("film") as a short script of primitive calls:

```ts
function race(): Film {
  const f = newFilm(initial());
  fetch(f, "P1"); exec(f, "P1", load(BALANCE));   // each primitive updates state + pushes a step
  timerInterrupt(f);                              // trap, push PC/PSW, save context…
  pick(f, "P2"); restore(f, "P2");
  // …
  return f;
}
export const FILMS = { race, mutex, deadlock } as const;
```
The primitives own the semantics (cache hits/misses, PC, queues), so every film is consistent with every other one, and checks can assert on any film's final state ("race → P2 writes 130, P1 overwrites with 150; 8 hits, 3 misses").

### Conventions as explicit options
When the course has a convention that changes results (tie-breaking, "do arrivals enter the queue before the preempted process?", "is the reference bit set on load?"), make it an option of `run`, default it to **the course's** convention, show it as a toggle in the UI, and assert both values in checks when an exam's answer depends on it.

### Exhaustive exploration (when the question is "which outputs are possible?")
For concurrency or nondeterminism questions, write an explorer: a DFS over all interleavings with memoization on the serialized state. It returns the set of reachable outcomes, whether deadlock is possible and invariant violations. Exam answers like "outputs a, b and c are possible" become a single assertion.

## Presets and registries
- Name presets after their source: `slides`, `may-2025-q7`, `textbook-fig-6-3`, `belady`. Content links to them, so the names are API.
- `lib/registry/<area>.ts` derives kinds from the engines: `export const KINDS_<AREA> = { search: Object.keys(PRESETS), … }`. `verify` uses it to validate every `[[vis:kind:preset]]` in the content.
- Modes after the preset (`:sheet` frozen, `:solo` no scenario tabs, `:fifo` a specific algorithm) are parsed by the component. List the valid modes in the registry's comment.

## Checks: `scripts/checks/<area>.ts`

```ts
import type { Check } from "./types";
export function run(check: Check) {
  const eq = (name: string, got: unknown, want: unknown) =>
    check(name, JSON.stringify(got) === JSON.stringify(want),
      `→ got ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);

  // Slides, deck 3, slide 14: FCFS with bursts 24/3/3 → average wait 17
  eq("FCFS slides avg wait", avgWait(run("slides", { algo: "fcfs" })), 17);
  // May 2025 Q7: FCFS timeline
  eq("May 2025 Q7 FCFS", segments(run("may-2025-q7", { algo: "fcfs" })),
     ["P1 0-7", "P2 7-9", "P4 9-17", "P5 17-23", "P3 23-26"]);
}
```
- **Every number that appears in content is a check.** The check's name cites its source.
- Also list the canonical results in `PORTAL.md` under "Results that must not break". That's the human-readable contract, and the checks enforce it.
- If you find that the slides or the official solution are *wrong*, assert the correct value, explain the discrepancy on the page, and record the decision in `PORTAL.md`.

## `scripts/verify.ts`
Runs every area's checks plus content integrity. Without `--strict`, integrity problems are warnings. `npm run verify` uses `--strict` and must print **All OK**. Integrity checks:
- every `[[vis:<kind>:<preset>…]]` has a known kind and preset (registry), and every `fig:` id exists in a `FIGS_<AREA>` object (read by regex: one `"id": Component,` entry per line at the end of the file);
- every internal link and nav `href` resolves to a content file or route, and every `#anchor` exists;
- quiz items are well formed (one correct answer, a source);
- `<!-- extra -->` markers balance, and in exam-format files they don't cross `### Solution`;
- with `EXAM_MODE` on, visible content doesn't link to hidden pages;
- a ```` ```text ```` block is allowed only if its first line looks like console output (`$ `, `-rw-r--r--`, `/dev/`…);
- no line inside a fenced block starts with `## `.

Add checks whenever a bug slips through. The verify script is the portal's memory of past mistakes.

## Looking at the result
Type checks and assertions don't catch overlapping labels or arrows that miss their box. With the dev server running:
```bash
scripts/shot.sh /topics/<slug> /tmp/topic.png 1280 2400      # desktop
scripts/shot-mobile.sh /simulators/<name> /tmp/sim-mobile.png  # 390 px
```
Read the PNGs. Light mode: add `--blink-settings=preferredColorScheme=1` in the script. Check at least the pages you touched, the home page and one simulator mid-run.
