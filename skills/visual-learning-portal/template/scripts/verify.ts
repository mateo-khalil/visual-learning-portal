/*
 * Verification: `npm run verify` (= npx tsx scripts/verify.ts --strict).
 *
 * 1. Canonical results of each area (scripts/checks/<area>.ts): always failures.
 * 2. Content integrity:
 *    - every [[vis:kind:preset]] resolves (kind and preset in lib/registry, `fig:` ids in
 *      the FIGS_<AREA> objects, `classify:` ids in DATASETS) and every kind has a case in Vis.tsx;
 *    - internal links in the markdown, the TSX pages and the quiz resolve to real routes
 *      (and `#anchors` into topics/guides to real headings); every nav href resolves;
 *    - quiz items are valid (unique ids, answer in range, known topic);
 *    - classifier items point to an existing category;
 *    - `<!-- extra -->` markers are balanced, and the content visible in EXAM_MODE does
 *      not link to pages hidden in EXAM_MODE;
 *    - ```text only for literal console output (its first line has to look like it);
 *    - no line inside a fenced block starts with "## " (it would split an exam question).
 *    Without --strict, integrity problems are warnings (handy while an area is half
 *    built); with --strict they fail.
 */
import fs from "fs";
import path from "path";
import type { Check } from "./checks/types";
import { run as example } from "./checks/example";
import { KINDS } from "../lib/registry";
import { DATASETS } from "../lib/data/classifiers";
import { QUIZ_TOPICS, allQuestions } from "../lib/data/quiz";
import { nav } from "../lib/site";
import { applyMode, brokenMarkers } from "../lib/mode";

/** One entry per area: [title, checks]. Add yours here. */
const AREAS: [string, (check: Check) => void][] = [["Example: binary search + TCP handshake", example]];

