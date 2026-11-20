# Stage lessons: isometric, step-by-step

The second portal style. Instead of reading pages with diagrams, the learner walks through **lessons**: a list of steps, each one a short text next to an **isometric 3D scene** that animates from the previous step. Use it when the subject is a *mechanism with parts that interact* (a circuit, a protocol between machines, a CPU executing an instruction, a data structure being mutated, a physical setup) and the learner should *watch it happen* one change at a time. It is the closest thing to a teacher drawing on a whiteboard and adding one piece per sentence.

The framework is in `template-stage/` (`lib/stage/*`, `components/stage/*`). It is plain React + SVG: no WebGL, no animation library.

## When to pick it (and when not)

| Pick stage lessons | Keep the classic style |
|---|---|
| The idea is a machine with parts: who talks to whom, what lights up, what moves | The idea is a definition, a proof, a long derivation |
| The learner must defend or explain a design (oral exam, presentation) | The learner must solve written exercises fast |
| Order matters: "first this, then that" | Lookup matters: tables, formulas, cheat sheets |
| A few dozen steps cover the subject | Hundreds of facts, best searched |

They mix well: lessons for the mechanisms, classic topic pages, quiz and exams for the rest (link between them).

## Why isometric SVG and not WebGL

Tried and measured on real portals:

- **Text stays crisp.** Labels, register values, code lines and subscripts (S̅₁, Q₀) are real text at any zoom. In WebGL they are textures or HTML overlays that drift.
- **Theming is free.** Every face is filled from CSS variables (`--c1/--c2/--c3` per tone), so light and dark mode, and color changes between steps, are a class change with a CSS transition.
- **Deterministic and testable.** A scene is JSON; the same JSON always draws the same picture; `verify` can check every anchor and every number without a browser.
- **Small and fast.** No 600 KB 3D runtime; a scene of 80 entities re-renders at 60 fps during transitions and costs nothing when idle.
- **Server-rendered.** The first frame is in the HTML (screenshots, no-JS, print).

Reach for three.js / react-three-fiber only when the subject is genuinely spatial and the learner must *orbit* it (molecules, mechanics, anatomy). Teaching diagrams don't need a free camera; they need a good fixed angle.

## How it works

```
content/<area>/<lesson>.ts  ──(pure functions + engines)──▶  Lesson { steps: Step[] }   (JSON)
                                                                │
app/[chapter]/[lesson]/page.tsx (server) ──────────────────────▶ LessonView (client)
                                                                │
                                         Stage: plan(prev → next) → frameAt(t) → SVG
```

