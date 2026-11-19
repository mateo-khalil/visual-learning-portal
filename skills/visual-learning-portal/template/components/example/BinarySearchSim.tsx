"use client";

import { useMemo, useState } from "react";
import Player from "@/components/steps/Player";
import { Arrow, Box, Chip, Group, Label, Stage, ARROW_COLORS, type Tone } from "@/components/steps/Stage";
import { Pills } from "@/components/ui/ui";
import {
  BSEARCH_PRESETS,
  PRESETS,
  isBsearchPreset,
  run,
  traceRows,
  type BsearchPreset,
  type Snapshot,
} from "@/lib/example/binarySearch";

/**
 * `[[vis:bsearch:<preset>[:sheet[:n]]]]` — binary search replayed from the engine's
 * frozen snapshots (lib/example/binarySearch.ts). This component only draws.
 *
 *   bsearch:basic                interactive: preset tabs + Player
 *   bsearch:basic:solo           interactive, without the preset tabs
 *   bsearch:basic:sheet          frozen final snapshot + the trace table (for solutions)
 *   bsearch:basic:sheet:2        frozen after step 2 (0 = the initial range)
 */

const CELL = 54;
const GAP = 6;
const PAD = 40;

function geometry(n: number) {
  const arrayW = n * CELL + (n - 1) * GAP;
  const w = Math.max(720, arrayW + PAD * 2);
  const x0 = (w - arrayW) / 2;
  return { w, h: 256, x0, cx: (i: number) => x0 + i * (CELL + GAP) + CELL / 2 };
}

function toneFor(s: Snapshot, i: number): Tone {
  if (s.done && s.result === i) return "ok";
  if (s.mid === i) return s.decision === "found" ? "ok" : s.decision === "match-keep-left" ? "warn" : "active";
  if (s.best === i) return "warn";
  if (s.done && s.result === null) return "dim";
  if (i < s.lo || i > s.hi) return "dim";
  return "idle";
}

/** The array, the candidate range and the lo / mid / hi pointers for one snapshot. */
function Scene({ preset, s }: { preset: BsearchPreset; s: Snapshot }) {
  const cfg = PRESETS[preset];
  const n = cfg.array.length;
  const g = geometry(n);
  const cellY = 74;
  const rangeOpen = s.lo <= s.hi && !(s.done && s.result !== null && s.mid === null);
  const pointers = new Map<number, string[]>();
  const add = (i: number, name: string) => {
    if (i < 0 || i >= n) return;
    pointers.set(i, [...(pointers.get(i) ?? []), name]);
  };
  if (!s.done || s.result === null) {
    add(s.lo, "lo");
    if (s.mid !== null && !s.done) add(s.mid, "mid");
    add(s.hi, "hi");
  } else if (s.mid !== null) add(s.mid, "mid");
  const cmp =
    s.mid === null || s.value === null
      ? null
      : `a[${s.mid}] = ${s.value} ${s.value < cfg.target ? "<" : s.value > cfg.target ? ">" : "="} ${cfg.target}`;

  return (
    <Stage w={g.w} h={g.h}>
      <Label x={PAD - 8} y={20} anchor="start" tone="strong" weight={700} size={17}>
        {`target = ${cfg.target}`}
      </Label>
      <Label x={g.w - PAD + 8} y={20} anchor="end" size={16}>
        {`comparisons: ${s.probes}`}
      </Label>
      {rangeOpen && (
        <Group
          x={g.cx(s.lo) - CELL / 2 - 8}
          y={cellY - 30}
          w={g.cx(s.hi) - g.cx(s.lo) + CELL + 16}
          h={CELL + 46}
          tone={s.done ? "ok" : "active"}
        />
      )}
      {cfg.array.map((v, i) => (
        <g key={i}>
          <Label x={g.cx(i)} y={cellY - 15} size={13} mono>
            {i}
          </Label>
          <Box
            x={g.cx(i) - CELL / 2}
            y={cellY}
            w={CELL}
            h={CELL}
            r={10}
            title={String(v)}
            titleSize={17}
            tone={toneFor(s, i)}
            badge={s.best === i && !s.done ? "best" : undefined}
          />
        </g>
      ))}
      {Array.from(pointers.entries()).map(([i, names]) => (
        <g key={`p${i}`}>
          <Arrow x1={g.cx(i)} y1={cellY + CELL + 44} x2={g.cx(i)} y2={cellY + CELL + 8} tone={names.includes("mid") ? "req" : "muted"} width={1.8} />
          <Label x={g.cx(i)} y={cellY + CELL + 60} size={16} tone={names.includes("mid") ? "accent" : "muted"} weight={700} mono>
            {names.join("=")}
          </Label>
        </g>
      ))}
      {cmp && !s.done && (
        <Chip x={g.w / 2} y={g.h - 30} size={16} mono color={s.decision === "go-right" || s.decision === "go-left" ? ARROW_COLORS.req : ARROW_COLORS.res}>
          {cmp}
        </Chip>
      )}
      {s.done && (
        <Chip x={g.w / 2} y={g.h - 30} size={16} color={s.result === null ? ARROW_COLORS.bad : ARROW_COLORS.res}>
          {s.result === null ? `not found · insert at ${s.insertAt}` : `answer: index ${s.result}`}
        </Chip>
      )}
    </Stage>
  );
}

