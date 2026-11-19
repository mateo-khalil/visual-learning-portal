"use client";

import type { ReactNode } from "react";

/*
 * Drawing helpers for the hand-made SVG figures (components/figures/Figs*.tsx). They
 * only use the theme tokens (CSS variables), so every figure works in light and dark
 * mode without extra code. Fixed hues (green, rose…) go through `tint()`, which mixes
 * them with the card color.
 */
export const T = { fg: "var(--foreground)", muted: "var(--muted)", card: "var(--card)", border: "var(--border)", accent: "var(--accent)" };

export function Box({
  x,
  y,
  w,
  h,
  label,
  sub,
  fill = T.card,
  stroke = T.fg,
  size = 13,
  bold = true,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  fill?: string;
  stroke?: string;
  size?: number;
  bold?: boolean;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={fill} stroke={stroke} strokeWidth={1.3} />
      <text x={x + w / 2} y={y + h / 2 + (sub ? -2 : 4)} textAnchor="middle" fontSize={size} fontWeight={bold ? 700 : 500} fill={T.fg}>
        {label}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 14} textAnchor="middle" fontSize={10.5} fill={T.muted}>
          {sub}
        </text>
      )}
    </g>
  );
}

export function Arrow({ x1, y1, x2, y2, label, dashed, color = T.muted }: { x1: number; y1: number; x2: number; y2: number; label?: string; dashed?: boolean; color?: string }) {
  // The color is part of the id: two arrows with the same coordinates and different colors cannot share a head.
  const id = `fa-${Math.round(x1)}-${Math.round(y1)}-${Math.round(x2)}-${Math.round(y2)}-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <g>
      <defs>
        <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={color} />
        </marker>
      </defs>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.6} strokeDasharray={dashed ? "5 4" : undefined} markerEnd={`url(#${id})`} />
      {label && (
        <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6} textAnchor="middle" fontSize={11} fill={T.fg} stroke="var(--background)" strokeWidth={3} paintOrder="stroke">
          {label}
        </text>
      )}
    </g>
  );
}

/** Mixes a color with the card background: soft fills that work in both themes. */
export const tint = (c: string, p = 16) => `color-mix(in srgb, ${c} ${p}%, var(--card))`;

/** SVG that scales to the width, with a minimum so text stays legible on a phone (it scrolls sideways). */
export function FigFrame({ w, h, minW = 560, label, children }: { w: number; h: number; minW?: number; label: string; children: ReactNode }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <svg viewBox={`0 0 ${w} ${h}`} style={{ minWidth: Math.min(w, minW) }} className="h-auto w-full" role="img" aria-label={label} fontFamily="var(--font-sans)">
        {children}
      </svg>
    </div>
  );
}

/** Text in theme colors. */
export function Txt({
  x,
  y,
  children,
  size = 12,
  weight = 500,
  anchor = "middle",
  color = T.fg,
  mono,
}: {
  x: number;
  y: number;
  children: ReactNode;
  size?: number;
  weight?: number;
  anchor?: "start" | "middle" | "end";
  color?: string;
  mono?: boolean;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={weight} fill={color} fontFamily={mono ? "var(--font-mono)" : undefined}>
      {children}
    </text>
  );
}
