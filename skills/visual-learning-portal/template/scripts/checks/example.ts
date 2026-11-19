import fs from "fs";
import path from "path";
import type { Check } from "./types";
import { KINDS_EXAMPLE } from "../../lib/registry/example";
import { DATASETS_EXAMPLE } from "../../lib/data/classifiers/example";
import { QUIZ_EXAMPLE } from "../../lib/data/quiz/example";
import { PRESETS, maxProbes, run as search } from "../../lib/example/binarySearch";
import { TRACES, delivered } from "../../lib/example/handshake";

/**
 * Canonical results of the example area. Every number that appears in the content
 * (topics, solutions, quiz explanations) is asserted here against the engines, so a
 * change in an engine that breaks the content fails `npm run verify`.
 */
export function run(check: Check) {
  const eq = (name: string, got: unknown, want: unknown) =>
    check(name, JSON.stringify(got) === JSON.stringify(want), `→ got ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
  const last = <T>(a: readonly T[]) => a[a.length - 1];

  /* Registries: the figures, datasets and kinds the content relies on exist. */
  const figSrc = fs.readFileSync(path.join(__dirname, "../../components/figures/FigsExample.tsx"), "utf-8");
  for (const id of ["sorted-array-halving", "tcp-states"]) check(`figure ${id}`, new RegExp(`^\\s{2}"${id}":`, "m").test(figSrc));
  check("classifier complexity", !!DATASETS_EXAMPLE.complexity);
  for (const k of ["bsearch", "handshake"]) check(`kind ${k} has presets`, (KINDS_EXAMPLE[k] ?? []).length > 0);

  /* Binary search (topic, by-hand guide, question bank, sample exam) */
  const basic = search("basic");
  eq("basic: 21 found at index 4 after 4 comparisons", [last(basic).result, last(basic).probes], [4, 4]);
  eq("basic, step 1: mid 7, a[7] = 35 > 21 → go left", [basic[1].mid, basic[1].value, basic[1].decision], [7, 35, "go-left"]);
  const miss = search("not-found");
  eq("not-found: 50 missing, insertion point 10, 4 comparisons", [last(miss).result, last(miss).insertAt, last(miss).probes], [null, 10, 4]);
  eq("not-found: mids 7, 11, 9, 10", miss.filter((s) => s.mid !== null).map((s) => s.mid), [7, 11, 9, 10]);
  const first = search("first-occurrence");
  eq("first-occurrence: first 7 at index 3 after 4 comparisons", [last(first).result, last(first).probes], [3, 4]);
  eq("classic search on the same array stops at index 4", last(search({ ...PRESETS["first-occurrence"], variant: "classic" })).result, 4);
  eq("searching 70 among the 16 values: 3 comparisons (the gantt in the topic)", last(search({ ...PRESETS.basic, target: 70 })).probes, 3);
  eq("worst case ⌊log₂ n⌋ + 1 for n = 7, 16, 100, 1000, 10⁶, 10⁹", [7, 16, 100, 1000, 1e6, 1e9].map(maxProbes), [3, 5, 7, 10, 20, 30]);
  check("every run stays within the worst case", (["basic", "not-found", "first-occurrence"] as const).every((p) => last(search(p)).probes <= maxProbes(PRESETS[p].array.length)));
  check("snapshots are frozen", basic.every((s) => Object.isFrozen(s)) && Object.isFrozen(basic));

  /* TCP handshake (simulator, sheet, sample exam Q4) */
  const n = TRACES.normal;
  eq("normal: 3 segments SYN, SYN-ACK, ACK", delivered("normal").map((e) => e.flags), ["SYN", "SYN-ACK", "ACK"]);
  eq("normal: acks are ISN + 1 (101, 301)", delivered("normal").map((e) => e.ack ?? null), [null, 101, 301]);
  eq("normal: both ends ESTABLISHED", [last(n).client, last(n).server], ["ESTABLISHED", "ESTABLISHED"]);
  const l = TRACES["lost-syn-ack"];
  const synAcks = l.filter((e) => e.flags === "SYN-ACK");
  eq("lost-syn-ack: SYN-ACK sent twice, the first lost", synAcks.map((e) => !!e.lost), [true, false]);
  check("lost-syn-ack: the retransmission reuses seq and ack", synAcks[0].seq === synAcks[1].seq && synAcks[0].ack === synAcks[1].ack);
  eq("lost-syn-ack: open after the 1 s timeout, at t = 1040 ms", [last(l).t, last(l).client, last(l).server], [1040, "ESTABLISHED", "ESTABLISHED"]);

  /* Quiz */
  check("quiz ids are bs-/cx-/net- + 2 digits", QUIZ_EXAMPLE.every((q) => /^(bs|cx|net)-\d{2}$/.test(q.id)));
}
