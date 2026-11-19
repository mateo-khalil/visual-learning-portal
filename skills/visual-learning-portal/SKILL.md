---
name: visual-learning-portal
description: Build a visual-first educational web portal for studying a subject or preparing an exam. You get theory pages with real drawn diagrams, step-by-step animated simulators driven by pure engines, worked "by hand" guides, solved past exams, a quiz and progress tracking, all as a static Next.js site. Use when the user asks for a study portal, study site, interactive course notes, an exam-prep website, "explain this subject visually", animated explanations or simulators of a mechanism (algorithms, operating systems, networks, databases, physics, finance…), or wants to turn slides, PDFs or past exams into an interactive learning site.
---

# Visual Learning Portal

Turn course material (slides, textbooks, past exams) into a static website where **every idea is drawn before it is written**. The learner gets the intuition from a picture or an animation, the exam answer from a short "for the sheet" box, and the formula as backup.

The approach was refined across several real exam-prep portals. The template in `template/` is a working, domain-neutral starter. It ships with the shell, the diagram language, the step player and a complete example area. Copy it and fill it with the new subject.

## Non-negotiables

1. **Visual first.** Anything that is conceptually a picture (a pipeline, a timeline, a tree, a state change, an exchange of messages, a memory layout) gets *rendered*: a diagram block, an SVG figure or a simulator. Never ASCII art in a ```` ```text ```` block. Calculations go in KaTeX (`aligned`) or tables. ```` ```text ```` is only for literal console output.
2. **Pure engine → immutable steps → UI replays them.** Every simulator computes its whole run up front in a pure TypeScript function (`run(preset) → Step[]`). The React component only draws `steps[i]`. Narration text describes the state; it never *is* the state. That makes the simulators correct, testable and easy to scrub back and forth.
3. **Canonical results are tested.** Every number the portal claims (the slide's worked example, the past exam's answer) is asserted in `scripts/checks/<area>.ts`. `npm run verify` must print "All OK" before you call anything done.
4. **Sized to the exam, not the book.** Depth = what the recent exams and the course slides ask for. Anything deeper goes in `<!-- extra -->` blocks, hidden by `EXAM_MODE`, never deleted.
5. **Every past-exam question has an answer**, even off-scope ones (flag those as "out of scope, answered anyway").
6. **The course's own terminology wins.** If the slides and the textbook disagree, say so on the page and recommend what to write on the exam.
7. **Respect the user's scope list.** If they say a topic is out, it is out of the nav. Topics that only appear in the slides get marked lower priority.
8. **Write in the learner's language** (the template's UI strings live in a few components and `lib/site.ts`; translate them in the first step). Match their register.

## Workflow

### 1. Gather and scope (before any code)
- Find the sources: slides, textbook chapters, past exams with official solutions if they exist. Keep them in `materials/` (git-ignored, excluded from deploy). Extract text with `pdftotext -layout` for fast reading. Slides have diagrams that the text loses, so open the PDF pages themselves when a slide is mostly a drawing.
- Build the **exam map**: a table of every past question with date, number, points and topic. Its union is the depth target. Repeated questions get answered once and marked "asked in both".
- Agree on scope with the user in one short message only if it is genuinely unclear. Otherwise take it from what they said and from the exams.
- Fill in `template/PORTAL.md`: scope in/out, sources, canonical results, decisions where sources disagree. It becomes the project's `CLAUDE.md`/`AGENTS.md` so later sessions keep the rules.

### 2. Scaffold
```bash
cp -R <skill-dir>/template <new-portal> && cd <new-portal>
pnpm install            # or npm install
pnpm dev                # http://localhost:3000
```
Then set `lib/site.ts` (name, tagline, locale, `storagePrefix`, nav) and translate the UI strings if the portal isn't in English. Delete the example area (`lib/example`, `components/example`, `FigsExample`, example content, checks and quiz) once your first real area works. Until then it's your reference implementation.

### 3. Design the visuals per topic
For each topic, list the 2–5 things a student must *see* to understand it, then pick the cheapest visual that shows each one. Read `references/visual-toolkit.md` for the decision table and the syntax:
- static structure or a pipeline → a markdown diagram block (```` ```flow ````, ```` ```tree ````, ```` ```steps ````, ```` ```gantt ````, ```` ```sequence ````, ```` ```queues ````)
- a one-off precise drawing → an SVG figure (`[[vis:fig:<id>]]`)
- an exchange of messages between fixed actors → a data-described `FlowSim`
- a mechanism whose state evolves (an algorithm, a machine, a protocol with state) → engine + `Stage` + `Player` simulator
- "which category does this belong to" → a classifier (`[[vis:classify:<id>]]`)
- the state of a simulator at one moment, inside a solution → a frozen preset (`…:sheet`), so the drawing matches the interactive one exactly

### 4. Build engines first, then UI
Write the engine and its checks before its component (see `references/engines-and-verification.md`). Encode the course's examples and every past-exam instance as named presets. When the course has a convention choice (tie-breaking, what happens first in the same tick), make it an explicit option with the course's default and show it as a toggle.

### 5. Write the content
Follow the page anatomy in `references/content-authoring.md`. In short: topics open with a "✍️ For the sheet" box and "The idea in 30 seconds". Then comes one drawing per idea, the interactive visuals, "On the exam", "Common mistakes" and "👉 Review". Guides teach the paper procedure. Exams use the `## Question` + `### Solution` format and every solution starts with the direct answer.

### 6. Verify, look, ship
- `npm run verify` (canonical checks + content integrity, `--strict`), `npm run build` and `npm run lint` must all be green.
- **Look at it.** Screenshot the pages you touched with `scripts/shot.sh <route> <png>` (desktop) and `scripts/shot-mobile.sh` (390 px), in dark and light, and read the PNGs. Check that labels don't collide, nothing scrolls the page horizontally, and arrows land on their boxes. A diagram that type-checks can still be unreadable.
- Deploy as a static site (Vercel or any static host). Commit to the user's repo if they want one.

## Scaling up with parallel agents
For a large subject, use the contract-first split in `references/parallel-build.md`. Set up the registries, stubs and an ownership table first, then give one agent per area, each owning its files exclusively, and run `verify --strict` as the integration gate. Only fan out when the user wants speed or asks for it, because it costs a lot of tokens.

## Reference files
- `references/pedagogy.md`: the teaching principles and why they work. Read it first on a new portal.
- `references/architecture.md`: folder layout, the content pipeline, markers, registries, exam mode.
- `references/visual-toolkit.md`: which visual for which idea, DSL syntax, figures, Stage/Player/FlowSim, the "film" pattern.
- `references/engines-and-verification.md`: writing engines, presets, checks and the verify script.
- `references/content-authoring.md`: page templates for topics, guides, question banks and exams, plus style rules.
- `references/parallel-build.md`: the contract-first multi-agent build.
- `references/quality-checklist.md`: the checklist to run before saying "done".
