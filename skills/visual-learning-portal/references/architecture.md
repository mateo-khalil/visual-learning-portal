# Architecture

Stack: **Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 · react-markdown** (remark-gfm, remark-math + rehype-katex, rehype-highlight). Everything is statically generated. The only client-side state is `localStorage`, for progress, quiz scores and the theme. There's no backend, database or auth, so it deploys anywhere as a static site.

> Next.js 16 has breaking changes compared with older versions. Before writing framework code, read the relevant guide in `node_modules/next/dist/docs/`. `next dev` writes an `AGENTS.md` reminding you of this. Keep it.

## Layout

```text
lib/site.ts                  name, tagline, locale, storagePrefix, nav (single source of truth)
lib/mode.ts                  EXAM_MODE + <!-- extra --> filtering
lib/content.ts               readContent / listContent / contentTitle (applies mode)
lib/markerSplit.ts           markdown → md | vis | diagram parts
lib/exams.ts                 "## Question" + "### Solution" parser for ExamView
lib/progress.ts, storage.ts  localStorage keys and helpers
lib/registry/{index,<area>}.ts   kinds → valid presets (generated from engines)
lib/<area>/*.ts              pure engines with PRESETS and run()
lib/data/quiz/<area>.ts      quiz questions        lib/data/classifiers/<area>.ts  classifier datasets

components/VisContent.tsx    renders md parts, diagrams and visuals
components/ExamView.tsx      question list with collapsible solutions
components/visuals/Vis.tsx   [[vis:kind:arg]] → component (switch on kind)
components/diagrams/*.tsx    the markdown diagram DSLs (syntax in each header comment)
components/figures/          Figs.tsx registry, draw.tsx helpers, Figs<Area>.tsx
components/steps/            Stage (SVG primitives), Player (step controls), FlowSim
components/StepPlayer.tsx    generic player for list-of-frames visuals
components/<area>/*.tsx      simulators for each area
components/{Quiz,Classifier,Sidebar,ThemeToggle,StudiedToggle,HomeProgress,SimLayout,PageHeader}.tsx

app/page.tsx                 home: hero, study plan, progress, cards
app/{topics,guides,questions,exams}/[slug]/page.tsx   SSG from content/
app/simulators/<name>/page.tsx                         one page per simulator
app/quiz/page.tsx

content/{topics,guides,questions,exams}/*.md
scripts/verify.ts, scripts/checks/<area>.ts, scripts/shot.sh, scripts/shot-mobile.sh
PORTAL.md                    the project brief (imported by CLAUDE.md)
materials/                   source PDFs and extracted text (git-ignored)
```

## The content pipeline

1. `readContent(dir, file)` reads the markdown and applies `EXAM_MODE`. That either removes the `<!-- extra -->` blocks or just their markers.
2. `splitParts(md)` walks the lines and emits three kinds of part:
   - `vis`: a line that is exactly `[[vis:<kind>[:<arg>…]]]`;
   - `dia`: a fenced block whose language is a diagram DSL (`steps`, `flow`, `sequence`, `tree`, `gantt`, `queues`);
   - `md`: everything else. Ordinary code fences are left alone.
3. `VisContent` renders `md` with react-markdown (headings get slug ids for anchors), `dia` with `components/diagrams/Diagram.tsx` in a card, and `vis` with `components/visuals/Vis.tsx` in a card labelled "Interactive" or "Diagram". Frozen modes and figures are labelled "Diagram".
4. `ExamView` uses `lib/exams.ts` to cut the file at `## ` headings and at `### Solution`, then renders each part through `VisContent`.

## Visual markers and registries
`[[vis:<kind>:<preset>[:<mode>…]]]` is split on the first `:`. `kind` selects the component in `Vis.tsx` and the rest arrives as the `preset` prop, so the component parses its own modes (`bsearch:basic:sheet:3` = preset `basic`, frozen at step 3). Two kinds are built in:
- `fig:<id>`: SVG figures registered in `FIGS_<AREA>` (`components/figures/Figs<Area>.tsx`, one `"id": Component,` per line at the end of the file).
- `classify:<id>`: drag/click-to-bucket exercises from `lib/data/classifiers/<area>.ts`.

Each area's `lib/registry/<area>.ts` exports `KINDS_<AREA>`, generated from its engines' `PRESETS`, and `lib/registry/index.ts` merges them. `verify` checks every marker in the content against it. **To add a kind**: write the engine with `PRESETS`, the component with `{ preset?: string }`, add a `case` in `Vis.tsx` and the kind in the area registry.

## Navigation, progress and modes
- `lib/site.ts` holds `nav: NavSection[]` (`{ title, href, badge?, extra? }`). Badges are conventions: `✎` paper procedure, `▶` animated simulator, `★` high exam value, `?` quiz, `↗` external. The sidebar, home cards and `verify` all read it.
- Progress: "✓ Studied" per page and the best quiz score, stored under `<storagePrefix>-progress` and `<storagePrefix>-quiz-best`. Give each portal its own prefix.
- `EXAM_MODE` (`lib/mode.ts`) hides `<!-- extra -->` content, nav items with `extra: true` and quiz items with `extra: true`. Set it to `false` for the full portal.
- Renamed pages need a redirect in `next.config.ts` (students bookmark pages).

## Theming and responsiveness
- Colors are CSS variables in `app/globals.css` (`--background`, `--foreground`, `--muted`, `--card`, `--border`, `--accent`), with a `.dark` class set before paint by an inline script in `layout.tsx`.
- Figures use `T` tokens and `tint(color, pct)` from `draw.tsx`. Stage boxes use the `Tone` system, whose Tailwind classes have dark variants. Never hard-code a text color.
- `Stage` keeps a minimum drawing width (`minW`, default `min(w, 620)`) and scrolls horizontally inside its card on phones, so the page itself never scrolls sideways.

## Deploy
`npm run build` produces a fully static site. On Vercel: `vercel --prod` (exclude `materials/` with `.vercelignore`). Any static host works.
