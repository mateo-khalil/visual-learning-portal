"use client";

import { useState, type ReactNode } from "react";
import Player from "./Player";
import { Arrow, Box, Group, Stage, chipWidth, link, type ArrowTone, type Rect, type Tone } from "./Stage";
import { Pills } from "@/components/ui/ui";

/**
 * A "slide-style" simulator described with data: a fixed scene (boxes and dashed
 * groups) and one or more scenarios, each a list of steps saying which boxes light
 * up, which values change and which arrows travel. Use it for anything that is a
 * sequence of messages between parts (handshakes, RPCs, a request through layers…).
 *
 *   <FlowSim w={1000} h={420} nodes={NODES} groups={GROUPS}
 *            scenarios={[normal, failure]} initial="normal" lockScenario={solo} />
 */

export type FlowNode = Rect & { id: string; title: string; sub?: string; value?: string };
export type FlowGroup = Rect & { id: string; label: string };
export type FlowArrow = {
  from: string;
  to: string;
  label?: string;
  tone?: ArrowTone;
  dashed?: boolean;
  /** Perpendicular shift (for a parallel request/response pair). */
  offset?: number;
  curve?: number;
  labelAt?: number;
  mono?: boolean;
};
export type FlowStep = {
  title: string;
  desc: ReactNode;
  /** Tone per box id; boxes not listed stay "idle". */
  tones?: Record<string, Tone>;
  /** Shortcut: these box ids in "active". */
  active?: string[];
  values?: Record<string, string>;
  subs?: Record<string, string>;
  badges?: Record<string, string>;
  groupTones?: Record<string, "idle" | "active" | "bad" | "ok">;
  arrows?: FlowArrow[];
  /** Panel under the diagram (headers, a JSON payload, a small table…). */
  panel?: ReactNode;
};
export type FlowScenario = { id: string; label: string; steps: FlowStep[] };

export default function FlowSim({
  w,
  h,
  nodes,
  groups = [],
  scenarios,
  initial,
  lockScenario,
  children,
}: {
  w: number;
  h: number;
  nodes: FlowNode[];
  groups?: FlowGroup[];
  scenarios: FlowScenario[];
  initial?: string;
  /** Hides the scenario tabs (when a single scenario is embedded in a topic). */
  lockScenario?: boolean;
  /** Extra drawing on top of the scene (receives the current step). */
  children?: (s: FlowStep, step: number) => ReactNode;
}) {
  const [scId, setScId] = useState(initial ?? scenarios[0].id);
  const [step, setStep] = useState(0);
  const sc = scenarios.find((s) => s.id === scId) ?? scenarios[0];
  const s = sc.steps[Math.min(step, sc.steps.length - 1)];
  const byId = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className="space-y-4">
      {!lockScenario && scenarios.length > 1 && (
        <Pills
          options={scenarios.map((x) => ({ id: x.id, label: x.label }))}
          value={scId}
          onChange={(id) => {
            setScId(id);
            setStep(0);
          }}
        />
      )}
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-5">
        <Stage w={w} h={h}>
          {groups.map((g) => (
            <Group key={g.id} {...g} tone={s.groupTones?.[g.id]} />
          ))}
          {nodes.map((n) => (
            <Box
              key={n.id}
              {...n}
              sub={s.subs?.[n.id] ?? n.sub}
              value={s.values?.[n.id] ?? n.value}
              badge={s.badges?.[n.id]}
              tone={s.tones?.[n.id] ?? (s.active?.includes(n.id) ? "active" : "idle")}
            />
          ))}
          {(s.arrows ?? []).map((a, i) => {
            const f = byId.get(a.from);
            const t = byId.get(a.to);
            if (!f || !t) return null;
            const pts = link(f, t, a.offset ?? 0);
            // Parallel arrows (offset): the label goes on the outer side so they do not overlap.
            const vertical = Math.abs(pts.y2 - pts.y1) > Math.abs(pts.x2 - pts.x1);
            const shift =
              a.offset && a.label
                ? Math.sign(a.offset) * (vertical ? chipWidth(a.label, 12, a.mono) / 2 + 8 : 15)
                : 0;
            return (
              <Arrow
                key={`${scId}-${step}-${i}`}
                {...pts}
                labelShift={shift}
                label={a.label}
                tone={a.tone}
                dashed={a.dashed}
                curve={a.curve}
                labelAt={a.labelAt}
                mono={a.mono}
                play={`${scId}-${step}`}
              />
            );
          })}
          {children?.(s, step)}
        </Stage>
        {s.panel && <div className="mt-3">{s.panel}</div>}
        <div className="mt-4 border-t border-border pt-4">
          <Player step={step} total={sc.steps.length} setStep={setStep} title={s.title} desc={s.desc} />
        </div>
      </div>
    </div>
  );
}
