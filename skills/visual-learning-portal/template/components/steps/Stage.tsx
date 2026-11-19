"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";

/**
 * SVG primitives for the simulators' diagrams (slide style: dashed containers,
 * rounded boxes, the active one in indigo). Everything is drawn in viewBox
 * coordinates and scales to the available width; tones use Tailwind classes, so
 * they read well in light and dark mode.
 *
 *   <Stage w={800} h={420}>
 *     <Group {...r} label="Server" />
 *     <Box {...r} title="lo" sub="lower bound" value="0" tone="active" />
 *     <Arrow {...link(a, b)} label="SYN seq=100" tone="req" play={step} />
 *     <Chip x={400} y={300}>a[7] = 35</Chip>
 *     <Label x={20} y={20} anchor="start">index</Label>
 *   </Stage>
 */

export type Rect = { x: number; y: number; w: number; h: number };
export type Tone = "idle" | "active" | "ok" | "bad" | "warn" | "info" | "dim";
export type ArrowTone =
  "req" | "res" | "async" | "data" | "ctrl" | "bad" | "muted";

/** Arrow colors: readable on light and dark backgrounds. */
export const ARROW_COLORS: Record<ArrowTone, string> = {
  req: "#6366f1", // request / call (indigo)
  res: "#10b981", // response / ACK / ok (green)
  async: "#a855f7", // async message / event (violet)
  data: "#f59e0b", // data / blocks (amber)
  ctrl: "#0ea5e9", // control: ping, heartbeat, timer (sky)
  bad: "#f43f5e", // error / failure (rose)
  muted: "#94a3b8", // secondary (gray)
};

export const BOX_CLS: Record<Tone, { rect: string; title: string; sub: string }> = {
  idle: {
    rect: "fill-foreground/[0.06] stroke-foreground/25",
    title: "fill-foreground",
    sub: "fill-muted",
  },
  active: {
    rect: "fill-indigo-100 stroke-indigo-500 dark:fill-indigo-900 dark:stroke-indigo-400",
    title: "fill-indigo-950 dark:fill-indigo-50",
    sub: "fill-indigo-600 dark:fill-indigo-300",
  },
  ok: {
    rect: "fill-emerald-50 stroke-emerald-500 dark:fill-emerald-950 dark:stroke-emerald-500",
    title: "fill-emerald-950 dark:fill-emerald-50",
    sub: "fill-emerald-700 dark:fill-emerald-300",
  },
  bad: {
    rect: "fill-rose-50 stroke-rose-500 dark:fill-rose-950 dark:stroke-rose-500",
    title: "fill-rose-950 dark:fill-rose-50",
    sub: "fill-rose-700 dark:fill-rose-300",
  },
  warn: {
    rect: "fill-amber-50 stroke-amber-500 dark:fill-amber-950 dark:stroke-amber-500",
    title: "fill-amber-950 dark:fill-amber-50",
    sub: "fill-amber-700 dark:fill-amber-300",
  },
  info: {
    rect: "fill-sky-50 stroke-sky-500 dark:fill-sky-950 dark:stroke-sky-500",
    title: "fill-sky-950 dark:fill-sky-50",
    sub: "fill-sky-700 dark:fill-sky-300",
  },
  dim: {
    rect: "fill-foreground/[0.06] stroke-foreground/25",
    title: "fill-foreground",
    sub: "fill-muted",
  },
};

const StageCtx = createContext("stage");

export function Stage({
  w,
  h,
  children,
  className = "",
  minW,
}: {
  w: number;
  h: number;
  children: ReactNode;
  className?: string;
  /** Minimum width in px before it scrolls sideways (default ~620). */
  minW?: number;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <StageCtx.Provider value={uid}>
      {/* On a phone the diagram does not shrink below ~620 px (the text would become
          unreadable): it scrolls sideways inside its card instead. */}
      <div className="-mx-1 overflow-x-auto px-1">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          style={{ minWidth: minW ?? Math.min(w, 620) }}
          className={`h-auto w-full select-none ${className}`}
          role="img"
          fontFamily="var(--font-sans)"
        >
          <defs>
            {Object.entries(ARROW_COLORS).map(([k, c]) => (
              <marker
                key={k}
                id={`${uid}-${k}`}
                viewBox="0 0 10 10"
                refX="8.5"
                refY="5"
                markerWidth="6.5"
                markerHeight="6.5"
                orient="auto-start-reverse"
              >
                <path d="M0 0 L10 5 L0 10 z" fill={c} />
              </marker>
            ))}
          </defs>
          {children}
        </svg>
      </div>
    </StageCtx.Provider>
  );
}

