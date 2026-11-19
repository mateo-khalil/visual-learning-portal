# Visual study portal — starter template

A static Next.js site for studying one exam **visually**: topics explained with diagrams written in markdown, step-by-step simulators driven by pure engines, solved past exams with collapsible model answers, a quiz and a progress tracker. It ships with one small example area (binary search + the TCP handshake) that uses every pattern; replace it with your course.

## Run it

```bash
npm install          # or pnpm install (pnpm ≥ 10 may ask you to approve esbuild's build script)
npm run dev          # http://localhost:3000
npm run verify       # canonical results + content integrity → must print "All OK"
npm run build && npm run lint
```

Requires Node ≥ 20. Everything is prerendered (SSG); progress and quiz scores live in `localStorage`.

## Where things go

| What | Where |
|---|---|
| Name, tagline, `<html lang>`, storage prefix, sidebar | `lib/site.ts` |
| The project brief (scope, sources, results that must not break) | `PORTAL.md` |
| Topics · guides · question banks · exams (markdown) | `content/{topics,guides,questions,exams}/<slug>.md` → `/topics/<slug>`… |
| Simulator pages | `app/simulators/<name>/page.tsx` |
| Pure engines (presets + `run()` → frozen steps) | `lib/<area>/` (example: `lib/example/`) |
| Visual components that replay them | `components/<area>/` (example: `components/example/`) |
| `[[vis:kind:…]]` → component | `components/visuals/Vis.tsx`; valid presets in `lib/registry/<area>.ts` |
| Hand-drawn SVG figures | `components/figures/Figs<Area>.tsx` (registry object at the end), helpers in `draw.tsx` |
| Quiz questions · classifier datasets | `lib/data/quiz/<area>.ts` · `lib/data/classifiers/<area>.ts` |
| Canonical checks | `scripts/checks/<area>.ts`, registered in `scripts/verify.ts` |
| Hide beyond-the-course material | `lib/mode.ts` (`EXAM_MODE`, `<!-- extra -->` blocks, `extra: true`) |

## Writing content

- Embed a visual on its own line: `[[vis:bsearch:basic]]`, frozen for solutions `[[vis:bsearch:basic:sheet]]`, a figure `[[vis:fig:tcp-states]]`, a classifier `[[vis:classify:complexity]]`.
- Draw with fenced blocks: ```` ```steps ````, ```` ```flow ````, ```` ```sequence ````, ```` ```tree ````, ```` ```gantt ````, ```` ```queues ````. The syntax of each is the header comment of its component in `components/diagrams/`.
- Exams and question banks: `# Title`, optional `Meta: …`, an intro, then `## Question N — …` with `### Solution` under each one. `/exams/<slug>#q3` opens question 3's solution.
- Math with KaTeX (`$…$`, `$$…$$`); a literal dollar sign is `\$`.

## Screenshots

With the dev server running: `PORT=3000 scripts/shot.sh /topics/binary-search out.png [width] [height]` (`THEME=dark|light` to force a theme) and `scripts/shot-mobile.sh <route> out.png` for a 390 px phone. Uses Google Chrome (set `CHROME=` to another binary).
