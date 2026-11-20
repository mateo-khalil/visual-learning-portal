/*
 * Digital electronics kit: chip with pins, blocks (flip-flops), gates, 7-segment display, LED,
 * LED column, potentiometer, switch, sensor, beacon, barrier, vehicle and state-machine state.
 */
import type { ReactNode } from "react";
import { boxOf, PIN_LEN, pinOffsets, type Full } from "@/lib/stage/geom";
import { P, r2, type Box3 } from "@/lib/stage/iso";
import type { Tone } from "@/lib/stage/types";
import { FaceText, IsoBox, IsoCyl, OnFace, Upright } from "../prims";
import { lines, TopText, type Kit } from "./core";

const tone = (f: Full, d: Tone): Tone => (f.tone as Tone) ?? d;
const arr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);

/** Pins of a chip or block, split into the back ones (n, w) and the front ones (s, e). */
function pinsOf(f: Full) {
  const pins = (f.pins ?? {}) as Record<string, string[]>;
  const pitch = (f.pitch as number) ?? 0.8;
  const back: ReactNode[] = [];
  const front: ReactNode[] = [];
  const labels: ReactNode[] = [];
  const body: Box3 = { x: f.x, y: f.y, z: f.z, w: f.w, d: f.d, h: f.h };
  const fs = (f.pinFs as number) ?? 0.3;
  const hi = (Array.isArray(f.hiPins) ? f.hiPins : []) as string[];
  const lit = (Array.isArray(f.litPins) ? f.litPins : []) as string[];
  for (const s of ["n", "w", "e", "s"]) {
    const names = arr(pins[s]);
    const along = s === "e" || s === "w" ? f.d : f.w;
    pinOffsets(names.length, along, pitch).forEach((o, i) => {
      const name = names[i];
      if (!name) return;
      const t = 0.26;
      let b: Box3;
      if (s === "e") b = { x: f.x + f.w, y: f.y + o - t / 2, z: f.z, w: PIN_LEN, d: t, h: 0.1 };
      else if (s === "w") b = { x: f.x - PIN_LEN, y: f.y + o - t / 2, z: f.z, w: PIN_LEN, d: t, h: 0.1 };
      else if (s === "s") b = { x: f.x + o - t / 2, y: f.y + f.d, z: f.z, w: t, d: PIN_LEN, h: 0.1 };
      else b = { x: f.x + o - t / 2, y: f.y - PIN_LEN, z: f.z, w: t, d: PIN_LEN, h: 0.1 };
      const cls = lit.includes(name) ? `tone-${(f.litTone as Tone) ?? "amber"}` : "tone-slate";
      const node = (
        <g key={`${s}${i}`} className={cls}>
          <IsoBox b={b} className="thin" />
        </g>
      );
      (s === "n" || s === "w" ? back : front).push(node);
      if (f.pinLabels === false || name.startsWith("_")) return;
      const strong = hi.includes(name);
      const cls2 = strong ? "txt-ci" : "txt";
      if (s === "e") labels.push(<FaceText key={`l${s}${i}`} face="top" b={body} u={f.w - 0.12} v={o} size={fs} anchor="end" className={cls2}>{name}</FaceText>);
      else if (s === "w") labels.push(<FaceText key={`l${s}${i}`} face="top" b={body} u={0.12} v={o} size={fs} anchor="start" className={cls2}>{name}</FaceText>);
      else if (s === "s") labels.push(<FaceText key={`l${s}${i}`} face="top" b={body} u={o} v={f.d - 0.22} size={fs} className={cls2}>{name}</FaceText>);
      else labels.push(<FaceText key={`l${s}${i}`} face="top" b={body} u={o} v={0.22} size={fs} className={cls2}>{name}</FaceText>);
    });
  }
  return { back, front, labels, body };
}

