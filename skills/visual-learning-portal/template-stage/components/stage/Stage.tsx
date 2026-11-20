"use client";

/*
 * The stage: draws an isometric scene and animates the transition from one step to the next.
 *
 *   <Stage scene={steps[i].scene} stepKey={i} prev={steps[i-1]?.scene} replayKey={n} paused={p} />
 *
 * - stepKey changes → builds a plan (lib/stage/anim.ts) from what is on screen now and plays it.
 * - replayKey changes → replays the transition from `prev`.
 * - The camera (viewBox) reframes itself on every step (focus / zoom to get closer) and keeps
 *   the `reserve` margin (px) clear for whatever sits on top (cards).
 * - Flows (packets along the wires) run in their own loop, and only while the step is at rest.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ease, emptyShown, frameAt, plan, shownOf, snapshot, type Frame, type Plan } from "@/lib/stage/anim";
import { boxOf, GEOM, isFloor, type Full } from "@/lib/stage/geom";
import { paintOrder, pointAt, polyLength, roundedPath, trim, U, COS, SIN, r2 } from "@/lib/stage/iso";
import { fitCamera, lerpVb, linkPts, pillLayout, pillW, PILL, type VB } from "@/lib/stage/resolve";
import type { Flow, Link, Pill, Scene, Tone, V2 } from "@/lib/stage/types";
import { KITS } from "./kits";
import { Halo, HaloRound, RichTspans } from "./prims";

export interface Reserve {
  l: number;
  r: number;
  t: number;
  b: number;
}

interface Props {
  scene: Scene;
  stepKey: number;
  prev?: Scene;
  replayKey?: number;
  paused?: boolean;
  /** No animations (prefers-reduced-motion or ?anim=0). */
  instant?: boolean;
  focus?: string[];
  zoom?: number;
  reserve?: Reserve;
  label?: string;
  className?: string;
}

const NO_RESERVE: Reserve = { l: 0, r: 0, t: 0, b: 0 };
const CAM_MIN = 820;
/** Smaller pills on narrow stages (phones): 1 from 760 px up, 0.7 at least. */
export const hudOf = (pw: number) => Math.max(0.7, Math.min(1, pw / 760));

