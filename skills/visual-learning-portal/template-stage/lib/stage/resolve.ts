/*
 * Wire points, camera framing and pill measurements (pure).
 */
import { anchorsOf, boxOf, full, type Full } from "./geom";
import { bounds2, P, P3, pointAt } from "./iso";
import type { Entity, Link, LinkPoint, Pill, Scene, V2, V3 } from "./types";

/** Resolves a wire point: coordinates or "id.anchor" (no anchor = center). */
export function pointOf(p: LinkPoint, ents: Record<string, Full>, z = 0): V3 | null {
  if (typeof p === "string") {
    const [id, ...rest] = p.split(".");
    const f = ents[id];
    if (!f) return null;
    const a = anchorsOf(f)[rest.length ? rest.join(".") : "c"];
    return a ?? null;
  }
  return p.length === 3 ? (p as V3) : [p[0], p[1], z];
}

export function linkPts(l: Link, ents: Record<string, Full>): V2[] | null {
  const out: V2[] = [];
  for (const p of l.pts) {
    const v = pointOf(p, ents, l.z ?? 0);
    if (!v) return null;
    out.push(P3(v));
  }
  return out;
}

/** Checks every anchor a scene names and returns the ones that don't exist (for verify). */
export function missingAnchors(scene: Scene): string[] {
  const ents: Record<string, Full> = {};
  for (const [id, e] of Object.entries(scene.entities)) ents[id] = full(e);
  const bad: string[] = [];
  for (const [lid, l] of Object.entries(scene.links ?? {}))
    for (const p of l.pts) if (typeof p === "string" && !pointOf(p, ents)) bad.push(`${lid}: ${p}`);
  for (const f of scene.flows ?? []) if (!(f.link in (scene.links ?? {}))) bad.push(`flow → ${f.link}`);
  return bad;
}

// ------------------------------------------------------------------------------------------
// Pills: fixed size on screen
// ------------------------------------------------------------------------------------------
export const PILL = { font: 12, padX: 9, h: 22, gap: 7, char: 0.6 };

/** Visible width of a text in characters (not counting combining marks such as the overbar). */
export const visibleLen = (s: string) => [...s.replace(/[̀-ͯ]/g, "")].length;

export const pillW = (p: Pill) => visibleLen(p.text) * PILL.font * PILL.char + PILL.padX * 2 + (p.icon ? PILL.font + 4 : 0);

/**
 * Where each of an entity's pills goes: the anchor in scene px and the offset in screen px
 * (drawn with scale(1/k)). Also returns the box it occupies, given k.
 */
export function pillLayout(f: Full, pills: Pill[], k: number) {
  const [x0, y0, x1, y1] = bounds2(boxOf(f));
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const bySide: Record<string, Pill[]> = {};
  for (const p of pills) (bySide[p.side ?? "top"] ??= []).push(p);
  const out: { pill: Pill; ax: number; ay: number; ox: number; oy: number; w: number }[] = [];
  for (const [side, list] of Object.entries(bySide)) {
    list.forEach((pill, i) => {
      const w = pillW(pill);
      let ax = cx,
        ay = cy,
        ox = 0,
        oy = 0;
      const step = PILL.h + 4;
      if (side === "top") {
        ay = y0;
        oy = -PILL.gap - PILL.h / 2 - i * step;
      } else if (side === "bottom") {
        ay = y1;
        oy = PILL.gap + PILL.h / 2 + i * step;
      } else if (side === "left") {
        ax = x0;
        ox = -PILL.gap - w / 2;
        oy = (i - (list.length - 1) / 2) * step;
      } else {
        ax = x1;
        ox = PILL.gap + w / 2;
        oy = (i - (list.length - 1) / 2) * step;
      }
      out.push({ pill, ax, ay, ox, oy, w });
    });
  }
  return out.map((o) => ({
    ...o,
    rect: [o.ax + (o.ox - o.w / 2) / k, o.ay + (o.oy - PILL.h / 2) / k, o.ax + (o.ox + o.w / 2) / k, o.ay + (o.oy + PILL.h / 2) / k] as [
      number,
      number,
      number,
      number,
    ],
  }));
}

