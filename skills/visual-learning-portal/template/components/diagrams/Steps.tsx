import { Inline, PALETTE, takeOptions, takeTone, tint, TONE, type Tone } from "./inline";

/**
 * A method in numbered steps, drawn as a vertical timeline.
 *
 * ```steps
 * title: The method in 4 steps          (optional)
 * summary: no                           (optional: hides the chip strip shown for 4+ steps)
 * 1. Set the bounds | lo = 0, hi = n − 1
 *    - a bullet
 *    - a bullet that went well {ok}
 *    > a[mid] < target => lo = mid + 1 | discard the left half
 * 2. Probe the middle | mid = ⌊(lo + hi) / 2⌋
 * ```
 * A step is `N. Title | description` at column 0 (N is a number or a letter); indented
 * lines below it are a bullet (`- …`), a mapping row (`> A => B | note`, drawn as
 * "if you see A → do B") or more description. `{ok}` `{bad}` `{warn}` `{info}` at the
 * end of a bullet colors it.
 */

interface Map {
  from: string;
  to: string;
  note?: string;
}
interface Step {
  n: string;
  title: string;
  desc: string[];
  bullets: { text: string; tone?: Tone }[];
  maps: Map[];
}

function parse(lines: string[]): Step[] {
  const steps: Step[] = [];
  for (const raw of lines) {
    if (!raw.trim()) continue;
    const head = raw.match(/^(\d+|[a-z])[.)]\s+(.*)$/i);
    if (head && !/^\s/.test(raw)) {
      const [title, ...desc] = head[2].split(" | ");
      steps.push({ n: head[1], title: title.trim(), desc: desc.length ? [desc.join(" | ").trim()] : [], bullets: [], maps: [] });
      continue;
    }
    const cur = steps[steps.length - 1];
    if (!cur) continue;
    const line = raw.trim();
    if (line.startsWith("- ")) {
      cur.bullets.push(takeTone(line.slice(2)));
    } else if (line.startsWith("> ")) {
      const [pair, note] = line.slice(2).split(" | ");
      const [from, to] = pair.split(" => ");
      cur.maps.push({ from: from.trim(), to: (to ?? "").trim(), note: note?.trim() });
    } else {
      cur.desc.push(line);
    }
  }
  return steps;
}

export default function Steps({ body }: { body: string }) {
  const { opts, lines } = takeOptions(body, ["title", "summary"]);
  const steps = parse(lines);
  const color = (i: number) => PALETTE[i % PALETTE.length];
  const showStrip = steps.length >= 4 && opts.summary !== "no";

  return (
    <div>
      {opts.title && (
        <p className="mb-3 text-base font-bold">
          <Inline>{opts.title}</Inline>
        </p>
      )}
      {showStrip && (
        <div className="mb-5 flex flex-wrap items-center gap-1.5">
          {steps.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
                style={{ borderColor: color(i), background: tint(color(i), 12) }}
              >
                <span
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: color(i) }}
                >
                  {s.n}
                </span>
                {s.title}
              </span>
              {i < steps.length - 1 && <span className="text-muted">→</span>}
            </span>
          ))}
        </div>
      )}
      <ol className="m-0 list-none p-0">
        {steps.map((s, i) => (
          <li key={i} className="relative grid grid-cols-[2.5rem_1fr] gap-x-3 pb-5 last:pb-0">
            {i < steps.length - 1 && (
              <span
                className="absolute bottom-0 left-[1.25rem] top-9 w-0.5 -translate-x-1/2 rounded"
                style={{ background: `linear-gradient(${color(i)}, ${color(i + 1)})`, opacity: 0.45 }}
              />
            )}
            <span
              className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold text-white shadow-sm"
              style={{ background: color(i) }}
            >
              {s.n}
            </span>
            <div
              className="min-w-0 rounded-xl border p-3 sm:p-3.5"
              style={{ borderColor: `color-mix(in srgb, ${color(i)} 35%, var(--border))`, background: tint(color(i), 5) }}
            >
              <p className="text-sm font-extrabold uppercase tracking-wide" style={{ color: color(i) }}>
                <Inline>{s.title}</Inline>
              </p>
              {s.desc.map((d, k) => (
                <p key={k} className="mt-1 text-[0.95rem] leading-snug">
                  <Inline>{d}</Inline>
                </p>
              ))}
              {s.bullets.length > 0 && (
                <ul className="mt-1.5 space-y-1">
                  {s.bullets.map((b, k) => (
                    <li key={k} className="flex gap-2 text-sm leading-snug">
                      <span className="mt-[0.1rem] shrink-0 font-bold" style={{ color: b.tone ? TONE[b.tone].c : color(i) }}>
                        {b.tone ? TONE[b.tone].icon : "•"}
                      </span>
                      <span className="text-foreground/90">
                        <Inline>{b.text}</Inline>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {s.maps.length > 0 && (
                <div className="mt-2.5 grid gap-1.5">
                  {s.maps.map((m, k) => (
                    <div key={k} className="grid items-center gap-x-2 gap-y-1 sm:grid-cols-[minmax(0,15rem)_auto_minmax(0,1fr)]">
                      <span className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm font-medium">
                        <Inline>{m.from}</Inline>
                      </span>
                      <span className="hidden font-bold sm:block" style={{ color: color(i) }}>
                        →
                      </span>
                      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span
                          className="rounded-lg px-2.5 py-1 text-sm font-bold"
                          style={{ background: tint(color(i), 20), color: "var(--foreground)" }}
                        >
                          <span className="mr-1 sm:hidden" style={{ color: color(i) }}>
                            →
                          </span>
                          <Inline>{m.to}</Inline>
                        </span>
                        {m.note && (
                          <span className="text-xs text-muted">
                            <Inline>{m.note}</Inline>
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
