# Visual toolkit

Pick the **cheapest visual that shows the idea**. A diagram block takes 5 lines of markdown, a figure takes 50–150 lines of TSX, and a simulator takes an engine, a component and checks. Spend the effort where the student's confusion is.

## Decision table

| The idea is… | Use | Example |
|---|---|---|
| A method or procedure with numbered steps | ```` ```steps ```` | "Binary search by hand in 5 steps" |
| A pipeline, a transformation or a chain of layers | ```` ```flow ```` | source → compiler → binary → CPU |
| Messages or signals between actors over time | ```` ```sequence ```` | client/server handshake, thread A signals B |
| A hierarchy, decision tree or probability tree | ```` ```tree ```` | process tree after `fork()`, cache hit/miss odds |
| Who does what over a timeline, to scale | ```` ```gantt ```` | CPU scheduling, a thread blocked until t = 6 |
| Items waiting in queues or levels | ```` ```queues ```` | ready queue, multilevel priorities |
| A precise structural drawing, used often | SVG figure `[[vis:fig:<id>]]` | memory layout, protocol state machine, RAID layout |
| A fixed set of actors exchanging messages, with variants | `FlowSim` (data-described) | normal vs lost-packet scenario |
| A mechanism whose internal state evolves | engine + `Stage` + `Player` | algorithm trace, CPU + cache + RAM "film" |
| "Which category is this?" | `[[vis:classify:<id>]]` | O(1) / O(log n) / O(n) |
| One moment of a simulator, inside a solution | frozen mode `[[vis:<kind>:<preset>:sheet[:n]]]` | the trace after step 3 |
| A calculation | KaTeX `aligned`, or a table | $\lceil \log_2 1000 \rceil = 10$ |
| Literal console output | ```` ```text ```` (the **only** use) | `ls -l` output |

**Never** draw with ASCII in a ```` ```text ```` block. `verify` rejects it unless the first line looks like console output.

## Markdown diagram blocks
The authoritative syntax is the header comment of each component in `components/diagrams/`. Read it before writing a block. Summary below. Every block accepts `{ok}` `{bad}` `{warn}` `{info}` at the end of a line or node to color it.

### ```steps
```text
title: Binary search in 5 steps          (optional)
1. Range | lo = 0, hi = n − 1
   - a bullet
   > target < a[mid] => hi = mid − 1 | discard the right half
2. Probe | mid = ⌊(lo + hi) / 2⌋ {ok}
```
A step starts at column 0 (`N. Title | description`, where N is a number or a letter). Indented lines are bullets, `> A => B | note` "if you see A → do B" rows, or more description. `summary: no` hides the chip strip shown for 4+ steps.

### ```flow
```text
title: From source to running program     (optional)
direction: vertical                        (optional)
Compiled :: hello.c|source -(gcc)-> [compiler] -> hello|executable -> ((CPU))
```
Nodes: `text|sub` (data), `[text|sub]` (a step that processes), `((text|sub))` (destination). Arrows: `->`, `-(label)->`, `~>` and `~(label)~>` (dashed), `<->` and `<-(label)->` (both ways). `Row name :: …` names a row; one chain per line.

### ```sequence
```text
title: TCP three-way handshake
actors: C = Client, S = Server
C -> S: SYN seq=100
S -> C: SYN-ACK seq=300 ack=101
@t=40 C: ESTABLISHED {ok}
C --> S: ACK ack=301 #R1
--- data transfer ---
note: a full-width note
```
Messages: `A -> B: label`, `A -> B: sent => received` or `A -> B: sent => label => received`. `-->` is dashed (async or interrupt). `A+B: text` spans columns, `#R1` adds a tag and `@t=…` writes a time in the left column.

### ```tree
```text
title: One memory access
direction: horizontal                       (optional)
1 access
  [95 %] cache HIT | 2 ns {ok}
  [5 %] MISS → RAM | 10 ns
    [1 %] disk | 1,000,000 ns {bad}
```
Two-space indentation marks children, and `[edge label]` labels the incoming edge. Several top-level lines draw a forest.

### ```gantt
```text
title: FCFS in order P1, P2, P3
scale: 0 30                                  (optional)
ticks: 0 24 27 30 | units                    (optional; "no" = illustrative times)
lines: 24 "P1 ends"                          (optional)
CPU: 0-24 P1, 24-27 P2, 27-30 P3
HIGH: 1-2, 2-10 blocked "waits for the mutex"
MED: 3-10> run "no limit"
```
Segments are `start-end [name|state] ["text"]`, and `>` draws an open end. States: `run`, `blocked`, `ready`, `io`, `spin`, `idle`. A named segment always gets that name's color.

### ```queues
```text
title: Multilevel queue
arrows: yes                                   (optional)
exit: CPU                                     (optional)
level 1: P2 | always served first
level 3: P3 P1 | round robin q = 2 {warn}
```

