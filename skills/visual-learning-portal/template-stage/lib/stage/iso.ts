/*
 * Isometric projection and pure geometry (no React). Everything is in scene px; the camera
 * (viewBox) scales afterwards.
 *
 *   P(x, y, z) = ((x − y)·cos30°·U, (x + y)·sin30°·U − z·U)
 *
 * +x goes down-right, +y goes down-left, +z goes up. Whatever has a larger x + y is closer to
 * the viewer. Visible faces of a box: the top (top), the +y face (left, lower left) and the
 * +x face (right, lower right).
 */
import type { V2, V3 } from "./types";

export const U = 24;
export const COS = Math.cos(Math.PI / 6);
export const SIN = 0.5;

export const P = (x: number, y: number, z = 0): V2 => [(x - y) * COS * U, (x + y) * SIN * U - z * U];
export const P3 = (v: V3): V2 => P(v[0], v[1], v[2]);

export interface Box3 {
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
}

export const pts = (ps: V2[]) => ps.map(([a, b]) => `${r2(a)},${r2(b)}`).join(" ");
export const r2 = (n: number) => Math.round(n * 100) / 100;
const r4 = (n: number) => Math.round(n * 10000) / 10000;

/** The three visible faces of a box, as screen polygons. */
export function boxFaces(b: Box3) {
  const { x, y, z, w, d, h } = b;
  const t = z + h;
  return {
    top: [P(x, y, t), P(x + w, y, t), P(x + w, y + d, t), P(x, y + d, t)],
    left: [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, t), P(x, y + d, t)],
    right: [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, t), P(x + w, y, t)],
  };
}

/** Outer silhouette of a box (a hexagon), for halos and shadows. */
export function boxOutline(b: Box3): V2[] {
  const { x, y, z, w, d, h } = b;
  const t = z + h;
  return [P(x, y, t), P(x + w, y, t), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z), P(x, y + d, t)];
}

export type Face = "top" | "left" | "right";

/**
 * SVG matrix that maps local (u, v) coordinates in grid units onto the plane of a face.
 *   top:   origin at the back corner (x, y, top); u along +x, v along +y
 *   left:  origin at the top left of the +y face; u along +x, v downward
 *   right: origin at the top left of the +x face seen head-on (x+w, y+d); u toward −y, v downward
 * That way, text written at (u, v) reads left to right on all three faces.
 */
export function faceMatrix(face: Face, b: Box3): string {
  const { x, y, z, w, d, h } = b;
  const t = z + h;
  let o: V2, eu: V2, ev: V2;
  if (face === "top") {
    o = P(x, y, t);
    eu = sub(P(x + 1, y, t), P(x, y, t));
    ev = sub(P(x, y + 1, t), P(x, y, t));
  } else if (face === "left") {
    o = P(x, y + d, t);
    eu = sub(P(x + 1, y + d, t), P(x, y + d, t));
    ev = [0, U];
  } else {
    o = P(x + w, y + d, t);
    eu = sub(P(x + w, y + d - 1, t), P(x + w, y + d, t));
    ev = [0, U];
  }
  return `matrix(${r4(eu[0])} ${r4(eu[1])} ${r4(ev[0])} ${r4(ev[1])} ${r2(o[0])} ${r2(o[1])})`;
}

/** Size (u, v) of a face in grid units. */
export function faceSize(face: Face, b: Box3): V2 {
  if (face === "top") return [b.w, b.d];
  if (face === "left") return [b.w, b.h];
  return [b.d, b.h];
}


const sub = (a: V2, b: V2): V2 => [a[0] - b[0], a[1] - b[1]];

/** Projected ellipse of a horizontal circle with radius r (in grid units). */
export const ellipseR = (r: number): V2 => [Math.SQRT2 * r * COS * U, Math.SQRT2 * r * SIN * U];

/** Screen-space bounding rectangle of a 3D box. */
export function bounds2(b: Box3): [number, number, number, number] {
  const c = [
    P(b.x, b.y, b.z),
    P(b.x + b.w, b.y, b.z),
    P(b.x, b.y + b.d, b.z),
    P(b.x + b.w, b.y + b.d, b.z),
    P(b.x, b.y, b.z + b.h),
    P(b.x + b.w, b.y, b.z + b.h),
    P(b.x, b.y + b.d, b.z + b.h),
    P(b.x + b.w, b.y + b.d, b.z + b.h),
  ];
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const [a, bb] of c) {
    x0 = Math.min(x0, a);
    y0 = Math.min(y0, bb);
    x1 = Math.max(x1, a);
    y1 = Math.max(y1, bb);
  }
  return [x0, y0, x1, y1];
}

export const overlaps = (a: number[], b: number[]) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];

/**
 * Is A drawn before B? Axis-aligned boxes that don't intersect: if they are separated along
 * some axis, the one with the smaller coordinate on that axis is behind. If they intersect,
 * the center decides.
 */
