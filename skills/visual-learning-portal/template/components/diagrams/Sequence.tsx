import type { CSSProperties } from "react";
import { Inline, makeColorer, takeOptions, takeTone, tint, TONE, type Tone } from "./inline";

/**
 * Sequence diagram: one column per actor (client, server, thread, OS, device…),
 * time runs downwards and arrows are the messages between columns.
 *
 * ```sequence
 * title: …                                               (optional)
 * actors: C = Client, S = Server (port 443)
 * note: …                                                (optional, as the first lines: small print under the diagram)
 * C: connect()
 * C -> S: SYN seq=100 => SYN #1
 * S -> C: send(SYN-ACK) => SYN-ACK => recv(SYN-ACK)
 * C --> S: ACK (dashed: async / may be lost)
 * @t=1s S: timer fires {warn}
 * C+S: an action spanning several columns
 * --- connection open ---
 * note: a full-width note (anywhere in the body)
 * ```
 * Message: `A -> B: label`, `A -> B: sent => received` or `A -> B: sent => label => received`.
 * `-->` is dashed (async / interrupt / lost). `#R1` adds a tag. `{ok}` `{bad}` `{warn}`
 * `{info}` colors the action (on a message, the receiving end). `@t=…` writes the time
 * in a left column (`_` becomes a space). `--- text ---` is a separator. Actors not
 * declared in `actors:` are added in order of appearance.
 */

interface Actor {
  id: string;
  label: string;
}
type Item =
  | { type: "act"; lanes: number[]; text: string; tone?: Tone; time?: string; tag?: string }
  | { type: "msg"; from: number; to: number; src?: string; label?: string; dst?: string; dashed: boolean; time?: string; tag?: string; tone?: Tone }
  | { type: "note"; text: string; time?: string; tone?: Tone }
  | { type: "sep"; text?: string };

