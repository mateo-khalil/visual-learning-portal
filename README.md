# Visual Learning Portal

**An agent skill for building visual-first educational websites.** Hand an AI coding agent your course material (slides, textbook chapters, past exams, a delivered project) and it builds a static study portal. Every idea in it is *drawn before it is written*, in one of two styles:

- **Classic**: rendered diagrams, animated step-by-step simulators, worked "by hand" guides, solved past exams, a quiz and progress tracking.
- **Stage**: an interactive course of step-by-step lessons on **animated isometric 3D scenes**. Each step changes one thing: parts drop in, wires light up with their logic level, packets travel, the camera re-frames.

<p align="center">
  <img src="docs/topic.png" width="49%" alt="A topic page: summary box, a drawn diagram and a numbered method">
  <img src="docs/simulator.png" width="49%" alt="A step-by-step simulator of the TCP handshake">
</p>

<p align="center">
  <img src="docs/stage-lesson.png" width="49%" alt="A stage lesson: binary search on an isometric array, the camera following the candidate range">
  <img src="docs/stage-flows.png" width="49%" alt="A stage lesson: the TCP handshake with packets on the wires and a retransmission timer">
</p>

The approach was refined on real exam-prep portals that students studied from. It's written down so that any agent can do the same for any subject: algorithms, operating systems, networking, databases, physics, finance and so on.

## What's inside

```
skills/visual-learning-portal/
├── SKILL.md                 the workflow and the non-negotiables (entry point)
├── references/
│   ├── pedagogy.md          why the portal looks like this: picture → intuition → formula
│   ├── architecture.md      Next.js layout, content pipeline, markers, registries, exam mode
│   ├── visual-toolkit.md    which visual for which idea; diagram DSLs; Stage/Player/FlowSim
│   ├── engines-and-verification.md   pure engines, immutable steps, canonical checks
│   ├── content-authoring.md page anatomy for topics, guides, question banks and exams
│   ├── parallel-build.md    contract-first multi-agent build, one owner per file
│   ├── quality-checklist.md what "done" means
│   └── stage-lessons.md     the stage style: animation model, scene language, pieces, pitfalls
├── template/                classic: a working Next.js 16 starter with a complete example area
└── template-stage/          stage: the isometric lesson framework with two example lessons
```

### The template
A domain-neutral, fully static portal (Next.js 16 · React 19 · TypeScript strict · Tailwind CSS v4 · react-markdown with KaTeX) that ships with:

- **Six diagram languages written in Markdown**: `steps`, `flow`, `sequence`, `tree`, `gantt` and `queues`. They're rendered as SVG and readable in light and dark mode, so no ASCII art is ever needed.
- **Step-by-step simulators**: SVG primitives in the style of lecture slides (`Stage`, `Box`, `Arrow` with animated packets), a keyboard-driven `Player`, and `FlowSim` for scenes described entirely as data.
- **Pure engines → immutable steps → UI replays them.** Simulators are correct by construction and testable without a browser.
- **Visual markers** like `[[vis:bsearch:basic]]` that embed simulators in Markdown, plus frozen snapshots (`:sheet`) for exam solutions.
- **Exam tooling**: past exams with collapsible solutions, a quiz with sources and best score, "✓ Studied" progress, and an **exam mode** that hides beyond-scope material without deleting it.
- **`npm run verify`** asserts every canonical result and checks content integrity: unknown visuals, broken links and anchors, ASCII diagrams, unbalanced markers.
- **Screenshot scripts** (desktop and 390 px mobile, dark and light) so the agent *looks* at what it built.
- An example area (binary search plus the TCP three-way handshake) that uses every pattern.

## Install

**As a Claude Code plugin:**
```
/plugin marketplace add mateo-khalil/visual-learning-portal
/plugin install visual-learning-portal@visual-learning-portal
```

**As a plain skill** (Claude Code, or any agent that reads `SKILL.md` folders):
```bash
git clone https://github.com/mateo-khalil/visual-learning-portal
cp -R visual-learning-portal/skills/visual-learning-portal ~/.claude/skills/
```
Copy it into a project's `.claude/skills/` instead to scope it to one repo.

## Use

Ask your agent something like:

> Build a visual study portal for my Operating Systems midterm. The slides are in `materials/`, and the past exams are `materials/exams/*.pdf`. Process scheduling and deadlocks are in scope; skip microkernels.

The skill walks the agent through it:
1. scope and an exam map;
2. scaffolding from the template;
3. choosing a visual per idea;
4. engines with checks;
5. content in the page anatomy;
6. `verify` + build + lint + screenshots.

### The stage template
Lessons are data: each step declares its whole isometric scene (entities, wires, packets) and the stage animates the difference from the previous step. Plain React + SVG, no WebGL: crisp text and subscripts, light and dark themes from CSS variables, deterministic scenes that `npm run verify` can check without a browser.

- **Pieces**: boxes, cylinders, tanks, tiles, registers of bits, memory rows, and an electronics kit (chips with named pins, logic gates, flip-flops, 7-segment displays, LEDs, potentiometers, switches, sensors).
- **Wires** routed on the grid with arrowheads, labels, logic levels (lit or grey) and buses; **flows** carry labelled packets along them.
- **Cards** beside the scene: code with highlighted lines, tables, calculations, timing diagrams, bit registers.
- **Lesson screen**: metrics strip, "what changed", "you will learn", keyboard (← → R Space), deep links (`?step=N`), progress in `localStorage`, mobile layout.
- **Screenshots per step** (`scripts/shot-steps.mjs`), including a frame halfway through a transition.

## Try the template directly

```bash
cp -R skills/visual-learning-portal/template my-portal && cd my-portal
npm install
npm run dev        # http://localhost:3000
npm run verify     # → All OK
```

The stage template works the same way: `cp -R skills/visual-learning-portal/template-stage my-course`.

## License

MIT
