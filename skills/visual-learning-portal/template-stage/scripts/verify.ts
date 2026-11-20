/*
 * npm run verify: integrity of every lesson + the canonical results of every area.
 * It has to end in "All OK".
 */
import { COURSE } from "../content/course";
import { GEOM } from "../lib/stage/geom";
import { missingAnchors, visibleLen } from "../lib/stage/resolve";
import { KITS } from "../components/stage/kits";
import type { Lesson, Scene } from "../lib/stage/types";
import type { T } from "./checks/types";
import example from "./checks/example";

const fails: string[] = [];
let n = 0;
const t: T = {
  eq(name, got, want) {
    n++;
    const a = typeof got === "object" ? JSON.stringify(got) : got;
    const b = typeof want === "object" ? JSON.stringify(want) : want;
    if (a !== b) fails.push(`${name}: got ${String(a)}, expected ${String(b)}`);
  },
  ok(name, cond, detail) {
    n++;
    if (!cond) fails.push(`${name}${detail ? ` (${detail})` : ""}`);
  },
};

// Every entity type has geometry and a renderer.
for (const k of Object.keys(GEOM)) t.ok(`kit ${k}: has a renderer`, k in KITS);
for (const k of Object.keys(KITS)) t.ok(`kit ${k}: has geometry`, k in GEOM);

/** Notation the course must not use (adapt it: e.g. ASCII arrows instead of real symbols). */
const BAD = /->|=>/;

function texts(l: Lesson): string[] {
  const out: string[] = [l.title, l.subtitle, ...l.learn.map((x) => x.text)];
  for (const s of l.steps) {
    out.push(s.short, s.title, ...s.body, ...(s.changes ?? []));
    if (s.callout) out.push(s.callout.text);
  }
  return out;
}

function sceneChecks(where: string, s: Scene) {
  for (const [id, e] of Object.entries(s.entities)) {
    t.ok(`${where}: entity ${id} has a known type`, e.type in GEOM, e.type);
    for (const k of ["x", "y"] as const) t.ok(`${where}: ${id}.${k} is a number`, typeof e[k] === "number" && isFinite(e[k] as number));
  }
  for (const bad of missingAnchors(s)) t.ok(`${where}: broken link or flow`, false, bad);
}

for (const c of COURSE) {
  t.ok(`chapter ${c.id}: has a title`, !!c.title && !!c.short);
  const ids = new Set<string>();
  for (const l of c.lessons) {
    const w = `${c.id}/${l.id}`;
    t.ok(`${w}: unique id`, !ids.has(l.id));
    ids.add(l.id);
    t.ok(`${w}: 4 to 16 steps`, l.steps.length >= 4 && l.steps.length <= 16, String(l.steps.length));
    t.ok(`${w}: serializable`, JSON.stringify(JSON.parse(JSON.stringify(l))) === JSON.stringify(l));
    for (const x of l.learn) t.ok(`${w}: "you will learn" points to a step`, x.at >= 0 && x.at < l.steps.length, x.text);
    const metricIds = new Set((l.metrics ?? []).map((m) => m.id));
    l.steps.forEach((s, i) => {
      const sw = `${w} step ${i + 1}`;
      t.ok(`${sw}: short label (≤ 14)`, visibleLen(s.short) <= 14, s.short);
      t.ok(`${sw}: title (≤ 60)`, visibleLen(s.title) <= 60, s.title);
      t.ok(`${sw}: 1 to 4 paragraphs`, s.body.length >= 1 && s.body.length <= 4);
      for (const p of s.body) t.ok(`${sw}: short paragraph (≤ 330)`, visibleLen(p) <= 330, p.slice(0, 50));
      for (const k of Object.keys(s.metrics ?? {})) t.ok(`${sw}: metric ${k} is declared`, metricIds.has(k));
      const cardIds = (s.cards ?? []).map((x) => x.id);
      t.ok(`${sw}: unique card ids`, new Set(cardIds).size === cardIds.length);
      t.ok(`${sw}: the scene has something`, Object.keys(s.scene.entities).length > 0);
      sceneChecks(sw, s.scene);
    });
    for (const x of texts(l)) t.ok(`${w}: notation`, !BAD.test(x), x.slice(0, 60));
  }
}

example(t);

if (fails.length) {
  console.log(fails.map((f) => `✗ ${f}`).join("\n"));
  console.log(`\n${fails.length} of ${n} failed`);
  process.exit(1);
}
console.log(`${n} checks · All OK`);