export function behind(a: Box3, b: Box3): boolean {
  const e = 1e-6;
  if (a.x + a.w <= b.x + e) return true;
  if (b.x + b.w <= a.x + e) return false;
  if (a.y + a.d <= b.y + e) return true;
  if (b.y + b.d <= a.y + e) return false;
  if (a.z + a.h <= b.z + e) return true;
  if (b.z + b.h <= a.z + e) return false;
  return depthKey(a) < depthKey(b);
}

export const depthKey = (b: Box3) => b.x + b.w / 2 + b.y + b.d / 2 + (b.z + b.h / 2) * 0.01;

/**
 * Paint order: a topological sort using the `behind` relation between boxes that overlap on
 * screen; ties are broken by center depth. If there are cycles (intersecting boxes), it falls
 * back to ordering by center.
 */
export function paintOrder<T extends { box: Box3; floor?: boolean }>(items: T[]): T[] {
  const floor = items.filter((i) => i.floor).sort((a, b) => a.box.z - b.box.z || depthKey(a.box) - depthKey(b.box));
  const rest = items.filter((i) => !i.floor);
  const n = rest.length;
  const b2 = rest.map((i) => bounds2(i.box));
  const indeg = new Array(n).fill(0);
  const out: number[][] = rest.map(() => []);
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      if (!overlaps(b2[i], b2[j])) continue;
      if (behind(rest[i].box, rest[j].box)) {
        out[i].push(j);
        indeg[j]++;
      } else {
        out[j].push(i);
        indeg[i]++;
      }
    }
  const key = rest.map((i) => depthKey(i.box));
  const ready = rest.map((_, i) => i).filter((i) => indeg[i] === 0);
  const order: number[] = [];
  while (ready.length) {
    ready.sort((a, b) => key[a] - key[b]);
    const i = ready.shift()!;
    order.push(i);
    for (const j of out[i]) if (--indeg[j] === 0) ready.push(j);
  }
  if (order.length < n) {
    const seen = new Set(order);
    rest
      .map((_, i) => i)
      .filter((i) => !seen.has(i))
      .sort((a, b) => key[a] - key[b])
      .forEach((i) => order.push(i));
  }
  return [...floor, ...order.map((i) => rest[i])];
}

/** Length of a polyline, and the point at fraction t (0..1) with its direction. */
export function polyLength(ps: V2[]) {
  let L = 0;
  for (let i = 1; i < ps.length; i++) L += Math.hypot(ps[i][0] - ps[i - 1][0], ps[i][1] - ps[i - 1][1]);
  return L;
}

export function pointAt(ps: V2[], t: number): { p: V2; dir: V2 } {
  if (ps.length < 2) return { p: ps[0] ?? [0, 0], dir: [1, 0] };
  const L = polyLength(ps);
  let goal = Math.max(0, Math.min(1, t)) * L;
  for (let i = 1; i < ps.length; i++) {
    const a = ps[i - 1],
      b = ps[i];
    const s = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (goal <= s || i === ps.length - 1) {
      const k = s ? Math.min(1, goal / s) : 0;
      return { p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], dir: s ? [(b[0] - a[0]) / s, (b[1] - a[1]) / s] : [1, 0] };
    }
    goal -= s;
  }
  return { p: ps[ps.length - 1], dir: [1, 0] };
}

/** SVG path of a polyline with rounded corners (radius in px). */
export function roundedPath(ps: V2[], rad = 7): string {
  if (ps.length < 2) return "";
  let d = `M${r2(ps[0][0])} ${r2(ps[0][1])}`;
  for (let i = 1; i < ps.length - 1; i++) {
    const [a, b, c] = [ps[i - 1], ps[i], ps[i + 1]];
    const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const r = Math.min(rad, l1 / 2, l2 / 2);
    if (r < 0.5) {
      d += ` L${r2(b[0])} ${r2(b[1])}`;
      continue;
    }
    const p1: V2 = [b[0] - ((b[0] - a[0]) / l1) * r, b[1] - ((b[1] - a[1]) / l1) * r];
    const p2: V2 = [b[0] + ((c[0] - b[0]) / l2) * r, b[1] + ((c[1] - b[1]) / l2) * r];
    d += ` L${r2(p1[0])} ${r2(p1[1])} Q${r2(b[0])} ${r2(b[1])} ${r2(p2[0])} ${r2(p2[1])}`;
  }
  const z = ps[ps.length - 1];
  d += ` L${r2(z[0])} ${r2(z[1])}`;
  return d;
}

/** Trims the start and end of a polyline (px), so arrows don't run into the boxes. */
export function trim(ps: V2[], a: number, b: number): V2[] {
  const L = polyLength(ps);
  if (L <= a + b + 1) return ps;
  const out: V2[] = [];
  const start = pointAt(ps, a / L).p;
  const end = pointAt(ps, 1 - b / L).p;
  out.push(start);
  let acc = 0;
  for (let i = 1; i < ps.length; i++) {
    acc += Math.hypot(ps[i][0] - ps[i - 1][0], ps[i][1] - ps[i - 1][1]);
    if (acc > a && acc < L - b) out.push(ps[i]);
  }
  out.push(end);
  return out;
}
