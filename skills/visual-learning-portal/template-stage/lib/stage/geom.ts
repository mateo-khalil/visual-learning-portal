/*
 * Geometry of each entity type (pure, no React): default size, whether it sits on the floor,
 * which fields are interpolated between steps and which anchors it exposes for wires. Each
 * type's drawing lives in components/stage/kits/*.tsx under the same type name; verify checks
 * that both exist.
 *
 * Generic anchors (all entities), at the level of their base z:
 *   c (center), top (top center), n / s / e / w (center of each side: n = −y, s = +y,
 *   e = +x, w = −x), ne / nw / se / sw (corners).
 * Kits add their own anchors (a chip's pins, a register's bits, a memory's rows…).
 */
import type { Box3 } from "./iso";
import type { Entity, V3 } from "./types";

export interface GeomDef {
  size: { w: number; d: number; h: number };
  floor?: boolean;
  /** Round (cylinder): the halo follows the round silhouette. */
  round?: boolean;
  /** Type-specific fields that are interpolated (besides x, y, z, w, d, h, lift). */
  tween?: string[];
  /** Type-specific anchors, in addition to the generic ones. */
  anchors?: (e: Required<Pick<Entity, "x" | "y" | "z" | "w" | "d" | "h">> & Entity) => Record<string, V3>;
  /** Box used for ordering and framing, if it isn't x, y, z, w, d, h (e.g. when pins stick out). */
  box?: (e: Required<Pick<Entity, "x" | "y" | "z" | "w" | "d" | "h">> & Entity) => Box3;
}

export type Full = Required<Pick<Entity, "x" | "y" | "z" | "w" | "d" | "h">> & Entity;

const num = (v: unknown, d: number) => (typeof v === "number" ? v : d);
const arr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);

/** Pin positions along a side of length L, centered, spaced `pitch` apart. */
export const pinOffsets = (count: number, L: number, pitch = 0.8) => {
  const span = (count - 1) * pitch;
  const start = (L - span) / 2;
  return Array.from({ length: count }, (_, i) => start + i * pitch);
};

export const PIN_LEN = 0.45;

// ------------------------------------------------------------------------------------------
// Core: works for any subject
// ------------------------------------------------------------------------------------------
const core: Record<string, GeomDef> = {
  /** Box: modules, blocks, servers, registers. */
  box: { size: { w: 2, d: 2, h: 1 } },
  /** Board or floor zone (with an optional title). */
  slab: { size: { w: 6, d: 4, h: 0.2 }, floor: true },
  /** Flat tile with text on the floor plane (Karnaugh cells, addresses). */
  tile: { size: { w: 1, d: 1, h: 0.06 }, floor: true },
  /** Cylinder (diameter = w). */
  cyl: { size: { w: 2, d: 2, h: 0.6 }, round: true },
  /** Just pills or text at a point. */
  label: { size: { w: 0, d: 0, h: 0 } },
  /** Container that fills up (fill 0..1): counters, capacitors, queues. */
  tank: { size: { w: 1.6, d: 1.6, h: 3 }, tween: ["fill"] },
  /** n-bit register laid out in a row, MSB on the left (−x). value = number. */
  bits: {
    size: { w: 8, d: 1, h: 0.45 },
    anchors: (e) => {
      const n = num(e.n, 8);
      const cw = e.w / n;
      const out: Record<string, V3> = {};
      for (let i = 0; i < n; i++) {
        const bit = n - 1 - i;
        out[`b${bit}`] = [e.x + cw * (i + 0.5), e.y + e.d, e.z];
        out[`b${bit}.top`] = [e.x + cw * (i + 0.5), e.y + e.d / 2, e.z + e.h];
        out[`b${bit}.n`] = [e.x + cw * (i + 0.5), e.y, e.z];
      }
      return out;
    },
  },
  /** Memory: rows along +y (rows: {addr, name, value, hl?}). */
  mem: {
    size: { w: 4.4, d: 3, h: 0.4 },
    anchors: (e) => {
      const rows = Array.isArray(e.rows) ? e.rows.length : 1;
      const rd = e.d / rows;
      const out: Record<string, V3> = {};
      for (let i = 0; i < rows; i++) {
        out[`r${i}`] = [e.x + e.w, e.y + rd * (i + 0.5), e.z];
        out[`r${i}.w`] = [e.x, e.y + rd * (i + 0.5), e.z];
        out[`r${i}.top`] = [e.x + e.w / 2, e.y + rd * (i + 0.5), e.z + e.h];
      }
      return out;
    },
  },
};

// ------------------------------------------------------------------------------------------
// Digital electronics kit
// ------------------------------------------------------------------------------------------
const pinsAnchors = (e: Full): Record<string, V3> => {
  const out: Record<string, V3> = {};
  const pins = (e.pins ?? {}) as Record<string, string[]>;
  const z = e.z;
  const side = (s: string, names: string[]) => {
    const along = s === "e" || s === "w" ? e.d : e.w;
    pinOffsets(names.length, along, num(e.pitch, 0.8)).forEach((o, i) => {
      const name = names[i];
      if (!name) return;
      let p: V3;
      if (s === "e") p = [e.x + e.w + PIN_LEN, e.y + o, z];
      else if (s === "w") p = [e.x - PIN_LEN, e.y + o, z];
      else if (s === "s") p = [e.x + o, e.y + e.d + PIN_LEN, z];
      else p = [e.x + o, e.y - PIN_LEN, z];
      out[name] = p;
    });
  };
  for (const s of ["e", "w", "s", "n"]) side(s, arr(pins[s]));
  return out;
};

