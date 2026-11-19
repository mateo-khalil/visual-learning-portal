import type { ReactNode } from "react";
import { Inline, makeColorer, takeOptions, takeTone, TONE, type Tone } from "./inline";

/**
 * A tree (decisions, recursion, probabilities, a process tree), drawn top-down or
 * left to right.
 *
 * ```tree
 * title: …                            (optional)
 * direction: horizontal               (optional)
 * note: …                             (optional: small print under the diagram)
 * 1 memory access
 *   [95 %] cache HIT | 2 ns {ok}
 *   [5 %] MISS: go to RAM | 10 ns
 *     [99 %] in RAM {ok}
 *     [1 %] disk | 1,000,000 ns {bad}
 * ```
 * Indentation (2 spaces) marks children; `[text]` at the start labels the edge that
 * reaches that node; `text | sub` adds a second line. `{ok}` `{bad}` `{warn}` `{info}`
 * colors the node. Several top-level lines make a forest (no visible root).
 */

interface TNode {
  text: string;
  sub?: string;
  edge?: string;
  tone?: Tone;
  kids: TNode[];
  // layout
  w: number;
  h: number;
  span: number;
  cx: number;
  depth: number;
}

const tw = (s: string, size: number) => s.length * size * 0.58;

function parse(lines: string[]): TNode | null {
  const roots: TNode[] = [];
  const stack: { indent: number; node: TNode }[] = [];
  for (const raw of lines) {
    if (!raw.trim()) continue;
    const indent = raw.match(/^\s*/)![0].length;
    let s = raw.trim();
    let edge: string | undefined;
    const em = s.match(/^\[([^\]]*)\]\s*/);
    if (em) {
      edge = em[1];
      s = s.slice(em[0].length);
    }
    const { text: t, tone } = takeTone(s);
    const [text, sub] = t.split(" | ");
    const node: TNode = { text: text.trim(), sub: sub?.trim(), edge, tone, kids: [], w: 0, h: 0, span: 0, cx: 0, depth: 0 };
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    if (stack.length) stack[stack.length - 1].node.kids.push(node);
    else roots.push(node);
    stack.push({ indent, node });
  }
  if (!roots.length) return null;
  if (roots.length === 1) return roots[0];
  return { text: "", kids: roots, w: 0, h: 0, span: 0, cx: 0, depth: 0 };
}