const STRICT = process.argv.includes("--strict");
/** Typical first lines of console output (the only thing ```text is for). */
const CONSOLE = /^(\$ |# |> |total \d|[-dlcbps][-rwxsStT]{9}|\s*PID\b|USER\b|UID\b|Filesystem\b|Traceback\b|[\w.-]+@[\w.-]+[:$])/;
const ROOT = path.join(__dirname, "..");
const CONTENT_DIRS = ["topics", "guides", "questions", "exams"];
let fails = 0;
let warns = 0;

const check: Check = (name, cond, detail = "") => {
  if (cond) console.log(`  ✓ ${name}`);
  else {
    fails++;
    console.log(`  ✗ ${name} ${detail}`);
  }
};
const fail = (msg: string) => {
  fails++;
  console.log(`  ✗ ${msg}`);
};
const soft = (msg: string) => {
  if (STRICT) fail(msg);
  else {
    warns++;
    console.log(`  ⚠ ${msg}`);
  }
};

/** Same slug as components/Markdown.tsx gives to headings. */
const slugify = (s: string) =>
  s
    .replace(/[*_`]/g, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const walk = (dir: string): string[] =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]))
    : [];

for (const [title, fn] of AREAS) {
  console.log(title);
  fn(check);
}

console.log("Content");
{
  // Figure ids: the FIGS_<AREA> object at the end of each components/figures/Figs*.tsx.
  const figDir = path.join(ROOT, "components/figures");
  const figIds = new Set<string>();
  for (const f of fs.readdirSync(figDir).filter((f) => /^Figs\w+\.tsx$/.test(f))) {
    const src = fs.readFileSync(path.join(figDir, f), "utf-8");
    const m = src.match(/export const FIGS_\w+[^\n]*?=\s*\{([\s\S]*?)\n\};/);
    if (!m) continue;
    for (const k of m[1].matchAll(/^\s{2}"?([\w-]+)"?\s*:/gm)) figIds.add(k[1]);
  }

  // Every registered kind needs a case in Vis.tsx.
  const visSrc = fs.readFileSync(path.join(ROOT, "components/visuals/Vis.tsx"), "utf-8");
  for (const kind of [...Object.keys(KINDS), "fig", "classify"])
    if (!visSrc.includes(`case "${kind}":`)) fail(`Vis.tsx has no case for the kind "${kind}"`);

  // Routes that exist, and the heading anchors of each content page.
  const routes = new Set<string>(["/"]);
  for (const f of walk(path.join(ROOT, "app"))) {
    if (!f.endsWith(`${path.sep}page.tsx`) || f.includes("[")) continue;
    const rel = path.relative(path.join(ROOT, "app"), path.dirname(f)).split(path.sep).join("/");
    routes.add(rel ? `/${rel}` : "/");
  }
  const anchors = new Map<string, Set<string>>();
  const mdFiles: string[] = [];
  for (const dir of CONTENT_DIRS) {
    const full = path.join(ROOT, "content", dir);
    if (!fs.existsSync(full)) continue;
    for (const f of fs.readdirSync(full).filter((f) => f.endsWith(".md"))) {
      const route = `/${dir}/${f.replace(/\.md$/, "")}`;
      routes.add(route);
      mdFiles.push(path.join(dir, f));
      const md = applyMode(fs.readFileSync(path.join(full, f), "utf-8"), false);
      anchors.set(route, new Set(Array.from(md.matchAll(/^#{2,3}\s+(.+)$/gm)).map((m) => slugify(m[1]))));
    }
  }
  const resolves = (href: string, hash?: string) => {
    const route = href.replace(/\/$/, "") || "/";
    if (!routes.has(route)) return false;
    if (!hash || hash === "#") return true;
    const id = hash.slice(1);
    if (/^q\d+$/.test(id) && /^\/(exams|questions)\//.test(route)) return true;
    const a = anchors.get(route);
    return !a || a.has(id);
  };

  const hidden = new Set(nav.flatMap((s) => s.items.filter((i) => s.extra || i.extra).map((i) => i.href)).filter((h) => h.startsWith("/")));
  const LINK = /\]\((\/[^)\s#]*)(#[^)\s]*)?\)/g;
  let visCount = 0;
  let linkCount = 0;
  for (const rel of mdFiles) {
    const raw = fs.readFileSync(path.join(ROOT, "content", rel), "utf-8");
    for (const e of brokenMarkers(raw)) fail(`${rel}:${e}`);
    // In exam mode, what is visible must not send the reader to a hidden page.
    if (!hidden.has(`/${rel.replace(/\.md$/, "")}`))
      for (const l of applyMode(raw, true).matchAll(LINK)) {
        const href = l[1].replace(/\/$/, "") || "/";
        if (hidden.has(href)) soft(`${rel} (exam mode) links to a hidden page: ${href}`);
      }
    const lines = raw.split("\n");
    let fence: string | null = null;
    lines.forEach((line, i) => {
      const where = `${rel}:${i + 1}`;
      const f = line.match(/^```(\w*)/);
      if (f) {
        if (fence === null) {
          fence = f[1] || "code";
          const first = (lines.slice(i + 1).find((l) => l.trim() !== "") ?? "").trim();
          if (fence === "text" && !CONSOLE.test(first))
            soft(`${where} uses \`\`\`text and it does not look like console output (drawings go in a diagram block or a fig)`);
        } else if (line.trim() === "```") fence = null;
        return;
      }
      if (fence !== null) {
        if (line.startsWith("## ")) fail(`${where} a line inside a fenced block starts with "## " (it splits the question in loadExam)`);
        return;
      }
      const v = line.trim().match(/^\[\[vis:([\w:,-]+)\]\]$/);
      if (v) {
        visCount++;
        const [kind, first = ""] = v[1].split(":");
        if (kind === "fig") {
          if (!figIds.has(first)) soft(`${where} unknown figure: ${first}`);
        } else if (kind === "classify") {
          if (!DATASETS[first]) soft(`${where} unknown classifier dataset: ${first}`);
        } else if (!KINDS[kind]) soft(`${where} unknown kind: ${kind}`);
        else if (!KINDS[kind].includes(first)) soft(`${where} unknown preset: ${kind}:${first}`);
      } else if (line.includes("[[vis:")) soft(`${where} a [[vis:…]] marker must be alone on its line`);
      for (const l of line.matchAll(LINK)) {
        linkCount++;
        if (!resolves(l[1], l[2])) soft(`${where} broken link: ${l[1]}${l[2] ?? ""}`);
      }
    });
  }

  // Internal hrefs written in the TSX pages and components.
  let tsxLinks = 0;
  for (const f of [...walk(path.join(ROOT, "app")), ...walk(path.join(ROOT, "components"))].filter((f) => f.endsWith(".tsx"))) {
    const src = fs.readFileSync(f, "utf-8");
    for (const m of src.matchAll(/["'`](\/(?:topics|guides|questions|exams|simulators|quiz)[^"'`#\s]*)(#[^"'`\s]*)?["'`]/g)) {
      tsxLinks++;
      if (!resolves(m[1], m[2])) soft(`${path.relative(ROOT, f)} links to ${m[1]}${m[2] ?? ""}, which does not exist`);
    }
  }

  for (const s of nav)
    for (const it of s.items) {
      const [h, hash] = it.href.split("#");
      if (it.href.startsWith("/") && !resolves(h, hash ? `#${hash}` : undefined)) soft(`nav: ${it.title} → ${it.href} does not exist`);
    }

  const ids = new Set<string>();
  for (const q of allQuestions) {
    if (ids.has(q.id)) fail(`quiz: duplicated id ${q.id}`);
    ids.add(q.id);
    if (q.options.length < 2) fail(`quiz: ${q.id} has fewer than 2 options`);
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) fail(`quiz: ${q.id} has its answer out of range`);
    if (!(QUIZ_TOPICS as readonly string[]).includes(q.topic)) fail(`quiz: ${q.id} has an unknown topic ${q.topic}`);
    if (q.link) {
      const [h, hash] = q.link.split("#");
      if (!resolves(h, hash ? `#${hash}` : undefined)) soft(`quiz: ${q.id} links to ${q.link}, which does not exist`);
      if (!q.extra && hidden.has(h)) soft(`quiz: ${q.id} (visible in exam mode) links to a hidden page: ${h}`);
    }
  }
  for (const [id, ds] of Object.entries(DATASETS))
    for (const it of ds.items) if (!ds.cats.some((c) => c.id === it.cat)) fail(`classifier ${id}: "${it.text}" has an unknown category ${it.cat}`);

  console.log(
    `  · ${mdFiles.length} content files, ${visCount} visuals, ${linkCount} markdown links, ${tsxLinks} TSX links, ${figIds.size} figures, ${allQuestions.length} quiz questions`,
  );
}

console.log(fails ? `\n${fails} FAILURES${warns ? ` · ${warns} warnings` : ""}` : warns ? `\nAll OK · ${warns} warnings (run with --strict before shipping)` : "\nAll OK");
process.exit(fails ? 1 : 0);