function parse(lines: string[], actorsOpt: string | undefined) {
  const actors: Actor[] = (actorsOpt ?? "")
    .split(/\s*,\s*(?=[\p{L}\w]+\s*=)/u)
    .filter(Boolean)
    .map((a) => {
      const [id, ...rest] = a.split("=");
      return { id: id.trim(), label: (rest.join("=") || id).trim() };
    });
  const idx = (id: string) => {
    let i = actors.findIndex((a) => a.id === id.trim());
    if (i < 0) {
      actors.push({ id: id.trim(), label: id.trim() });
      i = actors.length - 1;
    }
    return i;
  };
  const items: Item[] = [];
  for (const raw of lines) {
    let line = raw.trim();
    if (!line) continue;
    if (/^-{3,}/.test(line)) {
      items.push({ type: "sep", text: line.replace(/^-+\s*/, "").replace(/\s*-+$/, "") || undefined });
      continue;
    }
    let time: string | undefined;
    const tm = line.match(/^@(\S+)\s+/);
    if (tm) {
      time = tm[1].replace(/_/g, " ");
      line = line.slice(tm[0].length);
    }
    let tag: string | undefined;
    const tg = line.match(/\s+#(\S+)\s*(\{\w+\})?$/);
    if (tg) {
      tag = tg[1];
      line = line.slice(0, tg.index) + (tg[2] ? ` ${tg[2]}` : "");
    }
    const { text: body, tone } = takeTone(line);
    const note = body.match(/^note:\s*(.*)$/i);
    if (note) {
      items.push({ type: "note", text: note[1], time, tone });
      continue;
    }
    const msg = body.match(/^([^:]+?)\s*(-->|->)\s*([^:]+?)\s*:\s*(.*)$/);
    if (msg) {
      const parts = msg[4].split(" => ").map((s) => s.trim());
      const [src, label, dst] = parts.length === 1 ? [undefined, parts[0], undefined] : parts.length === 2 ? [parts[0], undefined, parts[1]] : parts;
      items.push({ type: "msg", from: idx(msg[1]), to: idx(msg[3]), src, label, dst, dashed: msg[2] === "-->", time, tag, tone });
      continue;
    }
    const act = body.match(/^([^:]+?)\s*:\s*(.*)$/);
    if (act) {
      const lanes = act[1].split("+").map(idx);
      items.push({ type: "act", lanes, text: act[2], tone, time, tag });
    }
  }
  return { actors, items };
}

function Tag({ t }: { t?: string }) {
  if (!t) return null;
  return <span className="ml-1 shrink-0 rounded bg-foreground/80 px-1 py-px align-middle font-mono text-[10px] font-bold text-background">{t}</span>;
}

export default function Sequence({ body }: { body: string }) {
  const { opts, lines } = takeOptions(body, ["title", "actors", "note"]);
  const { actors, items } = parse(lines, opts.actors);
  const color = makeColorer();
  const n = actors.length;
  const hasTime = items.some((it) => "time" in it && it.time);
  const cols = `${hasTime ? "2.8rem " : ""}repeat(${n}, minmax(0, 1fr))`;
  const off = hasTime ? 2 : 1;
  const ac = (i: number) => color(actors[i].id);

  const chip = (text: string, c: string, tone?: Tone, tag?: string, align: CSSProperties["textAlign"] = "center") => {
    const tc = tone ? TONE[tone].c : c;
    return (
      <span
        className="inline-block min-w-0 max-w-full rounded-lg border px-2 py-1 text-[0.8rem] leading-snug [overflow-wrap:break-word]"
        style={{ borderColor: `color-mix(in srgb, ${tc} 55%, var(--border))`, background: tint(tc, tone ? 14 : 9), textAlign: align }}
      >
        {tone && (
          <span className="mr-1 font-bold" style={{ color: tc }}>
            {TONE[tone].icon}
          </span>
        )}
        {/* preferred line breaks after "_" and after "f(" (only with arguments: never "read(" | ")") */}
        <Inline>{text.replace(/_/g, "_\u200B").replace(/(\w\()(?=[^)])/g, "$1\u200B")}</Inline>
        <Tag t={tag} />
      </span>
    );
  };

  return (
    <div>
      {opts.title && (
        <p className="mb-2 text-sm font-bold">
          <Inline>{opts.title}</Inline>
        </p>
      )}
      <div className="relative overflow-x-auto">
        <div className="relative" style={{ minWidth: `${n * 8.5 + (hasTime ? 2.8 : 0)}rem` }}>
          {/* One band per actor, behind everything */}
          <div className="pointer-events-none absolute inset-0 grid gap-x-2" style={{ gridTemplateColumns: cols }} aria-hidden>
            {hasTime && <div />}
            {actors.map((_, i) => (
              <div key={i} className="relative rounded-xl" style={{ background: tint(ac(i), 5) }}>
                <div className="absolute bottom-2 left-1/2 top-10 border-l-2 border-dashed" style={{ borderColor: `color-mix(in srgb, ${ac(i)} 30%, transparent)` }} />
              </div>
            ))}
          </div>

          <div className="relative grid gap-x-2 gap-y-1.5 pb-2" style={{ gridTemplateColumns: cols }}>
            {hasTime && <div />}
            {actors.map((a, i) => (
              <div key={a.id} className="px-1 pb-1 pt-2 text-center">
                <span className="inline-block rounded-lg px-2.5 py-1 text-sm font-extrabold text-white shadow-sm" style={{ background: ac(i) }}>
                  <Inline>{a.label}</Inline>
                </span>
              </div>
            ))}

            {/* A fixed row per item (k + 2; row 1 is the header): otherwise the grid would put two
                consecutive actions of different actors on the same row and the order would be lost. */}
            {items.map((it, k) => {
              const timeCell = hasTime ? (
                <div key={`t${k}`} className="self-center pr-1 text-right font-mono text-xs font-bold text-muted" style={{ gridColumn: 1, gridRow: k + 2 }}>
                  {"time" in it ? it.time : ""}
                </div>
              ) : null;
              if (it.type === "sep")
                return (
                  <div key={k} className="flex items-center gap-2 py-1" style={{ gridColumn: `1 / -1`, gridRow: k + 2 }}>
                    <span className="h-0.5 flex-1 rounded bg-accent/60" />
                    {it.text && <span className="text-xs font-extrabold uppercase tracking-wider text-accent">{it.text}</span>}
                    <span className="h-0.5 flex-1 rounded bg-accent/60" />
                  </div>
                );
              if (it.type === "note")
                return [
                  timeCell,
                  <div key={k} className="px-1" style={{ gridColumn: `${off} / -1`, gridRow: k + 2 }}>
                    <p
                      className="rounded-lg border border-dashed px-2.5 py-1 text-center text-xs leading-snug"
                      style={{
                        borderColor: it.tone ? TONE[it.tone].c : "var(--border)",
                        background: it.tone ? tint(TONE[it.tone].c, 10) : "var(--card)",
                      }}
                    >
                      <Inline>{it.text}</Inline>
                    </p>
                  </div>,
                ];
              if (it.type === "act") {
                const a = Math.min(...it.lanes);
                const b = Math.max(...it.lanes);
                return [
                  timeCell,
                  <div key={k} className="flex justify-center px-1" style={{ gridColumn: `${a + off} / ${b + off + 1}`, gridRow: k + 2 }}>
                    {chip(it.text, a === b ? ac(a) : "#64748b", it.tone, it.tag)}
                  </div>,
                ];
              }
              // Message
              const lo = Math.min(it.from, it.to);
              const hi = Math.max(it.from, it.to);
              const right = it.to > it.from;
              const c = ac(it.from);
              const left = right ? it.src : it.dst;
              const rightText = right ? it.dst : it.src;
              const leftIsSrc = right;
              const tc = it.tone ? TONE[it.tone].c : c;
              return [
                timeCell,
                <div key={k} style={{ gridColumn: `${lo + off} / ${hi + off + 1}`, gridRow: k + 2 }}>
                  {it.label && (
                    <p className="mb-0.5 text-center text-[11px] font-bold leading-tight" style={{ color: tc }}>
                      <Inline>{it.label}</Inline>
                      {left === undefined && rightText === undefined && <Tag t={it.tag} />}
                    </p>
                  )}
                  {/* One cell per column: each end's label sits on its lifeline and the arrow
                      runs from lifeline to lifeline. */}
                  <div className="grid items-center" style={{ gridTemplateColumns: `repeat(${hi - lo + 1}, minmax(0, 1fr))` }}>
                    {Array.from({ length: hi - lo + 1 }, (_, j) => {
                      const line = (grow: string, head?: "l" | "r") => (
                        <span className={`flex items-center ${grow}`}>
                          {head === "l" && <span className="h-0 w-0 shrink-0 border-y-[6px] border-r-[9px] border-y-transparent" style={{ borderRightColor: tc }} />}
                          <span className="h-0 flex-1 border-t-2" style={{ borderColor: tc, borderStyle: it.dashed ? "dashed" : "solid" }} />
                          {head === "r" && <span className="h-0 w-0 shrink-0 border-y-[6px] border-l-[9px] border-y-transparent" style={{ borderLeftColor: tc }} />}
                        </span>
                      );
                      const gap = <span className="flex-1" />;
                      if (j > 0 && j < hi - lo) return <span key={j} className="flex">{line("flex-1")}</span>;
                      const first = j === 0;
                      const text = first ? left : rightText;
                      const isSrc = first === leftIsSrc;
                      const chipEl =
                        text !== undefined ? (
                          <span className="min-w-0 max-w-[92%] shrink">
                            {/* the message tone ({ok}, {bad}…) paints the outcome: the receiving end */}
                            {chip(text, isSrc ? c : ac(it.to), isSrc ? undefined : it.tone, isSrc ? it.tag : undefined)}
                          </span>
                        ) : null;
                      // The arrowhead goes at the receiving end, next to its label or to the lifeline.
                      const head = first ? (!right ? "l" : undefined) : right ? "r" : undefined;
                      return (
                        <span key={j} className="flex items-center">
                          {first ? gap : line("flex-1 min-w-3", head)}
                          {chipEl}
                          {first ? line("flex-1 min-w-3", head) : gap}
                        </span>
                      );
                    })}
                  </div>
                </div>,
              ];
            })}
          </div>
        </div>
      </div>
      {opts.note && (
        <p className="mt-2 text-xs text-muted">
          <Inline>{opts.note}</Inline>
        </p>
      )}
    </div>
  );
}
