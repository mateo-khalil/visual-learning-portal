/*
 * Core kit: pieces that work for any subject. Each renderer receives the full entity
 * (f: resolved sizes, lift added to z) and the camera scale k.
 */
import type { ReactNode } from "react";
import type { Full } from "@/lib/stage/geom";
import { boxOf } from "@/lib/stage/geom";
import type { Tone } from "@/lib/stage/types";
import { boxFaces, pts } from "@/lib/stage/iso";
import { FaceText, IsoBox, IsoCyl, OnFace, Upright } from "../prims";

export interface KitProps {
  f: Full;
  k: number;
}

export type Kit = (p: KitProps) => ReactNode;

export const lines = (t: unknown): string[] => (t == null ? [] : Array.isArray(t) ? (t as string[]) : [String(t)]);
const tone = (f: Full, d: Tone): Tone => (f.tone as Tone) ?? d;

/** Upright text above the top face. */
export function TopText({ f, k, size = 13, dy = 0 }: KitProps & { size?: number; dy?: number }) {
  const ls = lines(f.text);
  if (!ls.length) return null;
  return <Upright at={[f.x + f.w / 2, f.y + f.d / 2, f.z + f.h]} lines={ls} size={(f.fs as number) ?? size} k={k} dy={dy} />;
}

export const box: Kit = ({ f, k }) => {
  const b = boxOf(f);
  const faces = (f.faces ?? {}) as { top?: string; left?: string; right?: string };
  return (
    <g className={`tone-${tone(f, "paper")}`}>
      <IsoBox b={b} />
      {faces.left && (
        <FaceText face="left" b={b} u={b.w / 2} v={b.h / 2} size={Math.min(0.42, b.h * 0.5)}>
          {faces.left}
        </FaceText>
      )}
      {faces.right && (
        <FaceText face="right" b={b} u={b.d / 2} v={b.h / 2} size={Math.min(0.42, b.h * 0.5)}>
          {faces.right}
        </FaceText>
      )}
      {faces.top && (
        <FaceText face="top" b={b} u={b.w / 2} v={b.d / 2} size={(f.fs as number) ?? 0.5}>
          {faces.top}
        </FaceText>
      )}
      <TopText f={f} k={k} />
    </g>
  );
};

export const slab: Kit = ({ f }) => {
  const b = boxOf(f);
  const dashed = f.style === "dashed";
  return (
    <g className={`tone-${tone(f, "paper")}`}>
      {dashed ? (
        <OnFace face="top" b={{ ...b, h: 0 }}>
          <rect x={0} y={0} width={b.w} height={b.d} rx={0.25} fill="var(--c1)" fillOpacity={0.45} stroke="var(--ci)" strokeWidth={0.06} strokeDasharray="0.25 0.18" />
        </OnFace>
      ) : (
        <IsoBox b={b} />
      )}
      {f.lane ? (
        <OnFace face="top" b={b}>
          <line x1={0.4} x2={b.w - 0.4} y1={b.d / 2} y2={b.d / 2} stroke="var(--paper-1)" strokeWidth={0.09} strokeDasharray="0.55 0.45" />
        </OnFace>
      ) : null}
      {typeof f.title === "string" && (
        <FaceText face="top" b={b} u={0.35} v={0.5} size={(f.fs as number) ?? 0.5} anchor="start" className="txt-ci" weight={700}>
          {f.title}
        </FaceText>
      )}
    </g>
  );
};

export const tile: Kit = ({ f }) => {
  const b = boxOf(f);
  const big = typeof f.big === "string" ? f.big : null;
  const small = typeof f.small === "string" ? f.small : null;
  return (
    <g className={`tone-${tone(f, "paper")}`}>
      <IsoBox b={b} />
      {big && (
        <FaceText face="top" b={b} u={b.w / 2} v={b.d / 2 + (small ? -0.08 : 0)} size={(f.fs as number) ?? 0.55} weight={700}>
          {big}
        </FaceText>
      )}
      {small && (
        <FaceText face="top" b={b} u={b.w - 0.12} v={b.d - 0.16} size={0.22} anchor="end" className="txt-muted">
          {small}
        </FaceText>
      )}
    </g>
  );
};

export const cyl: Kit = ({ f, k }) => (
  <g className={`tone-${tone(f, "paper")}`}>
    <IsoCyl cx={f.x + f.w / 2} cy={f.y + f.d / 2} z={f.z} r={f.w / 2} h={f.h} />
    <TopText f={f} k={k} />
  </g>
);

export const label: Kit = ({ f, k }) => {
  const ls = lines(f.text);
  if (!ls.length) return null;
  return <Upright at={[f.x, f.y, f.z]} lines={ls} size={(f.fs as number) ?? 13} k={k} className={f.muted ? "txt-muted" : "txt"} />;
};

