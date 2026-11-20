/*
 * Transitions between scenes (pure). Given a snapshot of what is on screen now and the new
 * step's scene, it builds a plan with one track per entity and per wire:
 *
 *   leaving  (exit)   0 ms → sink and fade out
 *   moving   (move)   from halfway through the exits → interpolate x, y, z, w, d, h, lift and the type's `tween` fields
 *   entering (enter)  from halfway through the move, staggered in declaration order → drop into place
 *   new wires         drawn once both of their ends are present
 *
 * frameAt(plan, t) returns what to draw at instant t. Non-numeric properties (tone, text, on,
 * a register's value…) switch instantly when the move starts; color is smoothed with CSS
 * transitions.
 */
import { GEOM, full, type Full } from "./geom";
import type { Entity, Link, Scene } from "./types";

export const TIMING = { exit: 380, move: 760, enter: 620, stagger: 90, draw: 520 };

const BASE = ["x", "y", "z", "w", "d", "h", "lift"] as const;

export type Nums = Record<string, number>;

export const ease = {
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  out: (t: number) => 1 - (1 - t) ** 3,
  in: (t: number) => t * t * t,
  back: (t: number) => {
    const c1 = 1.5,
      c3 = c1 + 1;
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
  },
};

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** An entity's interpolatable numbers (with the type's default sizes). */
export function numsOf(e: Entity): Nums {
  const f = full({ ...e, lift: 0 });
  const out: Nums = { x: f.x, y: f.y, z: e.z ?? 0, w: f.w, d: f.d, h: f.h, lift: e.lift ?? 0 };
  for (const k of GEOM[e.type]?.tween ?? []) {
    const v = e[k];
    if (typeof v === "number") out[k] = v;
  }
  return out;
}

const sameNums = (a: Nums, b: Nums) => Object.keys(b).every((k) => Math.abs((a[k] ?? b[k]) - b[k]) < 1e-9);

export interface Shown {
  ents: Record<string, { ent: Entity; nums: Nums; op: number }>;
  links: Record<string, { link: Link; op: number; draw: number }>;
}

export const emptyShown = (): Shown => ({ ents: {}, links: {} });

/** The scene as is, with no transition (for the first step or with animations off). */
export function shownOf(scene: Scene): Shown {
  const s = emptyShown();
  for (const [id, e] of Object.entries(scene.entities)) s.ents[id] = { ent: e, nums: numsOf(e), op: 1 };
  for (const [id, l] of Object.entries(scene.links ?? {})) s.links[id] = { link: l, op: 1, draw: 1 };
  return s;
}

interface EntTrack {
  id: string;
  kind: "enter" | "exit" | "move";
  /** Discrete properties before and after the change. */
  before: Entity;
  after: Entity;
  from: Nums;
  to: Nums;
  opFrom: number;
  t0: number;
  dur: number;
}

interface LinkTrack {
  id: string;
  kind: "enter" | "exit" | "stay";
  link: Link;
  opFrom: number;
  drawFrom: number;
  t0: number;
  dur: number;
}

export interface Plan {
  ents: EntTrack[];
  links: LinkTrack[];
  /** When the discrete properties switch (start of the move). */
  swapAt: number;
  end: number;
}

const ownerOf = (p: unknown): string | null => (typeof p === "string" ? p.split(".")[0] : null);