const pinsBox = (e: Full): Box3 => {
  const pins = (e.pins ?? {}) as Record<string, string[]>;
  const ext = (s: string) => (arr(pins[s]).length ? PIN_LEN : 0);
  return { x: e.x - ext("w"), y: e.y - ext("n"), z: e.z, w: e.w + ext("w") + ext("e"), d: e.d + ext("n") + ext("s"), h: e.h };
};

const electronics: Record<string, GeomDef> = {
  /** Integrated circuit with pins on each side: pins = { e: [...], s: [...], w: [...], n: [...] }. */
  chip: { size: { w: 4, d: 6, h: 0.7 }, anchors: pinsAnchors, box: pinsBox },
  /** Block with pins (flip-flop, large gate, module), same convention as chip. */
  block: { size: { w: 2, d: 2.4, h: 0.6 }, anchors: pinsAnchors, box: pinsBox },
  /** Standing 7-segment display; the digit shows on the +y face. segs: bit0 = a … bit6 = g. */
  seg7: {
    size: { w: 1.7, d: 0.5, h: 2.5 },
    anchors: (e) => ({ com: [e.x + e.w / 2, e.y, e.z], bus: [e.x + e.w / 2, e.y + e.d, e.z] }),
  },
  /** LED (on). */
  led: { size: { w: 0.8, d: 0.8, h: 0.45 }, round: true },
  /** Standing column of n LEDs (value = bits; bit n−1 at the top). */
  ledbar: {
    size: { w: 1, d: 0.45, h: 5 },
    anchors: (e) => ({ in: [e.x, e.y + e.d / 2, e.z], bus: [e.x + e.w / 2, e.y + e.d, e.z] }),
  },
  /** Potentiometer: v from 0 to 1 turns the knob. */
  pot: { size: { w: 1.6, d: 1.6, h: 0.35 }, tween: ["v"] },
  /** Toggle switch (on). */
  switch: { size: { w: 1.4, d: 1, h: 0.3 } },
  /** Vehicle. */
  car: { size: { w: 2.6, d: 1.4, h: 1.3 } },
  /** Floor sensor (on). */
  sensor: { size: { w: 0.7, d: 2.6, h: 0.08 }, floor: true },
  /** Beacon: a post with a light (on = blinks). */
  lamp: { size: { w: 0.6, d: 0.6, h: 2 } },
  /** Logic gate (kind: and | or | not | nand | nor) with its symbol on top. */
  gate: {
    size: { w: 1.6, d: 1.2, h: 0.45 },
    anchors: (e) => {
      const n = num(e.inputs, 2);
      const out: Record<string, V3> = { out: [e.x + e.w, e.y + e.d / 2, e.z] };
      for (let i = 0; i < n; i++) out[`in${i}`] = [e.x, e.y + (e.d * (i + 1)) / (n + 1), e.z];
      return out;
    },
  },
  /** State-machine state (disc): name, out, active. */
  state: { size: { w: 2.2, d: 2.2, h: 0.35 }, round: true },
  /** Barrier (on = lowered, blocking the way). */
  barrier: { size: { w: 0.5, d: 3, h: 1.2 } },
};

import { GEOM_EXAMPLE } from "./areas/example";

/** Core + electronics + each topic's own pieces (lib/stage/areas/<topic>.ts). */
export const GEOM: Record<string, GeomDef> = { ...core, ...electronics, ...GEOM_EXAMPLE };

/** Entity with its full size (type defaults) and lift added to z. */
export function full(e: Entity): Full {
  const g = GEOM[e.type];
  const s = g?.size ?? { w: 1, d: 1, h: 1 };
  return {
    ...e,
    z: (e.z ?? 0) + (e.lift ?? 0),
    w: e.w ?? s.w,
    d: e.d ?? s.d,
    h: e.h ?? s.h,
  } as Full;
}

export function boxOf(f: Full): Box3 {
  const g = GEOM[f.type];
  return g?.box ? g.box(f) : { x: f.x, y: f.y, z: f.z, w: f.w, d: f.d, h: f.h };
}

export function anchorsOf(f: Full): Record<string, V3> {
  const { x, y, z, w, d, h } = f;
  const base: Record<string, V3> = {
    c: [x + w / 2, y + d / 2, z],
    top: [x + w / 2, y + d / 2, z + h],
    n: [x + w / 2, y, z],
    s: [x + w / 2, y + d, z],
    e: [x + w, y + d / 2, z],
    w: [x, y + d / 2, z],
    ne: [x + w, y, z],
    nw: [x, y, z],
    se: [x + w, y + d, z],
    sw: [x, y + d, z],
  };
  const g = GEOM[f.type];
  return g?.anchors ? { ...base, ...g.anchors(f) } : base;
}

export const isFloor = (f: Entity) => (f.layer ? f.layer === "floor" : !!GEOM[f.type]?.floor);
