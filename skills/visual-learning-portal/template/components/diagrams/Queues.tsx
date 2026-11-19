import { Inline, makeColorer, takeOptions, takeTone, tint, TONE } from "./inline";

/**
 * Queues / levels with their items inside (a ready queue, I/O queues, priority
 * levels, buckets, a call stack laid sideways…). One row per queue.
 *
 * ```queues
 * title: …                                    (optional)
 * arrows: yes                                 (optional: draws head → … between items)
 * exit: CPU                                   (optional: every queue flows into that box)
 * note: …                                     (optional: small print under the diagram)
 * level 1: P2 | always served first
 * level 3: P3 P1 | take turns, q = 2 {warn}
 * batch: "batch jobs" | lowest priority
 * empty:
 * ```
 * A row is `label: item item … | note`. Items are separated by spaces; quote an item
 * with spaces. Short capitalized names (P1, A, Tx) are drawn as solid colored chips,
 * anything else as an outlined chip. `{ok}` `{bad}` `{warn}` `{info}` colors the row.
 */

interface Row {
  label: string;
  chips: string[];
  note?: string;
  tone?: keyof typeof TONE;
}

function parse(lines: string[]): Row[] {
  const rows: Row[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const { text, tone } = takeTone(line);
    const colon = text.indexOf(":");
    if (colon < 0) continue;
    const label = text.slice(0, colon).trim();
    const [chipsPart, ...note] = text.slice(colon + 1).split(" | ");
    const chips = Array.from(chipsPart.matchAll(/"([^"]+)"|(\S+)/g)).map((m) => m[1] ?? m[2]);
    rows.push({ label, chips, note: note.join(" | ").trim() || undefined, tone });
  }
  return rows;
}

export default function Queues({ body }: { body: string }) {
  const { opts, lines } = takeOptions(body, ["title", "arrows", "exit", "note"]);
  const rows = parse(lines);
  const color = makeColorer();
  const arrows = opts.arrows === "yes";

  return (
    <div>
      {opts.title && (
        <p className="mb-2 text-sm font-bold">
          <Inline>{opts.title}</Inline>
        </p>
      )}
      <div className="flex items-stretch gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          {rows.map((r, i) => {
            const tc = r.tone ? TONE[r.tone].c : undefined;
            return (
              <div key={i} className="grid items-center gap-x-3 gap-y-1 sm:grid-cols-[minmax(6rem,auto)_minmax(0,1fr)]">
                <span className="text-sm font-bold">
                  <Inline>{r.label}</Inline>
                </span>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <div
                    className="flex min-h-9 flex-wrap items-center gap-1 rounded-lg border px-1.5 py-1"
                    style={{ borderColor: tc ?? "var(--border)", background: tc ? tint(tc, 8) : "color-mix(in srgb, var(--muted) 6%, var(--card))" }}
                  >
                    {r.chips.length === 0 && <span className="px-1 text-xs italic text-muted">empty</span>}
                    {r.chips.map((c, k) => {
                      const proc = /^[A-Z]\w{0,3}$/.test(c);
                      const pc = color(c);
                      return (
                        <span key={k} className="inline-flex items-center gap-1">
                          {arrows && k > 0 && <span className="text-xs text-muted">→</span>}
                          <span
                            className={`rounded-md px-2 py-0.5 text-sm font-bold ${proc ? "text-white" : ""}`}
                            style={proc ? { background: pc } : { background: "var(--card)", border: "1px solid var(--border)" }}
                          >
                            <Inline>{c}</Inline>
                          </span>
                        </span>
                      );
                    })}
                  </div>
                  {r.note && (
                    <span className="text-xs text-muted">
                      <Inline>{r.note}</Inline>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {opts.exit && (
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-lg text-muted">⟶</span>
            <span className="rounded-xl border-2 border-emerald-600 bg-emerald-600/10 px-3 py-4 text-sm font-extrabold">
              <Inline>{opts.exit}</Inline>
            </span>
          </div>
        )}
      </div>
      {opts.note && (
        <p className="mt-2 text-xs text-muted">
          <Inline>{opts.note}</Inline>
        </p>
      )}
    </div>
  );
}