export default function Tree({ body }: { body: string }) {
  const { opts, lines } = takeOptions(body, ["title", "direction", "note"]);
  const root = parse(lines);
  if (!root) return null;
  const horiz = opts.direction === "horizontal";
  const color = makeColorer();

  // Size of each node.
  const all: TNode[] = [];
  const size = (n: TNode, d: number) => {
    n.depth = d;
    n.w = Math.max(46, tw(n.text, 13) + 22, n.sub ? tw(n.sub, 11) + 20 : 0);
    n.h = n.sub ? 42 : 30;
    all.push(n);
    n.kids.forEach((k) => size(k, d + 1));
  };
  size(root, 0);
  const maxDepth = Math.max(...all.map((n) => n.depth));

  // "Breadth" along the leaves: w when vertical, h when horizontal.
  const breadth = (n: TNode) => (horiz ? n.h : n.w);
  const gapB = horiz ? 12 : 18;
  const measure = (n: TNode): number => {
    const kids = n.kids.reduce((s, k) => s + measure(k), 0) + gapB * Math.max(0, n.kids.length - 1);
    n.span = Math.max(breadth(n), kids);
    return n.span;
  };
  measure(root);
  const place = (n: TNode, from: number) => {
    if (!n.kids.length) {
      n.cx = from + n.span / 2;
      return;
    }
    const kidsSpan = n.kids.reduce((s, k) => s + k.span, 0) + gapB * (n.kids.length - 1);
    let c = from + (n.span - kidsSpan) / 2;
    for (const k of n.kids) {
      place(k, c);
      c += k.span + gapB;
    }
    n.cx = (n.kids[0].cx + n.kids[n.kids.length - 1].cx) / 2;
  };
  place(root, 0);

  // Depth → coordinate. Vertical: rows; horizontal: columns.
  const hasEdgeLabels = all.some((n) => n.edge);
  const depthSize: number[] = Array.from({ length: maxDepth + 1 }, (_, d) =>
    Math.max(...all.filter((n) => n.depth === d).map((n) => (horiz ? n.w : n.h))),
  );
  const gapD = horiz ? (hasEdgeLabels ? 110 : 56) : hasEdgeLabels ? 56 : 40;
  const depthPos: number[] = [];
  let acc = 0;
  depthSize.forEach((s, d) => {
    depthPos.push(acc + s / 2);
    acc += s + gapD;
  });
  const lenD = acc - gapD;
  const pad = 8;
  const W = (horiz ? lenD : root.span) + pad * 2;
  const H = (horiz ? root.span : lenD) + pad * 2;
  const pos = (n: TNode) => (horiz ? { x: pad + depthPos[n.depth], y: pad + n.cx } : { x: pad + n.cx, y: pad + depthPos[n.depth] });
  const hiddenRoot = !root.text;

  const nodeColor = (n: TNode) => (n.tone ? TONE[n.tone].c : /^P\d+$/.test(n.text) ? color(n.text) : undefined);

  const edges: ReactNode[] = [];
  const nodes: ReactNode[] = [];
  const walk = (n: TNode) => {
    const p = pos(n);
    for (const k of n.kids) {
      const q = pos(k);
      if (!(hiddenRoot && n === root)) {
        const x1 = horiz ? p.x + n.w / 2 : p.x;
        const y1 = horiz ? p.y : p.y + n.h / 2;
        const x2 = horiz ? q.x - k.w / 2 : q.x;
        const y2 = horiz ? q.y : q.y - k.h / 2;
        const d = horiz
          ? `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`
          : `M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`;
        const kc = nodeColor(k) ?? "var(--muted)";
        edges.push(
          <g key={`e${edges.length}`}>
            <path d={d} fill="none" stroke={kc} strokeWidth={1.6} opacity={0.75} />
            {k.edge && (
              <text
                x={(x1 + x2) / 2}
                y={(y1 + y2) / 2 + 4}
                textAnchor="middle"
                fontSize={11.5}
                fontWeight={700}
                fill="var(--foreground)"
                stroke="var(--background)"
                strokeWidth={4}
                paintOrder="stroke"
              >
                {k.edge}
              </text>
            )}
          </g>,
        );
      }
      walk(k);
    }
    if (hiddenRoot && n === root) return;
    const c = nodeColor(n);
    nodes.push(
      <g key={`n${nodes.length}`}>
        <rect
          x={p.x - n.w / 2}
          y={p.y - n.h / 2}
          width={n.w}
          height={n.h}
          rx={n.kids.length ? 7 : 15}
          fill={c ? `color-mix(in srgb, ${c} 16%, var(--card))` : "var(--card)"}
          stroke={c ?? "var(--foreground)"}
          strokeWidth={1.5}
        />
        <text x={p.x} y={p.y + (n.sub ? -3 : 4.5)} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--foreground)">
          {n.text}
        </text>
        {n.sub && (
          <text x={p.x} y={p.y + 13} textAnchor="middle" fontSize={11} fill="var(--muted)">
            {n.sub}
          </text>
        )}
      </g>,
    );
  };
  walk(root);

  return (
    <div>
      {opts.title && (
        <p className="mb-2 text-sm font-bold">
          <Inline>{opts.title}</Inline>
        </p>
      )}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mx-auto w-full"
          style={{ maxWidth: W * 1.15, minWidth: Math.min(W * 0.8, 520) }}
          role="img"
          aria-label={opts.title ?? "Tree"}
        >
          {edges}
          {nodes}
        </svg>
      </div>
      {opts.note && <p className="mt-2 text-xs text-muted">{opts.note}</p>}
    </div>
  );
}
