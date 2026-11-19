import { Inline, makeColorer, takeOptions } from "./inline";

/**
 * Gantt chart / timeline by lanes, to scale.
 *
 * ```gantt
 * title: FCFS in order P1, P2, P3       (optional)
 * scale: 0 30                           (optional: axis range; default from the data)
 * ticks: 0 3 6 30 | units | no          (optional: default = every cut; "no" = illustrative times)
 * lines: 6 "deadline", 9 "end"          (optional: vertical lines with a label)
 * legend: yes | no                      (optional: default = shown when a non-run state appears)
 * note: …                               (optional: small print next to the legend)
 * CPU: 0-24 P1, 24-27 P2, 27-30 P3
 * HIGH: 1-2, 2-10 blocked "waits for the lock"
 * LOW: 3-10> run "keeps going"
 * ```
 * Each segment is `start-end [name|state] ["text"]`; `>` after the range draws it
 * open (it continues). States: run, blocked, ready, io, spin, idle (also `-` = idle).
 * A segment with a name is drawn running in that name's color (P1 always the same);
 * without name or state it uses the lane's color. Decimals with `.` (2.5).
 */

type State = "run" | "blocked" | "ready" | "io" | "spin" | "idle";

const STATE_WORDS: Record<string, State> = {
  run: "run",
  running: "run",
  cpu: "run",
  blocked: "blocked",
  block: "blocked",
  ready: "ready",
  wait: "ready",
  io: "io",
  "i/o": "io",
  spin: "spin",
  idle: "idle",
};

const STATE_INFO: Record<State, { label: string }> = {
  run: { label: "running" },
  blocked: { label: "blocked" },
  ready: { label: "ready (waiting for the CPU)" },
  io: { label: "I/O" },
  spin: { label: "busy waiting (spins)" },
  idle: { label: "idle" },
};

interface Seg {
  a: number;
  b: number;
  open: boolean;
  state: State;
  name?: string;
  text?: string;
}
interface Lane {
  label: string;
  segs: Seg[];
}

const num = (s: string) => Number(s);

function parse(lines: string[]): Lane[] {
  const lanes: Lane[] = [];
  const segRe = /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)(>)?(?:\s+(?!")([^\s,"]+))?(?:\s*"([^"]*)")?/g;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const label = line.slice(0, colon).trim();
    const segs: Seg[] = [];
    for (const m of line.slice(colon + 1).matchAll(segRe)) {
      const word = m[4];
      const st = word ? STATE_WORDS[word.toLowerCase()] : undefined;
      segs.push({
        a: num(m[1]),
        b: num(m[2]),
        open: !!m[3],
        state: st ?? (word === "-" ? "idle" : "run"),
        name: st ? undefined : word,
        text: m[5],
      });
    }
    lanes.push({ label, segs });
  }
  return lanes;
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

const textW = (s: string, size: number) => s.length * size * 0.6 + 8;

