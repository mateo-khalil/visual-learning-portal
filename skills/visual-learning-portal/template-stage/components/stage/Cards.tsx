"use client";

/*
 * HTML cards that accompany the stage: code with highlighted lines, key-value pairs, tables,
 * calculations, waveforms (timing diagrams) and bit registers.
 */
import type { Card, Tone } from "@/lib/stage/types";
import Rich from "./Rich";

export default function Cards({ cards }: { cards: Card[] }) {
  return (
    <>
      {cards.map((c) => (
        <div key={c.id} className="card-pop overflow-hidden rounded-xl border-[1.5px] border-[var(--outline)] bg-panel shadow-[3px_3px_0_var(--outline)] dark:border-[#3a3f48]">
          {c.title && (
            <div className="border-b border-line bg-panel-2 px-3 py-1.5 font-mono text-[10.5px] font-semibold tracking-wider text-muted uppercase">
              <Rich text={c.title} />
            </div>
          )}
          <div className="px-3 py-2">
            <CardBody c={c} />
          </div>
        </div>
      ))}
    </>
  );
}

const toneText = (t?: Tone) => (t ? `var(--${t}-i)` : undefined);

function CardBody({ c }: { c: Card }) {
  switch (c.kind) {
    case "code": {
      const first = c.first ?? 1;
      return (
        <pre className="scrollbar-thin -mx-1 overflow-x-auto font-mono text-[11.5px] leading-[1.55]" style={{ fontVariantLigatures: "none" }}>
          {c.lines.map((l, i) => {
            const n = first + i;
            const hl = c.hl?.includes(n);
            const dim = c.dim?.includes(n);
            return (
              <div key={i} className={`flex gap-2 rounded px-1 ${hl ? "bg-[var(--amber-1)] text-[var(--fg)] dark:bg-[#4a3b17]" : ""} ${dim ? "opacity-40" : ""}`}>
                <span className="w-7 shrink-0 text-right text-muted select-none">{n}</span>
                <span className="whitespace-pre">{l || " "}</span>
              </div>
            );
          })}
        </pre>
      );
    }
    case "kv":
      return (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-[12px]">
          {c.rows.map(([k, v, t], i) => (
            <div key={i} className="contents">
              <dt className="text-muted">
                <Rich text={k} />
              </dt>
              <dd className="text-right font-semibold" style={{ color: toneText(t) }}>
                <Rich text={v} />
              </dd>
            </div>
          ))}
        </dl>
      );
    case "table":
      return (
        <div className="scrollbar-thin -mx-1 overflow-x-auto">
          <table className="w-full border-collapse font-mono text-[11.5px]">
            <thead>
              <tr>
                {c.head.map((h, i) => (
                  <th key={i} className={`border-b border-line px-1.5 py-1 text-left font-semibold text-muted ${c.hlCols?.includes(i) ? "bg-[var(--amber-1)] text-[var(--fg)] dark:bg-[#4a3b17]" : ""}`}>
                    <Rich text={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.rows.map((r, i) => (
                <tr key={i} className={c.hl?.includes(i) ? "bg-[var(--amber-1)] dark:bg-[#4a3b17]" : ""}>
                  {r.map((v, j) => (
                    <td key={j} className="border-b border-line/60 px-1.5 py-1 whitespace-nowrap">
                      <Rich text={v} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "text":
      return (
        <p className="text-[13px] leading-snug" style={{ color: toneText(c.tone) }}>
          <Rich text={c.text} />
        </p>
      );
    case "calc":
      return (
        <div className="font-mono text-[12px] leading-[1.7]">
          {c.lines.map((l, i) => (
            <div key={i}>
              <Rich text={l} />
            </div>
          ))}
          {c.result && (
            <div className="mt-1 rounded-md border border-[var(--mint-i)] bg-[var(--mint-1)] px-2 py-0.5 font-semibold text-[var(--fg)] dark:bg-[#1d3a2e]">
              <Rich text={c.result} />
            </div>
          )}
        </div>
      );
    case "bits": {
      const n = c.n ?? 8;
      return (
        <div className="font-mono">
          <div className="mb-1 flex items-baseline justify-between text-[12px]">
            <span className="font-semibold">
              <Rich text={c.name} />
            </span>
            <span className="text-muted">
              0x{c.value.toString(16).toUpperCase().padStart(Math.ceil(n / 4), "0")} · {c.value.toString(2).padStart(n, "0").replace(/(\d{4})(?=\d)/g, "$1 ")}
            </span>
          </div>
          <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
            {Array.from({ length: n }, (_, i) => {
              const bit = n - 1 - i;
              const v = (c.value >> bit) & 1;
              const hl = c.hl?.includes(bit);
              return (
                <div key={i} className={`flex flex-col items-center rounded-md border px-0.5 py-0.5 ${hl ? "border-[var(--amber-i)] bg-[var(--amber-1)] dark:bg-[#4a3b17]" : "border-line"}`}>
                  <span className="text-[13px] font-bold">{v}</span>
                  <span className="w-full truncate text-center text-[9px] text-muted">{c.names?.[i] ?? bit}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    case "wave":
      return <Wave c={c} />;
  }
}

function Wave({ c }: { c: Extract<Card, { kind: "wave" }> }) {
  const cols = Math.max(...c.rows.map((r) => r.v.length));
  const nameW = 46;
  const cw = 26;
  const rh = 22;
  const W = nameW + cols * cw + 4;
  const H = c.rows.length * rh + (c.ticks ? 14 : 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full font-mono" style={{ maxHeight: H * 1.25 }}>
      {c.at != null && <rect x={nameW + c.at * cw} y={0} width={cw} height={c.rows.length * rh} fill="var(--amber-1)" opacity={0.85} />}
      {c.rows.map((r, ri) => {
        const y0 = ri * rh + 4;
        const yHi = y0 + 2,
          yLo = y0 + rh - 8;
        let d = "";
        const buses: { x: number; w: number; t: string }[] = [];
        r.v.forEach((v, i) => {
          const x = nameW + i * cw;
          if (v === 0 || v === 1) {
            const y = v ? yHi : yLo;
            const prev = r.v[i - 1];
            if (i === 0 || (prev !== 0 && prev !== 1)) d += ` M${x} ${y}`;
            else if (prev !== v) d += ` L${x} ${y}`;
            d += ` L${x + cw} ${y}`;
          } else if (typeof v === "string") buses.push({ x, w: cw, t: v });
        });
        return (
          <g key={ri} className={`tone-${r.tone ?? "sky"}`}>
            <text x={2} y={(yHi + yLo) / 2} dominantBaseline="central" fontSize={10} fill="var(--muted)">
              {r.name}
            </text>
            {d && <path d={d} fill="none" stroke="var(--ci)" strokeWidth={1.8} strokeLinejoin="round" />}
            {buses.map((b, i) => (
              <g key={i}>
                <path d={`M${b.x + 2} ${(yHi + yLo) / 2} L${b.x + 5} ${yHi} L${b.x + b.w - 3} ${yHi} L${b.x + b.w} ${(yHi + yLo) / 2} L${b.x + b.w - 3} ${yLo} L${b.x + 5} ${yLo} Z`} fill="var(--c1)" stroke="var(--ci)" strokeWidth={1.2} />
                <text x={b.x + b.w / 2 + 1} y={(yHi + yLo) / 2 + 0.5} textAnchor="middle" dominantBaseline="central" fontSize={9.5} fontWeight={700} fill="var(--fg)">
                  {b.t}
                </text>
              </g>
            ))}
          </g>
        );
      })}
      {c.ticks?.map((t, i) => (
        <text key={i} x={nameW + i * cw + cw / 2} y={H - 3} textAnchor="middle" fontSize={8.5} fill="var(--muted)">
          {t}
        </text>
      ))}
    </svg>
  );
}
