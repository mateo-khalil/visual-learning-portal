"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { questions, QUIZ_TOPICS, type QuizQuestion, type QuizTopic } from "@/lib/data/quiz";
import { QUIZ_BEST_KEY } from "@/lib/storage";

/**
 * Multiple choice + true/false. Free mode filters by topic; mock-test mode draws
 * MOCK_N random questions and grades them. The best score per mode/topic is kept in
 * localStorage.
 */
type Mode = "free" | "mock";
const MOCK_N = 10;
const PASS_PCT = 60;

function readBest(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(QUIZ_BEST_KEY) || "{}");
  } catch {
    return {};
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Quiz() {
  const [mode, setMode] = useState<Mode>("free");
  const [filter, setFilter] = useState<QuizTopic | "All">("All");
  const [pool, setPool] = useState<QuizQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  const build = useMemo(
    () => () => {
      if (mode === "mock") return shuffle(questions).slice(0, MOCK_N);
      return shuffle(filter === "All" ? questions : questions.filter((q) => q.topic === filter));
    },
    [filter, mode],
  );

  const reset = () => {
    setPool(build());
    setIdx(0);
    setChosen(null);
    setCorrect(0);
    setFinished(false);
  };

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, filter]);

  const bestKey = mode === "mock" ? "Mock test" : filter;
  const [best, setBest] = useState<Record<string, number>>({});
  useEffect(() => {
    setBest(readBest());
  }, []);

  if (pool.length === 0) {
    return <p className="text-sm text-muted">No questions for this filter.</p>;
  }

  const answer = (i: number) => {
    if (chosen !== null) return;
    setChosen(i);
    if (i === pool[idx].answer) setCorrect((a) => a + 1);
  };

  const next = () => {
    if (idx + 1 >= pool.length) {
      const pctNow = Math.round((correct / pool.length) * 100);
      const cur = readBest();
      if (pctNow > (cur[bestKey] ?? -1)) {
        cur[bestKey] = pctNow;
        try {
          localStorage.setItem(QUIZ_BEST_KEY, JSON.stringify(cur));
        } catch {
          /* no storage */
        }
        setBest(cur);
      }
      setFinished(true);
    } else {
      setIdx((n) => n + 1);
      setChosen(null);
    }
  };

  const controls = (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <div className="flex rounded-lg border border-border p-0.5">
        {(["free", "mock"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${mode === m ? "bg-accent text-on-accent" : "hover:text-accent"}`}
          >
            {m === "free" ? "Free mode" : `Mock test (${MOCK_N})`}
          </button>
        ))}
      </div>
      {mode === "free" && (
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as QuizTopic | "All")}
          className="rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
        >
          <option value="All">All topics</option>
          {QUIZ_TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      )}
      <button onClick={reset} className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm transition hover:border-accent">
        ⟲ Restart
      </button>
      {best[bestKey] !== undefined && (
        <span className="text-xs text-muted">
          Your best in “{bestKey}”: {best[bestKey]}%
        </span>
      )}
    </div>
  );

  if (finished) {
    const pct = Math.round((correct / pool.length) * 100);
    const pass = pct >= PASS_PCT;
    return (
      <div>
        {controls}
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-5xl font-bold text-accent">{pct}%</p>
          <p className="mt-2 text-lg">
            {correct} / {pool.length} correct
          </p>
          <p
            className={`mt-3 inline-block rounded-lg px-3 py-1 text-sm font-bold ${
              pass ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-500"
            }`}
          >
            {pass ? "Passed! 🎉" : "Time to review 💪"}
          </p>
          <div>
            <button onClick={reset} className="mt-6 rounded-lg bg-accent px-5 py-2 font-semibold text-on-accent">
              Play again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = pool[idx];

  return (
    <div>
      {controls}

      <div className="mb-3 flex items-center justify-between text-sm text-muted">
        <span>
          Question {idx + 1} / {pool.length}
        </span>
        <span className="flex flex-wrap items-center justify-end gap-1.5">
          {q.source && <span className="text-xs text-muted">{q.source}</span>}
          <span className="rounded-md bg-foreground/10 px-2 py-0.5 text-xs font-medium">{q.kind === "tf" ? "T/F" : "choice"}</span>
          <span className="rounded-md bg-accent/10 px-2 py-0.5 font-medium text-accent">{q.topic}</span>
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${((idx + (chosen !== null ? 1 : 0)) / pool.length) * 100}%` }}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-card p-5">
        <p className="mb-4 text-lg font-semibold">{q.question}</p>
        {q.code && (
          <pre className="mb-4 overflow-x-auto rounded-lg bg-[#0d1117] p-3 font-mono text-xs leading-relaxed text-[#e6edf3]">{q.code}</pre>
        )}
        <div className="space-y-2">
          {q.options.map((op, i) => {
            const isCorrect = i === q.answer;
            const isChosen = i === chosen;
            let cls = "border-border hover:border-accent";
            if (chosen !== null) {
              if (isCorrect) cls = "border-emerald-500 bg-emerald-500/10";
              else if (isChosen) cls = "border-rose-500 bg-rose-500/10";
              else cls = "border-border opacity-60";
            }
            return (
              <button
                key={i}
                onClick={() => answer(i)}
                disabled={chosen !== null}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${cls}`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border text-xs font-bold">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{op}</span>
                {chosen !== null && isCorrect && <span className="ml-auto">✓</span>}
                {chosen !== null && isChosen && !isCorrect && <span className="ml-auto">✗</span>}
              </button>
            );
          })}
        </div>

        {chosen !== null && (
          <div className="mt-4 rounded-xl border border-border bg-background p-4 text-sm">
            <p className="font-semibold text-accent">{chosen === q.answer ? "Correct!" : "Not quite"}</p>
            <p className="mt-1 text-muted">{q.explanation}</p>
            {q.debatable && (
              <p className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">
                ⚠️ <strong>Debatable:</strong> {q.debatable}
              </p>
            )}
            {q.link && (
              <Link href={q.link} className="mt-2 inline-block text-xs font-semibold text-accent">
                Review this topic →
              </Link>
            )}
            <button onClick={next} className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent">
              {idx + 1 >= pool.length ? "See result" : "Next →"}
            </button>
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-muted">Correct so far: {correct}</p>
    </div>
  );
}