export const chip: Kit = ({ f, k }) => {
  const { back, front, labels, body } = pinsOf(f);
  const name = typeof f.name === "string" ? f.name : null;
  return (
    <g>
      {back}
      <g className={`tone-${tone(f, "ink")}`}>
        <IsoBox b={body} />
        {/* notch */}
        <OnFace face="top" b={body}>
          <path d={`M${r2(f.w / 2 - 0.3)} 0 A0.3 0.3 0 0 0 ${r2(f.w / 2 + 0.3)} 0`} fill="var(--c3)" stroke="var(--outline)" strokeWidth={0.04} />
        </OnFace>
      </g>
      <g className="chip-labels">
        <g className="tone-ink">{labels}</g>
      </g>
      {name && (
        <g className="tone-ink">
          <FaceText face="top" b={body} u={f.w / 2} v={f.d / 2} size={(f.nameFs as number) ?? 0.5} weight={700} className="chip-name" up={f.d > f.w}>
            {name}
          </FaceText>
        </g>
      )}
      {front}
      <TopText f={f} k={k} />
    </g>
  );
};

export const block: Kit = ({ f, k }) => {
  const { back, front, labels, body } = pinsOf(f);
  return (
    <g>
      {back}
      <g className={`tone-${tone(f, "sky")}`}>
        <IsoBox b={body} />
        {labels}
      </g>
      {front}
      <TopText f={f} k={k} />
    </g>
  );
};

/** Standing 7-segment display. segs: bit0 = a … bit6 = g, bit7 = dot. on: common enabled. level: brightness 0..1. */
export const seg7: Kit = ({ f }) => {
  const b = boxOf(f);
  const segs = (f.segs as number) ?? 0;
  const on = f.on !== false;
  const level = (f.level as number) ?? 1;
  const W = b.w;
  const H = b.h;
  const mx = 0.36,
    my = 0.32,
    g = 0.09;
  const u0 = mx,
    u1 = W - mx - 0.12,
    v0 = my,
    v1 = H - my,
    vm = (v0 + v1) / 2;
  const sk = 0.08; // slight italic slant
  const U0 = (v: number) => u0 + sk * (1 - v / H);
  const U1 = (v: number) => u1 + sk * (1 - v / H);
  const S: [number, number, number, number][] = [
    [U0(v0) + g, v0, U1(v0) - g, v0], // a
    [U1(v0 + g), v0 + g, U1(vm - g), vm - g], // b
    [U1(vm + g), vm + g, U1(v1 - g), v1 - g], // c
    [U0(v1) + g, v1, U1(v1) - g, v1], // d
    [U0(vm + g), vm + g, U0(v1 - g), v1 - g], // e
    [U0(v0 + g), v0 + g, U0(vm - g), vm - g], // f
    [U0(vm) + g, vm, U1(vm) - g, vm], // g
  ];
  const litTone = tone(f, "red");
  return (
    <g>
      <g className="tone-ink">
        <IsoBox b={b} />
      </g>
      <OnFace face="left" b={b}>
        <rect x={0.14} y={0.14} width={W - 0.28} height={H - 0.28} rx={0.08} fill="var(--ink-3)" stroke="none" />
        {S.map(([x1, y1, x2, y2], i) => {
          const lit = on && ((segs >> i) & 1) === 1;
          return (
            <g key={i} className={`tone-${litTone}`}>
              {lit && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ci)" strokeOpacity={0.35 * level} strokeWidth={0.34} strokeLinecap="round" />}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={lit ? "var(--c2)" : "var(--ink-1)"}
                strokeOpacity={lit ? Math.max(0.15, level) : 0.55}
                strokeWidth={0.17}
                strokeLinecap="round"
                style={{ transition: "stroke .25s ease, stroke-opacity .25s ease" }}
              />
            </g>
          );
        })}
        {(() => {
          const lit = on && ((segs >> 7) & 1) === 1;
          return <circle cx={W - 0.3} cy={v1} r={0.08} fill={lit ? "var(--red-2)" : "var(--ink-1)"} fillOpacity={lit ? level : 0.55} />;
        })()}
      </OnFace>
    </g>
  );
};