export default function Stage({ scene, stepKey, prev, replayKey = 0, paused = false, instant = false, focus, zoom, reserve = NO_RESERVE, label, className }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ pw: 960, ph: 560 });
  const planRef = useRef<Plan>(plan(emptyShown(), scene, true));
  const t0Ref = useRef(0);
  const camRef = useRef<{ from: VB; to: VB; t0: number; dur: number } | null>(null);
  const camNow = useRef<VB | null>(null);
  const raf = useRef(0);
  const latest = useRef({ scene, prev, focus, zoom, reserve, instant, size });
  latest.current = { scene, prev, focus, zoom, reserve, instant, size };

  const target = useCallback((s: Scene, sz = latest.current.size): VB => {
    const { focus: fo, zoom: zo, reserve: rs } = latest.current;
    const pwf = Math.max(160, sz.pw - rs.l - rs.r);
    const phf = Math.max(140, sz.ph - rs.t - rs.b);
    const vb = fitCamera(s, { pw: pwf, ph: phf, focus: fo, zoom: zo, hud: hudOf(sz.pw) });
    const kk = pwf / vb[2];
    return [vb[0] - rs.l / kk, vb[1] - rs.t / kk, sz.pw / kk, sz.ph / kk];
  }, []);

  const [view, setView] = useState<{ fr: Frame; cam: VB }>(() => ({
    fr: frameAt(planRef.current, 0),
    cam: target(scene, { pw: 960, ph: 560 }),
  }));

  const loop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    const tick = () => {
      const now = performance.now();
      const fr = frameAt(planRef.current, now - t0Ref.current);
      const c = camRef.current;
      let cam = camNow.current ?? c?.to ?? [0, 0, 100, 100];
      let camDone = true;
      if (c) {
        const ct = c.dur ? Math.min(1, (now - c.t0) / c.dur) : 1;
        cam = lerpVb(c.from, c.to, ease.inOut(ct));
        camDone = ct >= 1;
      }
      camNow.current = cam;
      setView({ fr, cam });
      if (!fr.settled || !camDone) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, []);

  // Measure the container.
  useLayoutEffect(() => {
    const el = host.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const pw = Math.round(el.clientWidth);
      const ph = Math.round(el.clientHeight);
      if (pw < 10 || ph < 10) return;
      setSize((s) => (s.pw === pw && s.ph === ph ? s : { pw, ph }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reframe on a size or margin change (no step change).
  const rsKey = `${reserve.l},${reserve.r},${reserve.t},${reserve.b}`;
  const first = useRef(true);
  useEffect(() => {
    const to = target(latest.current.scene, size);
    const from = camNow.current;
    if (first.current || !from || latest.current.instant) {
      first.current = false;
      camRef.current = { from: to, to, t0: performance.now(), dur: 0 };
      camNow.current = to;
    } else camRef.current = { from, to, t0: performance.now(), dur: 380 };
    loop();
  }, [size, rsKey, target, loop]);

  // Step change (or "Replay").
  const lastStep = useRef(stepKey);
  const lastReplay = useRef(replayKey);
  useEffect(() => {
    const replay = replayKey !== lastReplay.current;
    if (stepKey === lastStep.current && !replay) return;
    lastStep.current = stepKey;
    lastReplay.current = replayKey;
    const { scene: s, prev: pv, instant: inst } = latest.current;
    const now = performance.now();
    let from = snapshot(planRef.current, now - t0Ref.current);
    let camFrom = camNow.current ?? target(s);
    if (replay) {
      from = pv ? shownOf(pv) : emptyShown();
      camFrom = pv ? target(pv) : target(s);
    }
    const p = plan(from, s, inst);
    planRef.current = p;
    t0Ref.current = now;
    camRef.current = { from: camFrom, to: target(s), t0: now, dur: inst ? 0 : Math.max(CAM_MIN, p.end * 0.9) };
    loop();
  }, [stepKey, replayKey, target, loop]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const { fr, cam } = view;
  const k = size.pw / cam[2];
  /** k for what keeps a fixed screen size (pills, labels, packets). */
  const kh = k / hudOf(size.pw);
  const ents: Record<string, Full> = {};
  for (const e of fr.ents) ents[e.id] = e.f;

  const ordered = paintOrder(fr.ents.map((e) => ({ ...e, box: boxOf(e.f), floor: isFloor(e.f) })));
  const floor = ordered.filter((o) => o.floor);
  const main = ordered.filter((o) => !o.floor);

  const links = fr.links
    .map((l) => ({ ...l, pts: linkPts(l.link, ents) }))
    .filter((l): l is typeof l & { pts: V2[] } => !!l.pts && l.pts.length >= 2);

  // Flows: only while the step is at rest and the wires are drawn.
  const settled = fr.settled;
  const flowPaths = useMemo(() => {
    if (!settled) return [];
    const byId: Record<string, V2[]> = {};
    for (const l of links) if (!l.id.endsWith("~old")) byId[l.id] = l.pts;
    return (scene.flows ?? []).filter((f) => byId[f.link]).map((f) => ({ flow: f, pts: byId[f.link], tone: f.tone ?? scene.links?.[f.link]?.tone ?? "amber" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled, stepKey, replayKey, size.pw, size.ph]);

  const cx = cam[0] + cam[2] / 2;
  const cy = cam[1] + cam[3] / 2;
  const gw = 2 * COS * U;
  const gh = 2 * SIN * U;

  return (
    <div ref={host} className={`relative h-full w-full overflow-hidden ${paused ? "paused" : ""} ${className ?? ""}`}>
      <svg className="stage-svg" viewBox={cam.map(r2).join(" ")} role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="iso-grid" width={gw} height={gh} patternUnits="userSpaceOnUse">
            <path d={`M0 0 L${gw} ${gh} M${gw} 0 L0 ${gh}`} stroke="var(--grid)" strokeWidth={1} fill="none" />
          </pattern>
          <radialGradient id="grid-fade" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={Math.max(cam[2], cam[3]) * 0.62}>
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.55" stopColor="#fff" stopOpacity="0.8" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id="grid-mask" maskUnits="userSpaceOnUse" x={cam[0]} y={cam[1]} width={cam[2]} height={cam[3]}>
            <rect x={cam[0]} y={cam[1]} width={cam[2]} height={cam[3]} fill="url(#grid-fade)" />
          </mask>
        </defs>
        <rect x={cam[0]} y={cam[1]} width={cam[2]} height={cam[3]} fill="url(#iso-grid)" mask="url(#grid-mask)" />

        <g>
          {floor.map((o) => (
            <EntityView key={o.id} f={o.f} op={o.op} k={k} />
          ))}
        </g>
        <g>
          {links
            .filter((l) => !l.link.over)
            .map((l) => (
              <LinkView key={l.id} link={l.link} pts={l.pts} op={l.op} draw={l.draw} />
            ))}
        </g>
        <Packets flows={flowPaths.filter((f) => !scene.links?.[f.flow.link]?.over)} paused={paused} k={kh} />
        <g>
          {main.map((o) => (
            <EntityView key={o.id} f={o.f} op={o.op} k={k} />
          ))}
        </g>
        <g>
          {links
            .filter((l) => l.link.over)
            .map((l) => (
              <LinkView key={l.id} link={l.link} pts={l.pts} op={l.op} draw={l.draw} />
            ))}
        </g>
        <Packets flows={flowPaths.filter((f) => !!scene.links?.[f.flow.link]?.over)} paused={paused} k={kh} />
        <g>
          {fr.ents.map((e) =>
            e.f.pills?.length ? (
              <g key={e.id} opacity={e.op} className={e.f.dim ? "dim" : ""}>
                {pillLayout(e.f, e.f.pills, kh).map((pl, i) => (
                  <PillView key={i} pill={pl.pill} x={pl.ax} y={pl.ay} ox={pl.ox} oy={pl.oy} k={kh} />
                ))}
              </g>
            ) : null,
          )}
          {links.map((l) => {
            if (!l.link.label || l.draw < 0.95) return null;
            const { p } = pointAt(l.pts, l.link.labelAt ?? 0.5);
            return (
              <g key={`lbl-${l.id}`} opacity={l.op} className={l.link.dim ? "dim" : ""}>
                <PillView pill={{ text: l.link.label, tone: l.link.level === 1 ? l.link.tone : undefined }} x={p[0]} y={p[1]} ox={0} oy={0} k={kh} />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

function EntityView({ f, op, k }: { f: Full; op: number; k: number }) {
  const kit = KITS[f.type];
  if (!kit) return null;
  return (
    <g opacity={r2(op)} className={f.dim ? "dim" : ""}>
      {f.glow ? (
        <g className={`tone-${(f.glowTone as Tone) ?? (f.tone as Tone) ?? "amber"}`}>
          {GEOM[f.type]?.round ? <HaloRound cx={f.x + f.w / 2} cy={f.y + f.d / 2} z={f.z} r={f.w / 2} h={f.h} /> : <Halo b={boxOf(f)} />}
        </g>
      ) : null}
      {kit({ f, k })}
    </g>
  );
}

function LinkView({ link, pts, op, draw }: { link: Link; pts: V2[]; op: number; draw: number }) {
  const heads = link.heads ?? "end";
  const ps = trim(pts, heads === "start" || heads === "both" ? 3 : 0, heads === "end" || heads === "both" ? 3 : 0);
  const d = roundedPath(ps);
  const L = polyLength(ps);
  const w = link.bus ? 4.6 : (link.width ?? 2.2);
  const lvl = link.level === 1 ? "on" : link.level === 0 ? "off" : "";
  const dash = link.style === "dashed" ? "7 6" : link.style === "dotted" ? "1.5 5" : undefined;
  const drawing = draw < 0.999;
  const dashArr = drawing && !dash ? `${r2(L)} ${r2(L)}` : dash;
  const dashOff = drawing && !dash ? r2(L * (1 - draw)) : undefined;
  const opacity = dash && drawing ? op * draw : op;
  const tone = link.tone ?? (link.level === 1 ? "amber" : "ink");
  return (
    <g opacity={r2(opacity)} className={`tone-${tone} ${link.dim ? "dim" : ""}`}>
      {link.level === 1 && <path className="wire-glow" d={d} strokeWidth={w + 6} strokeDasharray={dashArr} strokeDashoffset={dashOff} />}
      <path className={`wire ${lvl} ${link.level == null && link.tone ? "on" : ""}`} d={d} strokeWidth={w} strokeDasharray={dashArr} strokeDashoffset={dashOff} />
      {!drawing && (heads === "end" || heads === "both") && <Head ps={ps} at="end" cls={`head ${lvl} ${link.level == null && link.tone ? "on" : ""}`} w={w} />}
      {!drawing && (heads === "start" || heads === "both") && <Head ps={ps} at="start" cls={`head ${lvl} ${link.level == null && link.tone ? "on" : ""}`} w={w} />}
    </g>
  );
}

function Head({ ps, at, cls, w }: { ps: V2[]; at: "start" | "end"; cls: string; w: number }) {
  const [a, b] = at === "end" ? [ps[ps.length - 2], ps[ps.length - 1]] : [ps[1], ps[0]];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const ux = (b[0] - a[0]) / len,
    uy = (b[1] - a[1]) / len;
  const s = 7 + w;
  const p1: V2 = [b[0] - ux * s - uy * s * 0.55, b[1] - uy * s + ux * s * 0.55];
  const p2: V2 = [b[0] - ux * s + uy * s * 0.55, b[1] - uy * s - ux * s * 0.55];
  return <polygon className={cls} points={`${r2(b[0])},${r2(b[1])} ${r2(p1[0])},${r2(p1[1])} ${r2(p2[0])},${r2(p2[1])}`} />;
}

export function PillView({ pill, x, y, ox, oy, k }: { pill: Pill; x: number; y: number; ox: number; oy: number; k: number }) {
  const w = pillW(pill);
  const h = PILL.h;
  return (
    <g transform={`translate(${r2(x)} ${r2(y)}) scale(${r2(1 / k)}) translate(${r2(ox)} ${r2(oy)})`} className={`pill ${pill.tone ? `toned tone-${pill.tone}` : ""}`}>
      <rect x={r2(-w / 2)} y={-h / 2} width={r2(w)} height={h} rx={h / 2} />
      <text x={pill.icon ? (PILL.font + 4) / 2 : 0} y={1} textAnchor="middle" dominantBaseline="central">
        <RichTspans text={pill.text} />
      </text>
      {pill.icon && (
        <text x={r2(-w / 2 + PILL.padX + PILL.font / 2 - 1)} y={1} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 12 }}>
          {pill.icon}
        </text>
      )}
    </g>
  );
}

/** Packets that travel along the wires; their own loop with refs (doesn't re-render the stage). */
function Packets({ flows, paused, k }: { flows: { flow: Flow; pts: V2[]; tone: Tone }[]; paused: boolean; k: number }) {
  const refs = useRef<(SVGGElement | null)[]>([]);
  const start = useRef(0);
  const pausedAt = useRef<number | null>(null);
  const items = useMemo(() => flows.flatMap((f, fi) => Array.from({ length: f.flow.n ?? 1 }, (_, i) => ({ ...f, fi, i }))), [flows]);

  useEffect(() => {
    start.current = performance.now();
    pausedAt.current = null;
  }, [flows]);

  useEffect(() => {
    if (paused) {
      pausedAt.current = performance.now();
      return;
    }
    if (pausedAt.current != null) {
      start.current += performance.now() - pausedAt.current;
      pausedAt.current = null;
    }
    let id = 0;
    const tick = () => {
      const now = performance.now();
      items.forEach((it, idx) => {
        const g = refs.current[idx];
        if (!g) return;
        const dur = (it.flow.dur ?? 1.6) * 1000;
        const n = it.flow.n ?? 1;
        let t = (now - start.current) / dur + it.i / n;
        if (it.flow.once) t = Math.min(1, (now - start.current) / dur);
        else t = t % 1;
        const tt = it.flow.back ? 1 - t : t;
        const { p } = pointAt(it.pts, tt);
        g.setAttribute("transform", `translate(${r2(p[0])} ${r2(p[1])})`);
        const fade = it.flow.once ? 1 : Math.min(1, t * 8, (1 - t) * 8);
        g.setAttribute("opacity", r2(fade).toString());
      });
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [items, paused]);

  return (
    <g>
      {items.map((it, idx) => (
        <g
          key={`${it.fi}-${it.i}`}
          ref={(el) => {
            refs.current[idx] = el;
          }}
          opacity={0}
          className={`tone-${it.tone}`}
        >
          {it.flow.label ? (
            <g transform={`scale(${r2(1 / k)})`}>
              <rect x={r2(-pillW({ text: it.flow.label }) / 2)} y={-10} width={r2(pillW({ text: it.flow.label }))} height={20} rx={10} className="f1" style={{ stroke: "var(--outline)", strokeWidth: 1.6 }} />
              <text y={1} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 11.5, fontWeight: 700, fill: "var(--fg)" }}>
                <RichTspans text={it.flow.label} />
              </text>
            </g>
          ) : (
            <circle r={5.2} className="packet" />
          )}
        </g>
      ))}
    </g>
  );
}