## SVG figures
`components/figures/Figs<Area>.tsx`: one component per figure, drawn with `draw.tsx`:
- `T` theme tokens (`T.fg`, `T.muted`, `T.card`, `T.border`, `T.accent`) and `tint(color, pct)` for fills;
- `Box({x, y, w, h, label, sub?, fill?, stroke?})` and `Arrow({x1, y1, x2, y2, label?, dashed?, color?})`.

Use a `viewBox` and `width="100%"`. Put labels next to arrows, not on top of them. End the file with `export const FIGS_<AREA> = {` and one `  "id": Component,` per line (verify parses it), and spread it into `FIGS` in `Figs.tsx`.

## Step simulators: `Stage` + `Player`
`components/steps/Stage.tsx` holds SVG primitives in the style of lecture slides: dashed containers, rounded boxes, the active element in indigo.
- `Stage {w, h, minW?}`: a viewBox canvas that scales to its container and scrolls inside its card below `minW`.
- `Group {x, y, w, h, label?, tone?}`: a dashed container ("Kernel space", "Host").
- `Box {x, y, w, h, title?, sub?, value?, tone?, badge?, dashed?}`: tones are `idle | active | ok | bad | warn | info | dim`.
- `Arrow {x1, y1, x2, y2, label?, tone?, dashed?, curve?, play?, both?}`: arrow tones are `req | res | async | data | ctrl | bad | muted`. **When `play` changes, a packet travels along the arrow**, so pass the step index to animate the arrow that just fired.
- `link(a, b, offset?, gap?)` gives arrow coordinates between two rects' borders (use `offset` for parallel request/response arrows).
- `Chip`, `Label {tone: muted|strong|accent|ok|bad|warn}`, `Lifeline`.

`components/steps/Player.tsx` is a controlled player: `{step, total, setStep, title?, desc?, intervalMs?}`. It shows the mono step title and narration, then ← Previous · dots (clickable; a progress bar when there are many) · Next →, plus autoplay. Keyboard ←/→/space goes to the first player visible on screen.

The typical component (see `components/example/BinarySearchSim.tsx`):
```tsx
export default function Sim({ preset }: { preset?: string }) {
  const [name, mode, n] = (preset ?? "basic").split(":");
  if (mode === "sheet") return <Sheet preset={name} at={n ? Number(n) : undefined} />;
  return <Interactive key={name} initial={name} />;     // key resets state on preset change
}
function Interactive({ initial }) {
  const steps = useMemo(() => run(initial), [initial]);
  const [i, setI] = useState(0);
  const s = steps[i];
  return (<>
    <Stage w={900} h={360}>{/* draw s.state; tone "active" on s.highlight; Arrow play={i} */}</Stage>
    <Player step={i} total={steps.length} setStep={setI} title={s.title} desc={s.text} />
  </>);
}
```
Offer preset tabs (`Pills` from `components/ui/ui.tsx`) for the slide example and each past-exam instance, and toggles for course conventions.

## Data-described scenes: `FlowSim`
For a fixed cast of boxes exchanging messages, describe the scene once and each scenario as data. No drawing code is needed (see `components/example/HandshakeSim.tsx`):
```tsx
<FlowSim w={1140} h={380} nodes={NODES} groups={GROUPS} scenarios={[
  { id: "normal", label: "Normal", steps: [
    { title: "1 · SYN", desc: <>Client picks x = 100…</>, active: ["client"],
      values: { client: "SYN-SENT" }, arrows: [{ from: "client", to: "server", label: "SYN seq=100", tone: "req" }] },
    // …
  ]},
]} lockScenario={solo} />
```
`FlowStep` fields: `title`, `desc`, `tones` / `active`, `values`, `subs`, `badges`, `groupTones`, `arrows` (`{from, to, label?, tone?, dashed?, offset?, curve?}`) and `panel` (a ReactNode under the diagram, for headers, a table or JSON). If the values come from an engine (e.g. TCP states and sequence numbers), generate the steps from the engine's trace and keep only narration in the component.

## The "film": a whole system in slow motion
For the highest-value concept of a course, build one big scene with every component on screen. For an OS course that's CPU registers, cache, RAM with user/kernel zones, clock, disk and a "who owns the CPU" strip. Then play several scripted "films" over it (race condition, mutex, deadlock). Engine side: see "The film pattern" in `engines-and-verification.md`. UI side: one `Stage` with a full-screen toggle and an autoplay speed control. Route arrows around boxes (arrows into a memory block enter at its border; arrows between non-adjacent registers go around the side). Place it first in "Start here": it's the map of the whole subject.

## Layout tips that matter
- Design scenes at ~900–1150 px wide. Text below ~12 px in viewBox units becomes unreadable on phones.
- Leave room for arrow labels: packet labels overlapping boxes is the most common defect, and only screenshots reveal it.
- Use the `idle` tone for everything that didn't change in this step. Highlighting everything highlights nothing.
- Keep narration to 1–2 sentences. Put long explanations in the topic text around the visual.