export const led: Kit = ({ f, k }) => {
  const on = !!f.on;
  const cx = f.x + f.w / 2,
    cy = f.y + f.d / 2;
  const t = tone(f, "red");
  const [gx, gy] = P(cx, cy, f.z + f.h);
  return (
    <g>
      <IsoCyl cx={cx} cy={cy} z={f.z} r={f.w / 2} h={0.12} tone="slate" />
      {on && <ellipse className={`tone-${t} lit-glow`} cx={gx} cy={gy} rx={f.w * 24 * 0.95} ry={f.w * 24 * 0.6} />}
      <IsoCyl cx={cx} cy={cy} z={f.z + 0.12} r={f.w * 0.34} h={f.h - 0.12} tone={on ? t : "paper"} />
      <TopText f={f} k={k} dy={-14} />
    </g>
  );
};

/** LED column: value (bits), names (top to bottom), n. */
export const ledbar: Kit = ({ f }) => {
  const b = boxOf(f);
  const n = (f.n as number) ?? 8;
  const value = (f.value as number) ?? 0;
  const names = arr(f.names);
  const step = (b.h - 0.3) / n;
  const t = tone(f, "red");
  return (
    <g>
      <g className="tone-ink">
        <IsoBox b={b} />
      </g>
      <OnFace face="left" b={b}>
        {Array.from({ length: n }, (_, i) => {
          const bit = n - 1 - i;
          const lit = ((value >> bit) & 1) === 1;
          const cy = 0.15 + step * (i + 0.5);
          return (
            <g key={i} className={`tone-${t}`}>
              {lit && <circle cx={0.3} cy={cy} r={0.3} fill="var(--ci)" fillOpacity={0.35} />}
              <circle cx={0.3} cy={cy} r={0.17} fill={lit ? "var(--c2)" : "var(--ink-1)"} stroke="var(--outline)" strokeWidth={0.03} style={{ transition: "fill .25s ease" }} />
            </g>
          );
        })}
      </OnFace>
      {names.map((nm, i) => (
        <g key={i}>
          <FaceText face="left" b={b} u={0.58} v={0.15 + step * (i + 0.5)} size={Math.min(0.22, step * 0.55)} anchor="start" className="txt chip-name">
            {nm}
          </FaceText>
        </g>
      ))}
    </g>
  );
};

/** Potentiometer: v from 0 to 1 (turns from −135° to +135°). */
export const pot: Kit = ({ f, k }) => {
  const b = boxOf(f);
  const v = Math.max(0, Math.min(1, (f.v as number) ?? 0));
  const r = Math.min(b.w, b.d) * 0.33;
  const cx = b.x + b.w / 2,
    cy = b.y + b.d / 2;
  const knobH = 0.42;
  const top: Box3 = { x: cx - r, y: cy - r, z: b.z + b.h, w: 2 * r, d: 2 * r, h: knobH };
  // angle on the top plane: 0 = points toward −y (back); turns toward +x
  const a = ((-135 + 270 * v) * Math.PI) / 180;
  const pu = r + Math.sin(a) * r * 0.82;
  const pv = r - Math.cos(a) * r * 0.82;
  return (
    <g>
      <IsoBox b={b} tone="slate" />
      <OnFace face="top" b={b}>
        {Array.from({ length: 11 }, (_, i) => {
          const aa = ((-135 + 27 * i) * Math.PI) / 180;
          const R1 = r * 1.15,
            R2 = r * 1.32;
          return <line key={i} x1={b.w / 2 + Math.sin(aa) * R1} y1={b.d / 2 - Math.cos(aa) * R1} x2={b.w / 2 + Math.sin(aa) * R2} y2={b.d / 2 - Math.cos(aa) * R2} stroke="var(--outline)" strokeWidth={0.04} />;
        })}
      </OnFace>
      <IsoCyl cx={cx} cy={cy} z={b.z + b.h} r={r} h={knobH} tone={tone(f, "paper")} />
      <OnFace face="top" b={top}>
        <line x1={r} y1={r} x2={pu} y2={pv} stroke="var(--outline)" strokeWidth={0.11} strokeLinecap="round" />
      </OnFace>
      <TopText f={f} k={k} dy={-20} />
    </g>
  );
};

