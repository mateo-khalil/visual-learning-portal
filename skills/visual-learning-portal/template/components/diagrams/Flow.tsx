import { Inline, takeOptions, takeTone, tint, TONE, type Tone } from "./inline";

/**
 * A chain of boxes and arrows (pipelines, translations, conversions), one per line.
 *
 * ```flow
 * title: …                                    (optional)
 * direction: vertical                         (optional: each row becomes a column)
 * note: …                                     (optional: small print under the diagram)
 * Compiled :: hello.c|source -(gcc)-> [compiler] -> hello|executable -> ((CPU))
 * Interpreted :: script.py|source -> [interpreter|reads line by line] -> ((CPU)) {ok}
 * ```
 * Nodes: `text|subtitle` (data), `[text|sub]` (a step that processes), `((text|sub))`
 * (destination). `{ok}` `{bad}` `{warn}` `{info}` at the end of a node colors it.
 * Arrows: `->`, `-(label)->`, `~>` and `~(label)~>` (dashed), `<->` and `<-(label)->`
 * (both ways). `Row name :: …` names the row.
 */

type Kind = "data" | "proc" | "end";
interface Node {
  kind: Kind;
  text: string;
  sub?: string;
  tone?: Tone;
}
interface Arrow {
  label?: string;
  dashed: boolean;
  both: boolean;
}
interface Row {
  title?: string;
  items: (Node | Arrow)[];
}

const ARROW = /\s*(<-\((.*?)\)->|-\((.*?)\)->|~\((.*?)\)~>|<->|->|~>)\s*/g;

function parseNode(raw: string): Node {
  const { text: t, tone } = takeTone(raw.trim());
  let kind: Kind = "data";
  let s = t;
  if (s.startsWith("((") && s.endsWith("))")) {
    kind = "end";
    s = s.slice(2, -2);
  } else if (s.startsWith("[") && s.endsWith("]")) {
    kind = "proc";
    s = s.slice(1, -1);
  }
  const [text, sub] = s.split("|");
  return { kind, text: text.trim(), sub: sub?.trim(), tone };
}

function parseRow(line: string): Row {
  let title: string | undefined;
  let chain = line;
  const k = line.indexOf(" :: ");
  if (k >= 0) {
    title = line.slice(0, k).trim();
    chain = line.slice(k + 4);
  }
  const items: (Node | Arrow)[] = [];
  let last = 0;
  for (const m of chain.matchAll(ARROW)) {
    const i = m.index ?? 0;
    items.push(parseNode(chain.slice(last, i)));
    const tok = m[1];
    items.push({
      label: m[2] ?? m[3] ?? m[4],
      dashed: tok.startsWith("~"),
      both: tok.startsWith("<"),
    });
    last = i + m[0].length;
  }
  items.push(parseNode(chain.slice(last)));
  return { title, items };
}

const isArrow = (x: Node | Arrow): x is Arrow => !("kind" in x);

function NodeBox({ n }: { n: Node }) {
  const c = n.tone ? TONE[n.tone].c : n.kind === "proc" ? "#2563eb" : n.kind === "end" ? "#16a34a" : undefined;
  return (
    <span
      className={`inline-flex min-w-0 flex-col items-center justify-center border px-3 py-1.5 text-center ${
        n.kind === "end" ? "rounded-full" : "rounded-lg"
      }`}
      style={{
        borderColor: c ?? "var(--border)",
        background: c ? tint(c, n.kind === "data" ? 10 : 16) : "var(--card)",
        borderWidth: n.kind === "proc" ? 1.5 : 1,
      }}
    >
      <span className="text-sm font-bold leading-tight">
        <Inline>{n.text}</Inline>
      </span>
      {n.sub && (
        <span className="mt-0.5 text-[11px] leading-tight text-muted">
          <Inline>{n.sub}</Inline>
        </span>
      )}
    </span>
  );
}

function ArrowEl({ a, vertical }: { a: Arrow; vertical: boolean }) {
  const stroke = a.dashed ? "4 3" : undefined;
  if (vertical)
    return (
      // The arrow stays centered under the node; its label hangs to the right without moving it.
      <span className="relative flex justify-center py-0.5">
        <svg width="14" height="30" aria-hidden className="shrink-0 text-muted">
          <line x1="7" y1={a.both ? 6 : 1} x2="7" y2="23" stroke="currentColor" strokeWidth="1.6" strokeDasharray={stroke} />
          <path d="M2,22 L7,29 L12,22 z" fill="currentColor" />
          {a.both && <path d="M2,8 L7,1 L12,8 z" fill="currentColor" />}
        </svg>
        {a.label && (
          <span className="absolute left-1/2 top-1/2 ml-3 w-max max-w-[13rem] -translate-y-1/2 text-xs font-semibold leading-tight text-muted">
            <Inline>{a.label}</Inline>
          </span>
        )}
      </span>
    );
  // The arrow stretches so its label does not touch the boxes.
  const w = a.label ? Math.min(150, Math.max(48, a.label.replace(/[`*]/g, "").length * 5.6 + 10)) : 30;
  return (
    <span className="inline-flex shrink-0 flex-col items-center px-1">
      {a.label && (
        <span className="text-center text-[11px] font-semibold leading-tight text-muted" style={{ maxWidth: w }}>
          <Inline>{a.label}</Inline>
        </span>
      )}
      <svg width={w} height="12" aria-hidden className="text-muted">
        <line x1={a.both ? 7 : 1} y1="6" x2={w - 7} y2="6" stroke="currentColor" strokeWidth="1.6" strokeDasharray={stroke} />
        <path d={`M${w - 8},1 L${w},6 L${w - 8},11 z`} fill="currentColor" />
        {a.both && <path d="M8,1 L0,6 L8,11 z" fill="currentColor" />}
      </svg>
    </span>
  );
}

export default function Flow({ body }: { body: string }) {
  const { opts, lines } = takeOptions(body, ["title", "direction", "note"]);
  const rows = lines.filter((l) => l.trim()).map((l) => parseRow(l.trim()));
  const vertical = opts.direction === "vertical";
  const titled = rows.some((r) => r.title);

  return (
    <div>
      {opts.title && (
        <p className="mb-3 text-sm font-bold">
          <Inline>{opts.title}</Inline>
        </p>
      )}
      <div className={vertical ? "flex flex-wrap justify-center gap-8" : "space-y-3"}>
        {rows.map((r, i) => (
          <div
            key={i}
            className={titled && !vertical ? "grid items-center gap-x-3 gap-y-1 sm:grid-cols-[7.5rem_1fr]" : vertical ? "flex flex-col items-center" : ""}
          >
            {r.title && (
              <span className={`text-xs font-bold uppercase tracking-wide text-muted ${vertical ? "mb-1.5" : ""}`}>
                <Inline>{r.title}</Inline>
              </span>
            )}
            {!r.title && titled && !vertical && <span className="hidden sm:block" />}
            <div className={vertical ? "flex flex-col items-center" : "flex flex-wrap items-center gap-y-2"}>
              {r.items.map((it, k) => (isArrow(it) ? <ArrowEl key={k} a={it} vertical={vertical} /> : <NodeBox key={k} n={it} />))}
            </div>
          </div>
        ))}
      </div>
      {opts.note && (
        <p className="mt-3 text-xs text-muted">
          <Inline>{opts.note}</Inline>
        </p>
      )}
    </div>
  );
}