1. **A step declares its whole scene.** Not "move the car": the scene *with the car where it is now*. The stage diffs consecutive scenes.
2. **The stage animates the difference** (`lib/stage/anim.ts`):
   - entities only in the old scene **exit** (sink and fade, 380 ms);
   - entities in both **move** (x, y, z, w, d, h, lift and the type's `tween` fields interpolate, 760 ms, ease in-out);
   - entities only in the new scene **enter** (drop in with a little bounce, staggered 90 ms in declaration order);
   - new links **draw** themselves (stroke-dashoffset) once both ends are in place;
   - non-numeric props (tone, text, `on`, `value`) switch when the move starts; color changes fade via CSS;
   - the **camera** (viewBox) re-fits to the new scene, or to `focus` ids, at the same time.
   Change step mid-transition and the next plan starts from what is on screen (no jumps).
3. **Flows** (packets travelling along links) run in their own loop once the step settles.
4. **Pills** (labels) and link labels keep a constant screen size; geometry and decals scale with the camera.

## The scene language (`lib/stage/types.ts`)

Isometric grid: **+x goes down-right, +y goes down-left, +z goes up**. One grid unit ≈ 24 px before the camera. Bigger x + y = closer to the viewer. Visible faces of a box: `top`, `left` (the +y face) and `right` (the +x face).

```ts
const step: Step = {
  short: "1,0",                       // stepper label, ≤ 14 chars
  kind: "problem",                    // badge; kinds and their labels live in lib/ui.ts (KINDS)
  title: "Pisa S₁: 1,0",
  body: ["Primero pisa **S₁**: los sensores dan **1,0**."],   // 1–4 short paragraphs; **bold**, `code`, [link](/x), S̅₁
  callout: { kind: "say", text: "“…”" },                     // idea | say | warning | source | board (lib/ui.ts, CALLOUTS)
  changes: ["~ S₁ = 1", "+ EN", "− el auto fantasma"],        // «what changed»: + added, ~ changed, − removed
  scene: {
    entities: {
      road: { type: "slab", x: -1.5, y: 0, w: 18, d: 3, h: 0.15, tone: "slate", lane: true },
      s1:   { type: "sensor", x: 3.75, y: 0.2, z: 0.15, w: 0.5, d: 2.6, on: true, pills: [pill("S₁ = 1", "top", "amber")] },
      car:  { type: "car", x: 2.4, y: 0.8, z: 0.15, w: 2, d: 1.4, h: 1.25 },
    },
    links: { w: { pts: ["s1.s", [4, 5], "fsm.n"], level: 1, tone: "amber", label: "S₁" } },
    flows: [{ link: "w", tone: "amber", label: "1" }],
  },
  cards: [{ kind: "wave", id: "sec", title: "La secuencia", rows: [...], at: 1 }],
  metrics: { s1s2: "1,0" },           // values for the lesson's metric strip; omitted ones carry over; null = «—»
  focus: ["car", "s1"], zoom: 1.2,    // optional camera
};
```

**Entities** share `x, y, z, w, d, h, tone, text, pills, dim, glow, lift, layer` and add their own props. Catalogue (see `/pieces` in the template for a live gallery):

| Kit | Type | Own props |
|---|---|---|
| core | `box` | `text` (upright, on top), `faces: {top,left,right}` (text on a face) |
| core | `slab` | floor board: `title`, `style: "dashed"` (zone), `lane` (road marking) |
| core | `tile` | flat tile: `big`, `small` (Karnaugh cells, addresses) |
| core | `cyl` | cylinder, `w` = diameter |
| core | `tank` | `fill` 0..1 (tweens), `marks: [{at, text}]` (counters, capacitors, queues) |
| core | `bits` | `value`, `names` (MSB→LSB), `hl` (raised bits), `n` |
| core | `mem` | `rows: [{addr, name, value, hl}]` along +y; anchors `r0…` |
| core | `label` | free text at a point |
| electronics | `chip`, `block` | `name`, `pins: {e,s,w,n}` (anchors = pin names), `hiPins`, `litPins` |
| electronics | `seg7` | `segs` (bit0 = a … bit6 = g), `on`, `level` (brightness) |
| electronics | `led`, `ledbar` | `on` / `value`, `names` |
| electronics | `pot`, `switch` | `v` 0..1 (tweens) / `on` |
| electronics | `gate` | `kind: and | or | not | nand | nor`, `inputs`; anchors `in0…`, `out` |
| electronics | `state` | FSM state disc: `name`, `out` |
| electronics | `car`, `sensor`, `lamp`, `barrier` | `on` |

**Anchors** for links: every entity has `c`, `top`, `n`, `s`, `e`, `w`, `ne`, `nw`, `se`, `sw` (at its base height); kits add their own (`pic.RB0`, `reg.b7`, `mem.r2`, `gate.out`). A link point is either `[x, y]` / `[x, y, z]` or `"id.anchor"`. Route links along the grid axes with explicit corner points; wires on the floor read as PCB traces.

**Links**: `tone`, `style` (`dashed`, `dotted`), `heads`, `label` + `labelAt`, `level: 0 | 1` (grey or lit with glow, for digital signals), `bus: n` (thick).

**Cards** (HTML, beside the scene on desktop, below it on phones): `code` (lines, `first`, `hl`), `kv`, `table` (`hl` rows, `hlCols`), `text`, `calc` (lines + `result`), `wave` (timing diagram: rows of 0/1 or bus values, cursor `at`), `bits`. `wide: true` widens the column; `cardsAt: "left"` moves it.

## Authoring rules

1. **One change per step.** If two things change, that is two steps. The learner's eye follows the motion; two simultaneous motions split it.
2. **Build the world with pure functions, then vary it.** `world(state, opts) → Scene` in `content/<area>/mundo.ts`; each step calls it with the engine state of that moment. Never hand-copy a scene and edit coordinates per step.
3. **Numbers come from engines.** Positions, register values, timings: computed by the area's pure engine (the same one the checks run), never typed in the lesson. If the engine says the car covers S₁ at this step, the drawing can't disagree.
4. **Keep ids stable across steps** (`car` stays `car`), otherwise it exits and re-enters instead of moving. Use a new id when you *want* the enter animation.
5. **Text is short.** 1–4 paragraphs of ≤ 2 sentences, bold the keywords. The scene carries the explanation; the text names what to look at.
6. **Pills over labels on the floor.** Pills stay readable at any zoom; use `side` to avoid collisions (top/bottom alternate for close neighbours).
7. **Dim, don't delete,** to focus: `focusOn(scene, ids)` keeps the context visible at 30 %.
8. **Each lesson ends with a defence/summary step**: what to say, what to draw on the board.
9. **Metrics strip** = the 3–6 values a student would track by hand (state, inputs, a register, a time). Changing ones flash.
10. **Subscripts and overlines as real characters** (S₁, Q̅, R̅): the renderer turns letter + U+0305 into a proper overline in HTML and SVG.

## Building blocks (`lib/stage/build.ts`)

`scene(...parts)` merges, `patch(scene, {id: {...}})` edits, `focusOn(scene, ids)` dims the rest, `without(scene, ids)`, `only(scene, ids)`, `pill(text, side, tone)`.

## Adding a piece

A new entity type is two entries with the same name: geometry in `lib/stage/geom.ts` (or `lib/stage/areas/<area>.ts`) — default size, `floor`, `round`, `tween` fields, `anchors` — and a renderer in `components/stage/kits/<kit>.tsx` built from the primitives in `components/stage/prims.tsx`:

- `IsoBox` (three shaded faces), `IsoCyl`, `Halo` / `HaloRound`;
- `OnFace face b` — draw any SVG in a face's plane, local units = grid units (u across, v down);
- `FaceText` — text on a face (`up` runs it along −y on the top face);
- `Upright` — upright text at a 3D point with a minimum screen size.

Use tone classes (`tone-<name>` → `f1/f2/f3/fi`) instead of literal colors so both themes work. `verify` fails if a type has geometry but no renderer or the reverse.

## Verifying

- `npm run verify`: every lesson serializes, every entity type exists, every link anchor resolves, every flow has its link, short labels fit, metrics are declared, notation is clean; plus the area's canonical checks (`scripts/checks/<area>.ts`).
- **Look at every step**: `node scripts/shot-steps.mjs /<chapter>/<lesson>` (all steps, `?anim=0`), with `--dark`, `--mobile`, and `--mid=400` (a frame halfway through the transition into that step). On Git Bash prefix `MSYS_NO_PATHCONV=1` or the route becomes a Windows path. Read the PNGs: pills colliding, text under an entity, a link ending in the void, a camera that cuts something.
- Keyboard: ← → steps, R replays the transition, Space pauses flows. URL `?step=N` deep-links a step.

## Pitfalls seen in practice

- **Face decals scaled wrong**: `faceMatrix` maps 1 local unit to 1 grid unit (U px). Dividing by U makes every decal 24× too small and invisible; the kit gallery catches it.
- **Long scenes get tiny.** A 20-unit road is 400 px wide before zoom; compress what doesn't matter (a piecewise scale after the interesting part) and check that the compressed drawing still agrees with the engine.
- **Monospace fonts without subscript glyphs** render S₁ as a fallback glyph at the wrong height. JetBrains Mono has them; check the gallery after changing fonts.
- **Cards steal width.** A three-column table in a 310 px column overflows; mark it `wide` or move the content into the text.
- **Dimmed things vanish in dark mode** at 30 %; the template uses 45 % there.
- **Pills swamp a phone screen.** They keep a fixed screen size while the scene shrinks; the stage scales them by `hudOf(width)` (down to 0.7) and the camera fit accounts for it. Still keep pill text short.
- **`text-decoration: overline` gets clipped** on the first line of a scrolling box; the template draws the negation bar with a pseudo-element (`.ovl::after`).
- **Link labels count for the camera.** `fitCamera` adds pill and link-label rectangles (measured at the current zoom, in two passes); a label far from everything else shrinks the whole scene, so keep labels near their wire.
- **A graph laid out along one axis is long and thin** on an isometric stage (every axis is a diagonal on screen). Lay graphs out as a square or diamond in the grid: it fills the landscape stage much better.
- **Interface strings** (step kinds, callouts, buttons) live in `lib/ui.ts`: translate that file, not the components.
- **Same id, different link route** is treated as remove + add (redraw); keep the same `pts` if the wire did not change.
