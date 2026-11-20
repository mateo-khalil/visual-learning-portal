/*
 * SVG primitives for the stage: box, cylinder, text on a face, upright text. Colors come from
 * the tone of the enclosing group (.tone-x → --c1, --c2, --c3, --ci).
 */
import type { ReactNode } from "react";
import { boxFaces, boxOutline, ellipseR, faceMatrix, P, pts, r2, type Box3, type Face } from "@/lib/stage/iso";
import type { Tone } from "@/lib/stage/types";

export function IsoBox({ b, tone, top = "f1", left = "f2", right = "f3", className }: { b: Box3; tone?: Tone; top?: string; left?: string; right?: string; className?: string }) {
  const f = boxFaces(b);
  return (
    <g className={[tone ? `tone-${tone}` : "", className ?? ""].join(" ")}>
      <polygon className={left} points={pts(f.left)} />
      <polygon className={right} points={pts(f.right)} />
      <polygon className={top} points={pts(f.top)} />
    </g>
  );
}

export function Halo({ b }: { b: Box3 }) {
  const o = boxOutline({ ...b, x: b.x - 0.08, y: b.y - 0.08, w: b.w + 0.16, d: b.d + 0.16, h: b.h + 0.04 });
  return <polygon className="halo" points={pts(o)} />;
}

/** Cylinder halo: the silhouette (top half of the lid, the sides, bottom half of the base). */
export function HaloRound({ cx, cy, z, r, h }: { cx: number; cy: number; z: number; r: number; h: number }) {
  const [rx, ry] = ellipseR(r + 0.1);
  const [bx, by] = P(cx, cy, z);
  const [, ty] = P(cx, cy, z + h);
  const d = `M${r2(bx - rx)} ${r2(ty)} A${r2(rx)} ${r2(ry)} 0 0 1 ${r2(bx + rx)} ${r2(ty)} L${r2(bx + rx)} ${r2(by)} A${r2(rx)} ${r2(ry)} 0 0 1 ${r2(bx - rx)} ${r2(by)} Z`;
  return <path className="halo" d={d} />;
}

/** Vertical cylinder: center (cx, cy) on the grid, radius r, from z to z + h. */
export function IsoCyl({ cx, cy, z, r, h, tone, top = "f1", side = "f2", className }: { cx: number; cy: number; z: number; r: number; h: number; tone?: Tone; top?: string; side?: string; className?: string }) {
  const [rx, ry] = ellipseR(r);
  const [bx, by] = P(cx, cy, z);
  const [tx, ty] = P(cx, cy, z + h);
  const sideD = `M${r2(bx - rx)} ${r2(ty)} L${r2(bx - rx)} ${r2(by)} A${r2(rx)} ${r2(ry)} 0 0 0 ${r2(bx + rx)} ${r2(by)} L${r2(bx + rx)} ${r2(ty)} Z`;
  // darker right half
  const rightD = `M${r2(bx)} ${r2(ty + ry)} L${r2(bx)} ${r2(by + ry)} A${r2(rx)} ${r2(ry)} 0 0 0 ${r2(bx + rx)} ${r2(by)} L${r2(bx + rx)} ${r2(ty)} A${r2(rx)} ${r2(ry)} 0 0 1 ${r2(bx)} ${r2(ty + ry)} Z`;
  return (
    <g className={[tone ? `tone-${tone}` : "", className ?? ""].join(" ")}>
      {h > 0.001 && (
        <>
          <path className={side} d={sideD} />
          <path className="f3 nostroke" d={rightD} />
          <path d={sideD} fill="none" stroke="var(--outline)" strokeWidth={1.4} />
        </>
      )}
      <ellipse className={top} cx={r2(tx)} cy={r2(ty)} rx={r2(rx)} ry={r2(ry)} />
    </g>
  );
}

/** Group drawn on the plane of a face: (u, v) in grid units (see faceMatrix). */
export function OnFace({ face, b, children }: { face: Face; b: Box3; children: ReactNode }) {
  return <g transform={faceMatrix(face, b)}>{children}</g>;
}

/**
 * Text on the plane of a face. size is in grid units (0.4 ≈ 10 px at scale 1). On the top face
 * it runs along +x; with up it runs along −y (rising to the right).
 */
export function FaceText({ face, b, u, v, size = 0.42, anchor = "middle", children, className = "txt", weight, up }: { face: Face; b: Box3; u: number; v: number; size?: number; anchor?: "start" | "middle" | "end"; children: string; className?: string; weight?: number; up?: boolean }) {
  const k = 24; // draw in px, then scale down
  return (
    <g transform={`${faceMatrix(face, b)} translate(${r2(u)} ${r2(v)})${up ? " rotate(-90)" : ""} scale(${1 / k})`}>
      <text className={className} x={0} y={0} fontSize={size * k} textAnchor={anchor} dominantBaseline="central" fontWeight={weight}>
        <RichTspans text={children} />
      </text>
    </g>
  );
}

/** Upright (front-facing) text centered on a grid point, with a minimum on-screen size. */
export function Upright({ at, lines, size = 13, k, className = "txt", minScreen = 10.5, dy = 0, weight = 600 }: { at: [number, number, number]; lines: string[]; size?: number; k: number; className?: string; minScreen?: number; dy?: number; weight?: number }) {
  const [x, y] = P(at[0], at[1], at[2]);
  const fs = Math.max(size, minScreen / Math.max(k, 0.01));
  const lh = fs * 1.15;
  const y0 = y + dy - ((lines.length - 1) * lh) / 2;
  return (
    <text className={className} fontSize={r2(fs)} textAnchor="middle" dominantBaseline="central" fontWeight={weight}>
      {lines.map((l, i) => (
        <tspan key={i} x={r2(x)} y={r2(y0 + i * lh)}>
          <RichTspans text={l} />
        </tspan>
      ))}
    </text>
  );
}

/**
 * Text with a negation bar: "S̅₁" (letter + U+0305) is drawn as S₁ with the bar over the S.
 * In SVG we use text-decoration: overline on a tspan.
 */
export function RichTspans({ text }: { text: string }) {
  const parts = splitOverline(text);
  return (
    <>
      {parts.map((p, i) =>
        p.ovl ? (
          <tspan key={i} style={{ textDecoration: "overline" }}>
            {p.t}
          </tspan>
        ) : (
          <tspan key={i}>{p.t}</tspan>
        ),
      )}
    </>
  );
}

/** Splits a text into runs with and without the bar (U+0305 follows each barred character). */
export function splitOverline(text: string): { t: string; ovl: boolean }[] {
  const out: { t: string; ovl: boolean }[] = [];
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (c === "̅") continue;
    const ovl = chars[i + 1] === "̅";
    const last = out[out.length - 1];
    if (last && last.ovl === ovl) last.t += c;
    else out.push({ t: c, ovl });
  }
  return out;
}