// ------------------------------------------------------------------------------------------
// Camera
// ------------------------------------------------------------------------------------------
export type VB = [number, number, number, number]; // x, y, w, h

export interface FitOpts {
  /** Size of the usable area in px. */
  pw: number;
  ph: number;
  /** Margin in screen px. */
  pad?: number;
  focus?: string[];
  zoom?: number;
  /** Pill scale (1 = normal size; smaller on narrow screens). */
  hud?: number;
}

/** Framing for a scene: everything (or the focus ids) with their pills and wires, centered. */
export function fitCamera(scene: Scene, o: FitOpts): VB {
  const ents: Record<string, Full> = {};
  for (const [id, e] of Object.entries(scene.entities)) ents[id] = full(e);
  const pick = o.focus?.length ? o.focus.filter((id) => id in ents) : Object.keys(ents);
  const pad = o.pad ?? 28;
  let rect = [Infinity, Infinity, -Infinity, -Infinity];
  const add = (r: number[]) => {
    rect = [Math.min(rect[0], r[0]), Math.min(rect[1], r[1]), Math.max(rect[2], r[2]), Math.max(rect[3], r[3])];
  };
  for (const id of pick) {
    const f = ents[id];
    const b = boxOf(f);
    if (b.w === 0 && b.d === 0 && b.h === 0) {
      const [px, py] = P(b.x, b.y, b.z);
      add([px - 1, py - 1, px + 1, py + 1]);
    } else add(bounds2(b));
  }
  if (!o.focus?.length)
    for (const l of Object.values(scene.links ?? {})) {
      const ps = linkPts(l, ents);
      if (ps) for (const [x, y] of ps) add([x - 2, y - 2, x + 2, y + 2]);
    }
  if (!isFinite(rect[0])) rect = [-200, -120, 200, 120];
  // Two passes: k without pills, then with the pills measured at that k.
  let vb = boxToVb(rect, o, pad);
  for (let it = 0; it < 2; it++) {
    const k = Math.min(o.pw / vb[2], o.ph / vb[3]) / (o.hud ?? 1);
    let r2 = [...rect];
    const grow = (q: number[]) => (r2 = [Math.min(r2[0], q[0]), Math.min(r2[1], q[1]), Math.max(r2[2], q[2]), Math.max(r2[3], q[3])]);
    for (const id of pick) {
      const e = scene.entities[id] as Entity;
      if (!e.pills?.length) continue;
      for (const pl of pillLayout(ents[id], e.pills, k)) grow(pl.rect);
    }
    // wire labels (also fixed size on screen)
    if (!o.focus?.length)
      for (const l of Object.values(scene.links ?? {})) {
        if (!l.label) continue;
        const ps = linkPts(l, ents);
        if (!ps) continue;
        const { p } = pointAt(ps, l.labelAt ?? 0.5);
        const w = pillW({ text: l.label }) / 2 / k;
        const h = PILL.h / 2 / k;
        grow([p[0] - w, p[1] - h, p[0] + w, p[1] + h]);
      }
    vb = boxToVb(r2, o, pad);
  }
  return vb;
}

function boxToVb(r: number[], o: FitOpts, pad: number): VB {
  let w = r[2] - r[0];
  let h = r[3] - r[1];
  const cx = (r[0] + r[2]) / 2;
  const cy = (r[1] + r[3]) / 2;
  // Margin in screen px: converted with the scale that would result.
  const k = Math.min((o.pw - 2 * pad) / Math.max(w, 1), (o.ph - 2 * pad) / Math.max(h, 1));
  // Don't enlarge small scenes beyond 1.9×: they end up looking like toys.
  const kk = Math.min(k, 1.9) * (o.zoom ?? 1);
  w = o.pw / kk;
  h = o.ph / kk;
  return [cx - w / 2, cy - h / 2, w, h];
}

export const lerpVb = (a: VB, b: VB, t: number): VB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
  a[3] + (b[3] - a[3]) * t,
];