/** Switch: on moves the lever to +x and colors it. */
export const switchK: Kit = ({ f, k }) => {
  const b = boxOf(f);
  const on = !!f.on;
  const lw = b.w * 0.42;
  const lever: Box3 = { x: on ? b.x + b.w - lw - 0.12 : b.x + 0.12, y: b.y + 0.18, z: b.z + b.h, w: lw, d: b.d - 0.36, h: 0.32 };
  return (
    <g>
      <IsoBox b={b} tone="slate" />
      <FaceText face="top" b={b} u={0.22} v={b.d - 0.12} size={0.22} anchor="start">0</FaceText>
      <FaceText face="top" b={b} u={b.w - 0.22} v={b.d - 0.12} size={0.22} anchor="end">1</FaceText>
      <IsoBox b={lever} tone={on ? tone(f, "mint") : "paper"} />
      <TopText f={f} k={k} dy={-16} />
    </g>
  );
};

export const sensor: Kit = ({ f }) => {
  const b = boxOf(f);
  const on = !!f.on;
  return (
    <g className={`tone-${on ? tone(f, "amber") : "slate"}`}>
      <IsoBox b={b} />
      {typeof f.name === "string" && (
        <FaceText face="top" b={b} u={b.w / 2} v={b.d / 2} size={0.42} weight={700}>
          {f.name}
        </FaceText>
      )}
    </g>
  );
};

/** Beacon: post and light; on = blinks (CSS, 1 Hz). */
export const lamp: Kit = ({ f }) => {
  const on = !!f.on;
  const cx = f.x + f.w / 2,
    cy = f.y + f.d / 2;
  const headZ = f.z + f.h - 0.4;
  const [gx, gy] = P(cx, cy, headZ + 0.2);
  return (
    <g>
      <IsoCyl cx={cx} cy={cy} z={f.z} r={0.22} h={0.08} tone="slate" />
      <IsoCyl cx={cx} cy={cy} z={f.z} r={0.08} h={f.h - 0.4} tone="slate" />
      <g className={on ? "blink" : ""}>
        {on && <ellipse className="tone-amber lit-glow" cx={gx} cy={gy} rx={20} ry={16} />}
        <IsoCyl cx={cx} cy={cy} z={headZ} r={0.24} h={0.4} tone={on ? tone(f, "amber") : "paper"} />
      </g>
    </g>
  );
};

/** Barrier: on = lowered (crosses the road along y). */
export const barrier: Kit = ({ f }) => {
  const b = boxOf(f);
  const down = f.on !== false;
  const post: Box3 = { x: b.x, y: b.y - 0.35, z: b.z, w: b.w, d: 0.35, h: b.h };
  const bar: Box3 = down ? { x: b.x + 0.12, y: b.y, z: b.z + b.h - 0.3, w: 0.26, d: b.d, h: 0.18 } : { x: b.x + 0.12, y: b.y - 0.3, z: b.z + b.h, w: 0.26, d: 0.26, h: b.d * 0.8 };
  return (
    <g>
      <IsoBox b={post} tone="slate" />
      <IsoBox b={bar} tone={tone(f, "rose")} />
    </g>
  );
};

