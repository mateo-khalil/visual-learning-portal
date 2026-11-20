/*
 * Example lesson 1: binary search. Every step is computed by the pure engine
 * (lib/example/binarySearch.ts): the scene is a function of one engine snapshot, so the drawing,
 * the metrics and the checks can never disagree.
 */
import { pill, scene } from "@/lib/stage/build";
import type { Card, Entity, Lesson, Scene, Step } from "@/lib/stage/types";
import { maxProbes, PRESETS, run, type Snapshot } from "@/lib/example/binarySearch";

const cfg = PRESETS.basic;
const A = cfg.array;
export const SNAPS = run("basic");
const PITCH = 1.1;

/** The world: a table with the array, the target and the lo / hi pointers, for one snapshot. */
export function world(s: Snapshot | null): Scene {
  const e: Record<string, Entity> = {
    table: { type: "slab", x: -4.2, y: -1.2, w: A.length * PITCH + 5.2, d: 5.4, h: 0.15, tone: "paper" },
    target: { type: "box", x: -3.4, y: 0, z: 0.15, w: 1.6, d: 1.4, h: 0.8, tone: "lilac", text: String(cfg.target), fs: 16, pills: [pill("target", "top", "lilac")] },
  };
  A.forEach((v, i) => {
    const inRange = !s || (i >= s.lo && i <= s.hi);
    const isMid = s?.mid === i;
    const found = !!s?.done && s.result === i;
    e[`c${i}`] = {
      type: "box",
      x: i * PITCH,
      y: 0,
      z: 0.15,
      w: 0.95,
      d: 0.95,
      h: 0.5,
      tone: found ? "mint" : isMid ? "amber" : inRange ? "paper" : "slate",
      dim: !inRange && !isMid,
      lift: isMid ? 0.45 : 0,
      glow: isMid || found,
      text: String(v),
      faces: { left: String(i) },
      pills: isMid && s ? [pill(`mid = ${i}`, "top", found ? "mint" : "amber")] : undefined,
    };
  });
  if (s && s.lo <= A.length - 1) e.lo = { type: "label", x: s.lo * PITCH + 0.47, y: 1.7, z: 0.15, pills: [pill(`lo = ${s.lo}`, "bottom", "sky")] };
  if (s && s.hi >= 0) e.hi = { type: "label", x: s.hi * PITCH + 0.47, y: 2.9, z: 0.15, pills: [pill(`hi = ${s.hi}`, "bottom", "rose")] };
  return { entities: e };
}

const CODE = ["lo, hi = 0, n - 1", "while lo <= hi:", "    mid = (lo + hi) // 2", "    if a[mid] == x: return mid", "    if a[mid] < x: lo = mid + 1", "    else: hi = mid - 1", "return None"];
const HL: Record<string, number[]> = { start: [1], found: [3, 4], "go-right": [3, 5], "go-left": [3, 6], none: [7] };
const code = (s: Snapshot): Card => ({ kind: "code", id: "code", title: "The algorithm", lines: CODE, hl: HL[s.done && s.result === null ? "none" : (s.decision ?? "start")] });

const metrics = (s: Snapshot) => ({ lo: s.lo, hi: s.hi, mid: s.mid, value: s.value, probes: s.probes });

const engineSteps: Step[] = SNAPS.map((s, i) => ({
  short: i === 0 ? "Start" : s.done ? "Found" : `Probe ${s.probes}`,
  kind: s.done ? "summary" : i === 0 ? "problem" : "technique",
  title: s.title,
  body: [s.text],
  changes: s.decision === "go-right" ? [`~ lo = ${s.mid! + 1}`, "− left half"] : s.decision === "go-left" ? [`~ hi = ${s.mid! - 1}`, "− right half"] : undefined,
  scene: world(s),
  // The camera follows the candidate range as it shrinks.
  focus: s.done ? undefined : [...A.map((_, j) => `c${j}`).filter((_, j) => j >= s.lo && j <= s.hi), "lo", "hi"],
  cards: [code(s)],
  metrics: metrics(s),
}));

export const search: Lesson = {
  id: "binary-search",
  title: "Binary search",
  subtitle: "Halve the candidate range with one comparison per step.",
  minutes: 4,
  metrics: [
    { id: "lo", label: "lo" },
    { id: "hi", label: "hi" },
    { id: "mid", label: "mid" },
    { id: "value", label: "a[mid]" },
    { id: "probes", label: "Comparisons" },
  ],
  legend: [
    { tone: "amber", text: "probed now" },
    { tone: "slate", text: "discarded" },
    { tone: "mint", text: "found" },
  ],
  learn: [
    { text: "The **candidate range** [lo, hi] and the middle element", at: 1 },
    { text: "Why each comparison **discards half**", at: 2 },
    { text: "The worst case: **⌊log₂ n⌋ + 1** comparisons", at: SNAPS.length + 1 },
  ],
  steps: [
    {
      short: "The array",
      kind: "problem",
      title: `${A.length} sorted values`,
      body: ["The array is **sorted**: that is the only thing binary search needs. The number on the front of each box is its index."],
      scene: world(null),
      metrics: { lo: null, hi: null, mid: null, value: null, probes: 0 },
    },
    ...engineSteps,
    {
      short: "Worst case",
      kind: "idea",
      title: "Why it is so fast",
      body: [
        `Each comparison halves the range, so ${A.length} values need at most **${maxProbes(A.length)}** comparisons (⌊log₂ ${A.length}⌋ + 1).`,
        "A million values: 20 comparisons. A linear search could need a million.",
      ],
      scene: world(SNAPS[SNAPS.length - 1]),
      cards: [{ kind: "calc", id: "log", title: "Worst case", lines: [`n = ${A.length}`, `⌊log₂ ${A.length}⌋ + 1 = ${maxProbes(A.length)}`, "n = 1 000 000: 20"], result: `${maxProbes(A.length)} comparisons at most` }],
    },
    {
      short: "Exam",
      kind: "exam",
      title: "What to write on the exam",
      body: ["State the convention (**inclusive** bounds, mid = ⌊(lo + hi) / 2⌋) and write the trace as a table: one row per comparison with lo, hi, mid and a[mid]."],
      callout: { kind: "board", text: "The array with indices, then one row per comparison: lo · hi · mid · a[mid] · decision." },
      scene: scene(world(SNAPS[SNAPS.length - 1])),
      cards: [
        {
          kind: "table",
          id: "trace",
          title: "Trace",
          head: ["lo", "hi", "mid", "a[mid]"],
          rows: SNAPS.filter((s) => s.mid !== null && !s.done).map((s) => [String(s.lo), String(s.hi), String(s.mid), String(s.value)]),
        },
      ],
    },
  ],
};