/** Container that fills up: fill from 0 to 1; marks = [{at, text}] on the right. */
export const tank: Kit = ({ f, k }) => {
  const b = boxOf(f);
  const fill = Math.max(0, Math.min(1, (f.fill as number) ?? 0));
  const marks = (Array.isArray(f.marks) ? f.marks : []) as { at: number; text: string }[];
  const liquid = { ...b, x: b.x + 0.08, y: b.y + 0.08, w: b.w - 0.16, d: b.d - 0.16, h: Math.max(0.001, b.h * fill) };
  const fc = boxFaces(b);
  return (
    <g className={`tone-${tone(f, "sky")}`}>
      <g className="tone-paper">
        <IsoBox b={{ ...b, h: 0.001 }} />
      </g>
      {fill > 0.002 && <IsoBox b={liquid} />}
      {/* glass: a veil over the front faces, plus the outline */}
      <polygon points={pts(fc.left)} fill="var(--paper-1)" fillOpacity={0.18} stroke="var(--outline)" strokeWidth={1.4} strokeLinejoin="round" />
      <polygon points={pts(fc.right)} fill="var(--paper-3)" fillOpacity={0.18} stroke="var(--outline)" strokeWidth={1.4} strokeLinejoin="round" />
      <polygon points={pts(fc.top)} fill="none" stroke="var(--outline)" strokeWidth={1.4} strokeLinejoin="round" />
      <OnFace face="right" b={b}>
        {marks.map((m, i) => (
          <g key={i}>
            <line x1={0} x2={0.35} y1={b.h * (1 - m.at)} y2={b.h * (1 - m.at)} stroke="var(--outline)" strokeWidth={0.04} />
          </g>
        ))}
      </OnFace>
      {marks.map((m, i) => (
        <FaceText key={i} face="right" b={b} u={0.45} v={b.h * (1 - m.at)} size={0.3} anchor="start">
          {m.text}
        </FaceText>
      ))}
      <TopText f={f} k={k} />
    </g>
  );
};

/** n-bit register: value, names (MSB to LSB), hl (highlighted bits), tone of the 1s. */
export const bits: Kit = ({ f }) => {
  const n = (f.n as number) ?? 8;
  const value = (f.value as number) ?? 0;
  const names = (Array.isArray(f.names) ? f.names : []) as string[];
  const hl = (Array.isArray(f.hl) ? f.hl : []) as number[];
  const cw = f.w / n;
  const on = tone(f, "amber");
  const cells = [];
  for (let i = 0; i < n; i++) {
    const bit = n - 1 - i;
    const v = (value >> bit) & 1;
    const lifted = hl.includes(bit) ? 0.18 : 0;
    const b = { x: f.x + i * cw + 0.04, y: f.y, z: f.z + lifted, w: cw - 0.08, d: f.d, h: f.h };
    cells.push(
      <g key={i} className={`tone-${v ? on : "paper"}`}>
        <IsoBox b={b} />
        <FaceText face="top" b={b} u={b.w / 2} v={b.d / 2} size={0.46} weight={700}>
          {String(v)}
        </FaceText>
        {names[i] && (
          <FaceText face="left" b={b} u={b.w / 2} v={b.h / 2} size={Math.min(0.24, (b.w / Math.max(3, [...names[i]].length)) * 1.45)}>
            {names[i]}
          </FaceText>
        )}
      </g>,
    );
  }
  return <g>{cells}</g>;
};

/** Memory: rows = [{addr, name, value, hl?}] along +y. */
export const mem: Kit = ({ f }) => {
  const rows = (Array.isArray(f.rows) ? f.rows : []) as { addr: string; name?: string; value?: string; hl?: boolean; tone?: Tone }[];
  const rd = f.d / Math.max(1, rows.length);
  return (
    <g>
      {rows.map((r, i) => {
        const b = { x: f.x, y: f.y + i * rd + 0.03, z: f.z + (r.hl ? 0.2 : 0), w: f.w, d: rd - 0.06, h: f.h };
        return (
          <g key={i} className={`tone-${r.hl ? (r.tone ?? tone(f, "amber")) : (r.tone ?? "paper")}`}>
            <IsoBox b={b} />
            <FaceText face="top" b={b} u={0.18} v={b.d / 2} size={0.3} anchor="start" className="txt-muted">
              {r.addr}
            </FaceText>
            {r.name && (
              <FaceText face="top" b={b} u={1.25} v={b.d / 2} size={0.34} anchor="start" weight={700}>
                {r.name}
              </FaceText>
            )}
            {r.value && (
              <FaceText face="top" b={b} u={b.w - 0.18} v={b.d / 2} size={0.36} anchor="end" weight={700}>
                {r.value}
              </FaceText>
            )}
          </g>
        );
      })}
    </g>
  );
};

export const CORE: Record<string, Kit> = { box, slab, tile, cyl, label, tank, bits, mem };