/** Dashed container with a label at the top left (e.g. "Client", "Network"). */
export function Group({
  x,
  y,
  w,
  h,
  label,
  tone = "idle",
}: Rect & { label?: ReactNode; tone?: "idle" | "active" | "bad" | "ok" }) {
  const stroke =
    tone === "active"
      ? "stroke-indigo-400 dark:stroke-indigo-500"
      : tone === "bad"
        ? "stroke-rose-400 dark:stroke-rose-600"
        : tone === "ok"
          ? "stroke-emerald-400 dark:stroke-emerald-600"
          : "stroke-foreground/25";
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={22}
        className={`fill-none transition-colors duration-300 ${stroke}`}
        strokeWidth={1.5}
        strokeDasharray="6 6"
      />
      {label && (
        <text
          x={x + 22}
          y={y + 30}
          fontSize={17}
          fontWeight={600}
          className="fill-foreground"
        >
          {label}
        </text>
      )}
    </g>
  );
}

/** Box with title, subtitle and value (the value in monospace). */
export function Box({
  x,
  y,
  w,
  h,
  title,
  sub,
  value,
  tone = "idle",
  r = 14,
  titleSize = 18,
  valueSize = 17,
  dashed,
  badge,
}: Rect & {
  title?: ReactNode;
  sub?: ReactNode;
  value?: ReactNode;
  tone?: Tone;
  r?: number;
  titleSize?: number;
  valueSize?: number;
  dashed?: boolean;
  /** Tiny pill at the top right (e.g. "×", "best", "new"). */
  badge?: ReactNode;
}) {
  const cls = BOX_CLS[tone];
  const lines = [title, sub, value].filter(
    (v) => v !== undefined && v !== null && v !== "",
  );
  const gap = 22;
  const top = y + h / 2 - ((lines.length - 1) * gap) / 2;
  let i = 0;
  const cx = x + w / 2;
  return (
    <g
      opacity={tone === "dim" ? 0.35 : 1}
      className="transition-opacity duration-300"
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={r}
        strokeWidth={tone === "idle" || tone === "dim" ? 1.2 : 2}
        strokeDasharray={dashed ? "5 4" : undefined}
        className={`transition-colors duration-300 ${cls.rect}`}
      />
      {title !== undefined && title !== null && title !== "" && (
        <text
          x={cx}
          y={top + gap * i++}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={titleSize}
          fontWeight={700}
          className={cls.title}
        >
          {title}
        </text>
      )}
      {sub !== undefined && sub !== null && sub !== "" && (
        <text
          x={cx}
          y={top + gap * i++}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={13}
          className={cls.sub}
        >
          {sub}
        </text>
      )}
      {value !== undefined && value !== null && value !== "" && (
        <text
          x={cx}
          y={top + gap * i++}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={valueSize}
          fontWeight={600}
          fontFamily="var(--font-mono)"
          className={cls.title}
        >
          {value}
        </text>
      )}
      {badge && (
        <g>
          <rect
            x={x + w - 34}
            y={y - 10}
            width={44}
            height={20}
            rx={10}
            className="fill-indigo-600 dark:fill-indigo-500"
          />
          <text
            x={x + w - 12}
            y={y + 0.5}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fontWeight={700}
            fill="#fff"
          >
            {badge}
          </text>
        </g>
      )}
    </g>
  );
}

/** Estimated width of a Chip (to place labels without overlaps). */
export function chipWidth(text: string, size = 12, mono = false) {
  return text.length * size * (mono ? 0.62 : 0.56) + 14;
}

/** Label with a background (to label arrows or annotate the diagram). */
export function Chip({
  x,
  y,
  children,
  color = ARROW_COLORS.muted,
  size = 12,
  mono,
}: {
  x: number;
  y: number;
  children: string;
  color?: string;
  size?: number;
  mono?: boolean;
}) {
  const wEst = chipWidth(children, size, mono);
  return (
    <g>
      <rect
        x={x - wEst / 2}
        y={y - size * 0.95}
        width={wEst}
        height={size * 1.9}
        rx={size * 0.95}
        stroke={color}
        strokeWidth={1}
        className="fill-card"
      />
      <text
        x={x}
        y={y + 0.5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size}
        fontWeight={600}
        fill={color}
        fontFamily={mono ? "var(--font-mono)" : undefined}
      >
        {children}
      </text>
    </g>
  );
}

/**
 * Endpoints joining two boxes edge to edge (along the line between their
 * centers). `offset` shifts the arrow perpendicularly: use it to draw a request
 * and its response as two parallel arrows.
 */
export function link(a: Rect, b: Rect, offset = 0, gap = 6) {
  const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
  const bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  const dx = bc.x - ac.x;
  const dy = bc.y - ac.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const edge = (r: Rect, sx: number, sy: number) => {
    const tx = sx === 0 ? Infinity : r.w / 2 / Math.abs(sx);
    const ty = sy === 0 ? Infinity : r.h / 2 / Math.abs(sy);
    return Math.min(tx, ty);
  };
  const ux = dx / len;
  const uy = dy / len;
  const ta = edge(a, ux, uy) + gap;
  const tb = edge(b, ux, uy) + gap;
  return {
    x1: ac.x + ux * ta + nx * offset,
    y1: ac.y + uy * ta + ny * offset,
    x2: bc.x - ux * tb + nx * offset,
    y2: bc.y - uy * tb + ny * offset,
  };
}