const DECISION_TEXT: Record<NonNullable<Snapshot["decision"]>, string> = {
  "go-right": "lo = mid + 1",
  "go-left": "hi = mid − 1",
  found: "found",
  "match-keep-left": "best = mid, hi = mid − 1",
};

/** The table you would write on paper: one row per comparison. */
function TraceTable({ steps, upTo, target }: { steps: readonly Snapshot[]; upTo: number; target: number }) {
  const rows = traceRows(steps.slice(0, upTo + 1));
  if (!rows.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm tabular-nums">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
            <th className="px-2 py-1.5">#</th>
            <th className="px-2 py-1.5">lo</th>
            <th className="px-2 py-1.5">hi</th>
            <th className="px-2 py-1.5">mid</th>
            <th className="px-2 py-1.5">a[mid] vs {target}</th>
            <th className="px-2 py-1.5">then</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.probes} className="border-b border-border/60 last:border-0">
              <td className="px-2 py-1.5 text-muted">{r.probes}</td>
              <td className="px-2 py-1.5 font-mono">{r.lo}</td>
              <td className="px-2 py-1.5 font-mono">{r.hi}</td>
              <td className="px-2 py-1.5 font-mono font-bold">{r.mid}</td>
              <td className="px-2 py-1.5 font-mono">
                {r.value} {r.value! < target ? "<" : r.value! > target ? ">" : "="} {target}
              </td>
              <td className="px-2 py-1.5 font-mono">{r.decision ? DECISION_TEXT[r.decision] : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Interactive({ initial, lock }: { initial: BsearchPreset; lock: boolean }) {
  const [preset, setPreset] = useState<BsearchPreset>(initial);
  const [step, setStep] = useState(0);
  const steps = useMemo(() => run(preset), [preset]);
  const s = steps[Math.min(step, steps.length - 1)];
  return (
    <div className="space-y-4">
      {!lock && (
        <Pills
          options={BSEARCH_PRESETS.map((id) => ({ id, label: PRESETS[id].label }))}
          value={preset}
          onChange={(id) => {
            setPreset(id);
            setStep(0);
          }}
        />
      )}
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-5">
        <Scene preset={preset} s={s} />
        <div className="mt-3">
          <TraceTable steps={steps} upTo={step} target={PRESETS[preset].target} />
        </div>
        <div className="mt-4 border-t border-border pt-4">
          <Player step={step} total={steps.length} setStep={setStep} title={s.title} desc={s.text} />
        </div>
      </div>
    </div>
  );
}

/** Frozen snapshot (no controls): what you would draw on the exam sheet. */
function Sheet({ preset, at }: { preset: BsearchPreset; at?: number }) {
  const steps = run(preset);
  const i = at === undefined || Number.isNaN(at) ? steps.length - 1 : Math.max(0, Math.min(at, steps.length - 1));
  const s = steps[i];
  return (
    <div className="space-y-3">
      <Scene preset={preset} s={s} />
      <TraceTable steps={steps} upTo={i} target={PRESETS[preset].target} />
      <p className="text-sm text-muted">{s.text}</p>
    </div>
  );
}

export default function BinarySearchSim({ preset }: { preset?: string }) {
  const [first = "basic", mode, n] = (preset ?? "basic").split(":");
  const initial: BsearchPreset = isBsearchPreset(first) ? first : "basic";
  if (mode === "sheet") return <Sheet preset={initial} at={n === undefined ? undefined : Number(n)} />;
  // `key` resets the internal state when the same component gets another preset.
  return <Interactive key={initial} initial={initial} lock={mode === "solo"} />;
}