export function plan(shown: Shown, next: Scene, instant = false): Plan {
  const T = instant ? { exit: 0, move: 0, enter: 0, stagger: 0, draw: 0 } : TIMING;
  const ents: EntTrack[] = [];
  const nextIds = Object.keys(next.entities);
  const exits = Object.keys(shown.ents).filter((id) => !(id in next.entities));
  const moves: string[] = [];
  const enters: string[] = [];
  for (const id of nextIds) {
    if (id in shown.ents) moves.push(id);
    else enters.push(id);
  }
  const anyExit = exits.length > 0;
  const moveStart = anyExit ? T.exit * 0.5 : 0;
  const realMoves = moves.filter((id) => !sameNums(shown.ents[id].nums, numsOf(next.entities[id])) || shown.ents[id].op < 1);
  const enterStart = moveStart + (realMoves.length ? T.move * 0.55 : 0);

  for (const id of exits) {
    const s = shown.ents[id];
    ents.push({ id, kind: "exit", before: s.ent, after: s.ent, from: s.nums, to: s.nums, opFrom: s.op, t0: 0, dur: T.exit });
  }
  for (const id of moves) {
    const s = shown.ents[id];
    const to = numsOf(next.entities[id]);
    const moving = realMoves.includes(id);
    ents.push({
      id,
      kind: "move",
      before: s.ent,
      after: next.entities[id],
      from: s.nums,
      to,
      opFrom: s.op,
      t0: moveStart,
      dur: moving ? T.move : 0,
    });
  }
  const enterAt: Record<string, number> = {};
  enters.forEach((id, i) => {
    const t0 = enterStart + i * T.stagger;
    enterAt[id] = t0;
    const to = numsOf(next.entities[id]);
    ents.push({ id, kind: "enter", before: next.entities[id], after: next.entities[id], from: to, to, opFrom: 0, t0, dur: T.enter });
  });

  const links: LinkTrack[] = [];
  const nextLinks = next.links ?? {};
  for (const [id, s] of Object.entries(shown.links)) {
    const n = nextLinks[id];
    if (!n || JSON.stringify(n.pts) !== JSON.stringify(s.link.pts)) {
      links.push({ id: n ? `${id}~old` : id, kind: "exit", link: s.link, opFrom: s.op, drawFrom: s.draw, t0: 0, dur: T.exit * 0.8 });
    }
  }
  for (const [id, l] of Object.entries(nextLinks)) {
    const s = shown.links[id];
    if (s && JSON.stringify(l.pts) === JSON.stringify(s.link.pts)) {
      links.push({ id, kind: "stay", link: l, opFrom: s.op, drawFrom: s.draw, t0: moveStart, dur: T.move * 0.5 });
      continue;
    }
    // Drawn once its ends have entered.
    let t0 = realMoves.length ? moveStart + T.move * 0.5 : moveStart;
    for (const p of l.pts) {
      const o = ownerOf(p);
      if (o && o in enterAt) t0 = Math.max(t0, enterAt[o] + T.enter * 0.6);
    }
    links.push({ id, kind: "enter", link: l, opFrom: 0, drawFrom: 0, t0, dur: T.draw });
  }

  const end = Math.max(0, ...ents.map((e) => e.t0 + e.dur), ...links.map((l) => l.t0 + l.dur));
  return { ents, links, swapAt: moveStart, end };
}

export interface FrameEnt {
  id: string;
  f: Full;
  ent: Entity;
  op: number;
  kind: EntTrack["kind"];
}

export interface FrameLink {
  id: string;
  link: Link;
  op: number;
  draw: number;
}

export interface Frame {
  ents: FrameEnt[];
  links: FrameLink[];
  settled: boolean;
}

export function frameAt(p: Plan, t: number): Frame {
  const ents: FrameEnt[] = [];
  for (const k of p.ents) {
    const raw = k.dur ? clamp01((t - k.t0) / k.dur) : t >= k.t0 ? 1 : 0;
    const discrete = t >= p.swapAt ? k.after : k.before;
    const nums: Nums = {};
    let op = 1;
    let dz = 0;
    if (k.kind === "move") {
      const e = ease.inOut(raw);
      for (const key of Object.keys(k.to)) nums[key] = lerp(k.from[key] ?? k.to[key], k.to[key], e);
      op = lerp(k.opFrom, 1, ease.out(raw));
    } else if (k.kind === "enter") {
      Object.assign(nums, k.to);
      op = ease.out(raw);
      dz = (1 - ease.back(raw)) * 1.4;
    } else {
      Object.assign(nums, k.from);
      op = k.opFrom * (1 - ease.out(raw));
      dz = -0.5 * ease.in(raw);
    }
    if (op <= 0.001 && k.kind === "exit") continue;
    if (op <= 0.001 && k.kind === "enter" && raw === 0) continue;
    const ent: Entity = { ...discrete };
    for (const key of Object.keys(nums)) ent[key] = nums[key];
    ent.lift = (nums.lift ?? 0) + dz;
    ents.push({ id: k.id, f: full(ent), ent, op, kind: k.kind });
  }
  const links: FrameLink[] = [];
  for (const k of p.links) {
    const raw = k.dur ? clamp01((t - k.t0) / k.dur) : t >= k.t0 ? 1 : 0;
    if (k.kind === "enter") {
      if (raw <= 0) continue;
      links.push({ id: k.id, link: k.link, op: 1, draw: ease.inOut(raw) });
    } else if (k.kind === "exit") {
      const op = k.opFrom * (1 - ease.out(raw));
      if (op > 0.001) links.push({ id: k.id, link: k.link, op, draw: k.drawFrom });
    } else {
      links.push({ id: k.id, link: k.link, op: lerp(k.opFrom, 1, raw), draw: lerp(k.drawFrom, 1, raw) });
    }
  }
  return { ents, links, settled: t >= p.end };
}

/** What is visible at instant t, so a new transition can start from there if the step changes midway. */
export function snapshot(p: Plan, t: number): Shown {
  const fr = frameAt(p, t);
  const s = emptyShown();
  for (const e of fr.ents) {
    if (e.kind === "exit") continue;
    s.ents[e.id] = { ent: e.ent, nums: numsOf(e.ent), op: e.op };
  }
  for (const l of fr.links) {
    if (l.id.endsWith("~old")) continue;
    const k = p.links.find((x) => x.id === l.id);
    if (k?.kind === "exit") continue;
    s.links[l.id] = { link: l.link, op: l.op, draw: l.draw };
  }
  return s;
}