export default function Gantt({ body }: { body: string }) {
  const { opts, lines } = takeOptions(body, ["title", "scale", "ticks", "lines", "legend", "note"]);
  const lanes = parse(lines);
  if (!lanes.length) return null;
  const color = makeColorer();
  const uid = `g${hash(body)}`;

  const all = lanes.flatMap((l) => l.segs);
  const [t0, t1] = opts.scale
    ? opts.scale.split(/\s+/).map(num)
    : [Math.min(0, ...all.map((s) => s.a)), Math.max(...all.map((s) => s.b))];

  const single = lanes.length === 1;
  const hasLabels = lanes.some((l) => l.label);
  const W = 800;
  const labelW = hasLabels ? Math.min(150, Math.max(...lanes.map((l) => textW(l.label, 12.5))) + 10) : 0;
  const padR = 14;
  const x0 = labelW + 8;
  const inner = W - x0 - padR;
  const x = (t: number) => x0 + ((t - t0) / Math.max(1e-9, t1 - t0)) * inner;
  // Axis ticks: explicit, every unit, or every cut. When two cuts are too close, the
  // second one moves up a row instead of being dropped (e.g. 117 and 121 on a 0-162 axis).
  let marks: number[];
  if (opts.ticks === "no") marks = [];
  else if (opts.ticks && opts.ticks !== "units") marks = opts.ticks.split(/\s+/).map(num);
  else if (opts.ticks === "units") marks = Array.from({ length: Math.floor(t1 - t0) + 1 }, (_, i) => t0 + i);
  else marks = Array.from(new Set([t0, ...all.flatMap((s) => [s.a, s.b])])).sort((a, b) => a - b);
  const shown: { m: number; level: number }[] = [];
  const lastX = [-Infinity, -Infinity];
  for (const m of marks) {
    if (m < t0 || m > t1) continue;
    const need = textW(String(m), 11) + 2;
    const level = x(m) - lastX[0] >= need ? 0 : x(m) - lastX[1] >= need ? 1 : -1;
    if (level < 0) continue;
    shown.push({ m, level });
    lastX[level] = x(m);
  }
  const stagger = shown.some((s) => s.level === 1) ? 13 : 0;

  const vlines = Array.from((opts.lines ?? "").matchAll(/(\d+(?:\.\d+)?)\s*(?:"([^"]*)")?/g)).map((m) => ({ t: num(m[1]), label: m[2] }));
  const vLabels = vlines.some((v) => v.label);
  const top = (opts.ticks === "no" ? (vLabels ? 22 : 8) : vLabels ? 40 : 24) + stagger;
  const barH = single ? 34 : 28;

  // Does any label not fit in its segment? Then that lane's labels go below the bar.
  const needsBelow = lanes.map((l) =>
    l.segs.some((s) => {
      const lab = s.name ?? s.text ?? "";
      return lab && x(s.b) - x(s.a) < textW(lab, 12.5);
    }),
  );
  const laneGap = single ? 0 : 12;
  const laneY: number[] = [];
  let y = top;
  lanes.forEach((_, i) => {
    laneY.push(y);
    y += barH + (needsBelow[i] ? 18 : 0) + laneGap;
  });
  const H = y + (single ? 6 : -laneGap + 8);

  const usedStates = Array.from(new Set(all.map((s) => s.state)));
  // The "running" swatch uses the color of the first running segment (not always blue).
  const firstRun = lanes.flatMap((l) => l.segs.map((s) => ({ s, l }))).find(({ s }) => s.state === "run");
  const runSwatch = firstRun ? color(firstRun.s.name ?? (firstRun.l.label || "CPU")) : "#2563eb";
  const showLegend = opts.legend !== "no" && (usedStates.some((s) => s !== "run") || opts.legend === "yes");

  const fillFor = (s: Seg, lane: Lane) => {
    const c = color(s.name ?? (lane.label || "CPU"));
    switch (s.state) {
      case "run":
        return { fill: c, stroke: c, fg: "#fff" };
      case "blocked":
        return { fill: `url(#${uid}-hatch)`, stroke: "#e11d48", fg: "var(--foreground)" };
      case "ready":
        return { fill: "color-mix(in srgb, var(--muted) 12%, var(--card))", stroke: "var(--muted)", fg: "var(--foreground)", dash: "4 3" };
      case "io":
        return { fill: "color-mix(in srgb, #d97706 30%, var(--card))", stroke: "#d97706", fg: "var(--foreground)" };
      case "spin":
        return { fill: `url(#${uid}-spin)`, stroke: "#ea580c", fg: "var(--foreground)" };
      default:
        return { fill: "color-mix(in srgb, var(--border) 60%, var(--card))", stroke: "var(--border)", fg: "var(--muted)" };
    }
  };

  return (
    <div>
      {opts.title && (
        <p className="mb-2 text-sm font-bold">
          <Inline>{opts.title}</Inline>
        </p>
      )}
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[34rem]" role="img" aria-label={opts.title ?? "Gantt chart"}>
          <defs>
            <pattern id={`${uid}-hatch`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="8" height="8" fill="color-mix(in srgb, #e11d48 12%, var(--card))" />
              <line x1="0" y1="0" x2="0" y2="8" stroke="#e11d48" strokeWidth="3" opacity="0.55" />
            </pattern>
            <pattern id={`${uid}-spin`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
              <rect width="10" height="10" fill="color-mix(in srgb, #ea580c 18%, var(--card))" />
              <line x1="0" y1="0" x2="0" y2="10" stroke="#ea580c" strokeWidth="4" opacity="0.6" />
            </pattern>
            <marker id={`${uid}-open`} viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--muted)" />
            </marker>
          </defs>

          {/* Time ticks on top and vertical guides */}
          {shown.map(({ m, level }) => (
            <g key={m}>
              <line
                x1={x(m)}
                x2={x(m)}
                y1={top - 4 - level * 11}
                y2={H - (single ? 6 : 8)}
                stroke="var(--border)"
                strokeWidth={1}
                strokeDasharray={single ? undefined : "3 3"}
              />
              <text x={x(m)} y={top - 8 - level * 13} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--muted)">
                {String(m)}
              </text>
            </g>
          ))}

          {lanes.map((lane, li) => {
            const ly = laneY[li];
            return (
              <g key={li}>
                {lane.label && (
                  <text x={labelW} y={ly + barH / 2 + 4.5} textAnchor="end" fontSize={12.5} fontWeight={700} fill="var(--foreground)">
                    {lane.label}
                  </text>
                )}
                <rect x={x(t0)} y={ly} width={inner} height={barH} rx={4} fill="none" stroke="var(--border)" strokeDasharray="4 4" />
                {lane.segs.map((s, si) => {
                  const w = Math.max(1, x(s.b) - x(s.a));
                  const st = fillFor(s, lane);
                  const lab = s.name && s.text ? `${s.name} · ${s.text}` : (s.name ?? s.text ?? "");
                  const fits = lab && w >= textW(lab, 12.5);
                  const nameOnly = s.name && !fits && w >= textW(s.name, 12.5);
                  return (
                    <g key={si}>
                      <rect
                        x={x(s.a)}
                        y={ly}
                        width={w}
                        height={barH}
                        rx={3}
                        fill={st.fill}
                        stroke={st.stroke}
                        strokeWidth={s.state === "run" ? 0.8 : 1.2}
                        strokeDasharray={st.dash}
                      />
                      {s.open && (
                        <line
                          x1={x(s.b)}
                          y1={ly + barH / 2}
                          x2={x(s.b) + 2}
                          y2={ly + barH / 2}
                          stroke="var(--muted)"
                          markerEnd={`url(#${uid}-open)`}
                        />
                      )}
                      {fits ? (
                        <text x={x(s.a) + w / 2} y={ly + barH / 2 + 4.5} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={st.fg}>
                          {lab}
                        </text>
                      ) : nameOnly ? (
                        <text x={x(s.a) + w / 2} y={ly + barH / 2 + 4.5} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={st.fg}>
                          {s.name}
                        </text>
                      ) : null}
                      {!fits && lab && needsBelow[li] && (
                        <text
                          x={x(s.a) + w / 2}
                          y={ly + barH + 14}
                          textAnchor="middle"
                          fontSize={11.5}
                          fontWeight={700}
                          fill={s.name ? color(s.name) : "var(--foreground)"}
                        >
                          {nameOnly ? s.text : (s.name ?? s.text)}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
          {vlines.map((v, i) => (
            <g key={`v${i}`}>
              <line x1={x(v.t)} x2={x(v.t)} y1={top - 6} y2={H - 4} stroke="var(--accent)" strokeWidth={2} strokeDasharray="6 4" />
              {v.label && (
                <text x={x(v.t)} y={12} textAnchor="middle" fontSize={11.5} fontWeight={800} fill="var(--accent)">
                  {v.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
      {(showLegend || opts.note) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          {showLegend &&
            usedStates.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <svg width="22" height="12" aria-hidden>
                  <rect
                    x="1"
                    y="1"
                    width="20"
                    height="10"
                    rx="2"
                    fill={
                      s === "run"
                        ? runSwatch
                        : s === "blocked"
                          ? `url(#${uid}-hatch)`
                          : s === "spin"
                            ? `url(#${uid}-spin)`
                            : s === "io"
                              ? "color-mix(in srgb, #d97706 30%, var(--card))"
                              : s === "ready"
                                ? "color-mix(in srgb, var(--muted) 12%, var(--card))"
                                : "var(--border)"
                    }
                    stroke={s === "blocked" ? "#e11d48" : s === "ready" ? "var(--muted)" : s === "io" ? "#d97706" : s === "spin" ? "#ea580c" : "none"}
                    strokeDasharray={s === "ready" ? "3 2" : undefined}
                  />
                </svg>
                {s === "run" ? "running (lane / name color)" : STATE_INFO[s].label}
              </span>
            ))}
          {opts.note && <span>{opts.note}</span>}
        </div>
      )}
    </div>
  );
}
