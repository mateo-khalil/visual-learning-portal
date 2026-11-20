/*
 * Binary search engine — the "pure engine → immutable steps → UI replays them" pattern.
 *
 * `run(preset)` computes the whole search up front and returns an array of frozen
 * snapshots. The UI (components/example/BinarySearchSim.tsx) never computes anything:
 * it only draws snapshot `i`. scripts/checks/example.ts asserts the canonical results
 * on the same snapshots, so the page, the solutions in content/ and the checks can
 * never disagree.
 *
 * Convention (state it on the exam!): inclusive bounds [lo, hi], mid = ⌊(lo + hi) / 2⌋.
 */

export const BSEARCH_PRESETS = ["basic", "not-found", "first-occurrence"] as const;
export type BsearchPreset = (typeof BSEARCH_PRESETS)[number];
export const isBsearchPreset = (s: string): s is BsearchPreset => (BSEARCH_PRESETS as readonly string[]).includes(s);

/** classic: stop at the first match · leftmost: on a match keep searching to the left. */
export type Variant = "classic" | "leftmost";

export interface BsearchConfig {
  label: string;
  array: readonly number[];
  target: number;
  variant: Variant;
}

export const PRESETS: Record<BsearchPreset, BsearchConfig> = {
  basic: {
    label: "Found",
    array: [3, 8, 12, 17, 21, 26, 30, 35, 41, 47, 52, 58, 64, 70, 77, 85],
    target: 21,
    variant: "classic",
  },
  "not-found": {
    label: "Not found",
    array: [3, 8, 12, 17, 21, 26, 30, 35, 41, 47, 52, 58, 64, 70, 77, 85],
    target: 50,
    variant: "classic",
  },
  "first-occurrence": {
    label: "First occurrence",
    array: [2, 4, 4, 7, 7, 7, 7, 9, 11, 13],
    target: 7,
    variant: "leftmost",
  },
};

/** What the comparison at `mid` decided. */
export type Decision = "go-right" | "go-left" | "found" | "match-keep-left";

export interface Snapshot {
  readonly lo: number;
  readonly hi: number;
  /** Index probed in this step (null on the first and last snapshot). */
  readonly mid: number | null;
  /** a[mid], when there is a probe. */
  readonly value: number | null;
  readonly decision: Decision | null;
  /** Leftmost variant: the best match so far. */
  readonly best: number | null;
  /** Comparisons made so far, this one included. */
  readonly probes: number;
  readonly done: boolean;
  /** Final answer: the index found, or null if the target is not in the array. */
  readonly result: number | null;
  /** When not found: where the target would be inserted to keep the array sorted (= final lo). */
  readonly insertAt: number | null;
  readonly title: string;
  readonly text: string;
}

/** Worst case of the classic search on n elements: ⌊log₂ n⌋ + 1 comparisons. */
export const maxProbes = (n: number) => (n <= 0 ? 0 : Math.floor(Math.log2(n)) + 1);

export function run(preset: BsearchPreset | BsearchConfig): readonly Snapshot[] {
  const cfg = typeof preset === "string" ? PRESETS[preset] : preset;
  const a = cfg.array;
  const x = cfg.target;
  const out: Snapshot[] = [];
  const push = (s: Snapshot) => out.push(Object.freeze(s));
  const base = { mid: null, value: null, decision: null, done: false, result: null, insertAt: null };

  let lo = 0;
  let hi = a.length - 1;
  let best: number | null = null;
  let probes = 0;
  push({
    ...base,
    lo,
    hi,
    best,
    probes,
    title: `Search for ${x} in ${a.length} sorted values`,
    text: `The whole array is the candidate range: lo = ${lo}, hi = ${hi}. Each comparison with the middle element throws away half of what is left.`,
  });

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const v = a[mid];
    probes++;
    let decision: Decision;
    let text: string;
    if (v === x && cfg.variant === "classic") {
      decision = "found";
      text = `a[${mid}] = ${v} is the target: found at index ${mid} after ${probes} comparison${probes > 1 ? "s" : ""}.`;
    } else if (v === x) {
      decision = "match-keep-left";
      text = `a[${mid}] = ${v} matches, but there may be an earlier ${x}: remember ${mid} and keep searching the left half (hi = ${mid - 1}).`;
    } else if (v < x) {
      decision = "go-right";
      text = `a[${mid}] = ${v} < ${x}: the target can only be to the right. Discard [${lo}..${mid}] → lo = ${mid + 1}.`;
    } else {
      decision = "go-left";
      text = `a[${mid}] = ${v} > ${x}: the target can only be to the left. Discard [${mid}..${hi}] → hi = ${mid - 1}.`;
    }
    if (decision === "match-keep-left") best = mid;
    push({
      ...base,
      lo,
      hi,
      mid,
      value: v,
      decision,
      best,
      probes,
      title: `Comparison ${probes}: mid = ⌊(${lo} + ${hi}) / 2⌋ = ${mid}`,
      text,
    });
    if (decision === "found") {
      push({
        ...base,
        lo,
        hi,
        mid,
        value: v,
        decision,
        best,
        probes,
        done: true,
        result: mid,
        title: `Found: index ${mid}`,
        text: `${probes} comparisons for ${a.length} elements. The worst case is ⌊log₂ ${a.length}⌋ + 1 = ${maxProbes(a.length)}.`,
      });
      return Object.freeze(out);
    }
    if (decision === "go-right") lo = mid + 1;
    else hi = mid - 1;
  }

  const result = best;
  push({
    ...base,
    lo,
    hi,
    best,
    probes,
    done: true,
    result,
    insertAt: result === null ? lo : null,
    title: result === null ? `Not found (lo = ${lo} > hi = ${hi})` : `First occurrence: index ${result}`,
    text:
      result === null
        ? `The range is empty, so ${x} is not in the array. lo = ${lo} is where it would be inserted to keep the order. ${probes} comparisons.`
        : `The range is empty and the best match remembered is ${result}: the first ${x}. A classic search would have stopped at the first match it hit.`,
  });
  return Object.freeze(out);
}

/** The rows of the by-hand trace table: one per comparison. */
export function traceRows(steps: readonly Snapshot[]) {
  return steps.filter((s) => s.mid !== null && !s.done);
}
