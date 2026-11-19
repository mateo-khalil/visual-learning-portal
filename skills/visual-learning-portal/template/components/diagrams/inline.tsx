import type { ReactNode } from "react";
/** Palette for numbered names (P1, P2…): P1 is always blue, P2 red, and so on. */
export const PROC_COLORS = ["#2563eb", "#dc2626", "#0ea5e9", "#d97706", "#9333ea", "#16a34a", "#db2777", "#65a30d", "#ea580c", "#4f46e5"];

/**
 * Helpers shared by the diagrams written in markdown as ```steps, ```flow,
 * ```sequence, ```tree, ```gantt and ```queues blocks (see `Diagram.tsx`).
 */

/** Accent palette for steps, lanes and columns (reads well in light and dark). */
export const PALETTE = ["#2563eb", "#9333ea", "#d97706", "#0891b2", "#16a34a", "#dc2626", "#db2777", "#65a30d", "#ea580c", "#4f46e5"];

export const tint = (c: string, p = 14) => `color-mix(in srgb, ${c} ${p}%, var(--card))`;

/**
 * For names that are not "Pn" (Client, Server, A, B…): another sequence, starting with
 * the colors numbered names rarely reach (P6 onwards), so "Client" never looks like P1.
 */
const NAMED_COLORS = ["#16a34a", "#db2777", "#4f46e5", "#ea580c", "#0891b2", "#9333ea", "#ca8a04", "#2563eb", "#dc2626"];

/**
 * Stable color per name: P1 always blue, P2 red… Any other name gets a color by order
 * of appearance (one colorer per diagram).
 */
export function makeColorer() {
  const seen: string[] = [];
  return (name: string): string => {
    const m = name.match(/^P(\d+)$/i);
    if (m) return PROC_COLORS[(Number(m[1]) - 1 + PROC_COLORS.length) % PROC_COLORS.length];
    let i = seen.indexOf(name);
    if (i < 0) {
      seen.push(name);
      i = seen.length - 1;
    }
    return NAMED_COLORS[i % NAMED_COLORS.length];
  };
}

export type Tone = "ok" | "bad" | "warn" | "info";

export const TONE: Record<Tone, { c: string; icon: string }> = {
  ok: { c: "#16a34a", icon: "✓" },
  bad: { c: "#e11d48", icon: "✗" },
  warn: { c: "#d97706", icon: "⚠" },
  info: { c: "#2563eb", icon: "ℹ" },
};

/** Takes a tone suffix `{ok}` `{bad}` `{warn}` `{info}` off the end of a line. */
export function takeTone(s: string): { text: string; tone?: Tone } {
  const m = s.match(/\s*\{(ok|bad|warn|info)\}\s*$/);
  if (!m) return { text: s };
  return { text: s.slice(0, m.index).trimEnd(), tone: m[1] as Tone };
}

/** Splits `title:` and other `key: value` options off the top of the block (only the given keys). */
export function takeOptions(body: string, keys: string[]): { opts: Record<string, string>; lines: string[] } {
  const opts: Record<string, string> = {};
  const lines = body.split("\n");
  const rest: string[] = [];
  let head = true;
  for (const line of lines) {
    const m = head && line.match(/^([a-z]+):\s*(.*)$/i);
    if (m && keys.includes(m[1].toLowerCase())) {
      opts[m[1].toLowerCase()] = m[2].trim();
      continue;
    }
    if (line.trim()) head = false;
    rest.push(line);
  }
  return { opts, lines: rest };
}

/**
 * Minimal inline formatting: **bold**, `code` and *italics*. Enough for diagram
 * labels without nesting another markdown renderer.
 */
export function Inline({ children }: { children: string }) {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;
  let last = 0;
  let k = 0;
  for (const m of children.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) out.push(children.slice(last, i));
    const tok = m[0];
    if (tok.startsWith("**"))
      out.push(
        <strong key={k++}>
          <Inline>{tok.slice(2, -2)}</Inline>
        </strong>,
      );
    else if (tok.startsWith("`"))
      out.push(
        <code key={k++} className="rounded bg-accent/10 px-1 py-px font-mono text-[0.92em] font-medium">
          {tok.slice(1, -1)}
        </code>,
      );
    else
      out.push(
        <em key={k++}>
          <Inline>{tok.slice(1, -1)}</Inline>
        </em>,
      );
    last = i + tok.length;
  }
  if (last < children.length) out.push(children.slice(last));
  return <>{out}</>;
}
