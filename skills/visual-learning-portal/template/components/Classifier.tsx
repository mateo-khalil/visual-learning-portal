"use client";

import { useMemo, useState } from "react";

import { DATASETS, type Dataset } from "@/lib/data/classifiers";

/** `[[vis:classify:<dataset>]]`: sort items into buckets, one at a time, with the why after each answer. */

const EMPTY: Dataset = { title: "(no data)", question: "", cats: [], items: [{ text: "This classifier has no items yet.", cat: "", why: "" }] };

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export default function Classifier({ dataset = "" }: { dataset?: string }) {
  const ds = DATASETS[dataset] ?? Object.values(DATASETS)[0] ?? EMPTY;
  const [seed, setSeed] = useState(0);
  // The first round keeps the authored order (stable SSR); "Again" shuffles.
  const items = useMemo(() => (seed === 0 ? ds.items : shuffle(ds.items)), [ds, seed]);
  const [idx, setIdx] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [ok, setOk] = useState(0);
  const done = idx >= items.length;
  const it = items[idx];
  const label = (id: string) => ds.cats.find((c) => c.id === id)?.label;

  const restart = () => {
    setSeed((s) => s + 1);
    setIdx(0);
    setPick(null);
    setOk(0);
  };

  if (done)
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-center">
        <p className="text-3xl font-bold text-accent">
          {ok} / {items.length}
        </p>
        <p className="mt-1 text-sm text-muted">{ok === items.length ? "Perfect!" : "Review the ones you missed and try again."}</p>
        <button onClick={restart} className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent">
          Again (shuffled)
        </button>
      </div>
    );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-muted">
        <span className="font-semibold text-foreground">{ds.title}</span>
        <span className="tabular-nums">
          {idx + 1} / {items.length} · correct {ok}
        </span>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-wider text-muted">{ds.question}</p>
        <p className="mt-2 text-lg font-semibold">{it.text}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {ds.cats.map((c) => {
            const chosen = pick === c.id;
            const right = c.id === it.cat;
            let cls = "border-border bg-background hover:border-accent";
            if (pick) cls = right ? "border-emerald-500 bg-emerald-500/10" : chosen ? "border-rose-500 bg-rose-500/10" : "border-border opacity-50";
            return (
              <button
                key={c.id}
                disabled={!!pick}
                onClick={() => {
                  setPick(c.id);
                  if (c.id === it.cat) setOk((o) => o + 1);
                }}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${cls}`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        {pick && (
          <div className="mt-3 rounded-lg border border-border bg-background p-3 text-sm">
            <p className="font-semibold">{pick === it.cat ? "✓ Right" : `✗ It is: ${label(it.cat)}`}</p>
            <p className="mt-1 text-muted">{it.why}</p>
            <button
              onClick={() => {
                setIdx((i) => i + 1);
                setPick(null);
              }}
              className="mt-2 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-on-accent"
            >
              {idx + 1 >= items.length ? "See result" : "Next →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