function Packet({
  d,
  color,
  play,
  dur = 0.85,
}: {
  d: string;
  color: string;
  play: unknown;
  dur?: number;
}) {
  const circle = useRef<SVGCircleElement>(null);
  const motion = useRef<SVGAnimateMotionElement>(null);
  const fade = useRef<SVGAnimateElement>(null);
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      return;
    try {
      circle.current?.setAttribute("opacity", "1");
      motion.current?.beginElement();
      fade.current?.beginElement();
    } catch {
      /* no SMIL: nothing happens, the arrow stays without its packet */
    }
  }, [play, d]);
  return (
    <circle
      ref={circle}
      r={6}
      cx={0}
      cy={0}
      fill={color}
      opacity={0}
      stroke="white"
      strokeWidth={1.5}
    >
      <animateMotion
        ref={motion}
        dur={`${dur}s`}
        begin="indefinite"
        fill="freeze"
        path={d}
      />
      <animate
        ref={fade}
        attributeName="opacity"
        values="0;1;1;0"
        keyTimes="0;0.08;0.85;1"
        dur={`${dur}s`}
        begin="indefinite"
        fill="freeze"
      />
    </circle>
  );
}

/**
 * Arrow with an optional label. `curve` bends it (px, signed). `play`: whenever
 * it changes, a small packet travels along the arrow (pass the step number).
 * `both` draws a head at both ends.
 */
export function Arrow({
  x1,
  y1,
  x2,
  y2,
  label,
  tone = "req",
  dashed,
  curve = 0,
  labelAt = 0.5,
  labelDy = 0,
  labelShift = 0,
  play,
  both,
  width = 2.2,
  mono,
  dur,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
  tone?: ArrowTone;
  dashed?: boolean;
  curve?: number;
  labelAt?: number;
  labelDy?: number;
  /** Shifts the label perpendicular to the arrow (px, signed). */
  labelShift?: number;
  play?: unknown;
  both?: boolean;
  width?: number;
  mono?: boolean;
  /** Duration of the animated packet, in seconds. */
  dur?: number;
}) {
  const uid = useContext(StageCtx);
  const color = ARROW_COLORS[tone];
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = -(y2 - y1) / len;
  const ny = (x2 - x1) / len;
  const cx = mx + nx * curve;
  const cy = my + ny * curve;
  const d = curve
    ? `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`
    : `M${x1},${y1} L${x2},${y2}`;
  const t = labelAt;
  const lx = curve
    ? (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2
    : x1 + (x2 - x1) * t;
  const ly = curve
    ? (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2
    : y1 + (y2 - y1) * t;
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed ? "7 5" : undefined}
        strokeLinecap="round"
        markerEnd={`url(#${uid}-${tone})`}
        markerStart={both ? `url(#${uid}-${tone})` : undefined}
      />
      {play !== undefined && <Packet d={d} color={color} play={play} dur={dur} />}
      {label && (
        <Chip
          x={lx + nx * labelShift}
          y={ly + ny * labelShift + labelDy}
          color={color}
          mono={mono}
        >
          {label}
        </Chip>
      )}
    </g>
  );
}

/** Vertical lifeline for sequence diagrams (client / server). */
export function Lifeline({
  x,
  y1,
  y2,
  label,
  sub,
  tone = "idle",
}: {
  x: number;
  y1: number;
  y2: number;
  label: string;
  sub?: string;
  tone?: Tone;
}) {
  return (
    <g>
      <Box
        x={x - 70}
        y={y1}
        w={140}
        h={sub ? 52 : 40}
        title={label}
        sub={sub}
        tone={tone}
        titleSize={15}
      />
      <line
        x1={x}
        y1={y1 + (sub ? 52 : 40)}
        x2={x}
        y2={y2}
        strokeWidth={1.5}
        strokeDasharray="4 5"
        className="stroke-foreground/25"
      />
    </g>
  );
}

/** Free text in theme colors. */
export function Label({
  x,
  y,
  children,
  size = 13,
  anchor = "middle",
  weight = 500,
  tone = "muted",
  mono,
}: {
  x: number;
  y: number;
  children: ReactNode;
  size?: number;
  anchor?: "start" | "middle" | "end";
  weight?: number;
  tone?: "muted" | "strong" | "accent" | "ok" | "bad" | "warn";
  mono?: boolean;
}) {
  const cls = {
    muted: "fill-muted",
    strong: "fill-foreground",
    accent: "fill-indigo-600 dark:fill-indigo-300",
    ok: "fill-emerald-600 dark:fill-emerald-400",
    bad: "fill-rose-600 dark:fill-rose-400",
    warn: "fill-amber-600 dark:fill-amber-400",
  }[tone];
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="middle"
      fontSize={size}
      fontWeight={weight}
      className={cls}
      fontFamily={mono ? "var(--font-mono)" : undefined}
    >
      {children}
    </text>
  );
}