export const car: Kit = ({ f }) => {
  const b = boxOf(f);
  const bodyH = b.h * 0.48;
  const body: Box3 = { x: b.x, y: b.y, z: b.z + 0.12, w: b.w, d: b.d, h: bodyH };
  const cab: Box3 = { x: b.x + b.w * 0.18, y: b.y + 0.12, z: body.z + bodyH, w: b.w * 0.5, d: b.d - 0.24, h: b.h - bodyH - 0.12 };
  const t = tone(f, "coral");
  return (
    <g>
      <g className={`tone-${t}`}>
        <IsoBox b={body} />
        <IsoBox b={cab} top="f1" />
      </g>
      <OnFace face="left" b={cab}>
        <rect x={0.12} y={0.1} width={cab.w * 0.38} height={cab.h - 0.2} rx={0.05} fill="var(--sky-1)" stroke="var(--outline)" strokeWidth={0.04} />
        <rect x={cab.w * 0.55} y={0.1} width={cab.w * 0.33} height={cab.h - 0.2} rx={0.05} fill="var(--sky-1)" stroke="var(--outline)" strokeWidth={0.04} />
      </OnFace>
      <OnFace face="right" b={cab}>
        <rect x={0.1} y={0.1} width={cab.d - 0.2} height={cab.h - 0.2} rx={0.05} fill="var(--sky-2)" stroke="var(--outline)" strokeWidth={0.04} />
      </OnFace>
      <OnFace face="left" b={body}>
        {[0.55, b.w - 0.55].map((u, i) => (
          <circle key={i} cx={u} cy={bodyH + 0.0} r={0.3} fill="var(--ink-2)" stroke="var(--outline)" strokeWidth={0.04} />
        ))}
      </OnFace>
      <OnFace face="right" b={body}>
        <rect x={0.15} y={0.12} width={0.28} height={0.16} rx={0.04} fill="var(--amber-1)" stroke="var(--outline)" strokeWidth={0.03} />
        <rect x={b.d - 0.43} y={0.12} width={0.28} height={0.16} rx={0.04} fill="var(--amber-1)" stroke="var(--outline)" strokeWidth={0.03} />
      </OnFace>
    </g>
  );
};

/** Gate: kind and | or | not | nand | nor, with the symbol drawn on top (pointing toward +x). */
export const gate: Kit = ({ f, k }) => {
  const b = boxOf(f);
  const kind = (f.kind as string) ?? "and";
  const m = 0.18;
  const w = b.w,
    d = b.d;
  const bubble = kind === "not" || kind === "nand" || kind === "nor";
  const xe = w - m - (bubble ? 0.2 : 0);
  let path = "";
  if (kind === "and" || kind === "nand") {
    const R = d / 2 - m;
    const cx = xe - R;
    path = `M${m} ${m} L${r2(cx)} ${m} A${r2(R)} ${r2(R)} 0 0 1 ${r2(cx)} ${r2(d - m)} L${m} ${r2(d - m)} Z`;
  } else if (kind === "or" || kind === "nor") {
    path = `M${m} ${m} Q${r2(w * 0.55)} ${m} ${r2(xe)} ${r2(d / 2)} Q${r2(w * 0.55)} ${r2(d - m)} ${m} ${r2(d - m)} Q${r2(m + 0.32)} ${r2(d / 2)} ${m} ${m} Z`;
  } else {
    path = `M${m} ${m} L${r2(xe)} ${r2(d / 2)} L${m} ${r2(d - m)} Z`;
  }
  return (
    <g className={`tone-${tone(f, "paper")}`}>
      <IsoBox b={b} />
      <OnFace face="top" b={b}>
        <path d={path} fill="var(--panel)" stroke="var(--outline)" strokeWidth={0.05} strokeLinejoin="round" />
        {bubble && <circle cx={xe + 0.1} cy={d / 2} r={0.1} fill="var(--panel)" stroke="var(--outline)" strokeWidth={0.05} />}
      </OnFace>
      <TopText f={f} k={k} dy={-16} />
    </g>
  );
};

/** State-machine state: a disc with the name and the output. */
export const state: Kit = ({ f, k }) => {
  const name = typeof f.name === "string" ? f.name : "";
  const out = lines(f.out);
  return (
    <g className={`tone-${tone(f, "paper")}`}>
      <IsoCyl cx={f.x + f.w / 2} cy={f.y + f.d / 2} z={f.z} r={f.w / 2} h={f.h} />
      <Upright at={[f.x + f.w / 2, f.y + f.d / 2, f.z + f.h]} lines={[name]} size={17} k={k} dy={out.length ? -7 : 0} weight={700} />
      {out.length > 0 && <Upright at={[f.x + f.w / 2, f.y + f.d / 2, f.z + f.h]} lines={out} size={10.5} k={k} dy={10} className="txt" weight={600} />}
    </g>
  );
};

export const ELECTRONICS: Record<string, Kit> = { chip, block, seg7, led, ledbar, pot, switch: switchK, sensor, lamp, barrier, car, gate, state };
