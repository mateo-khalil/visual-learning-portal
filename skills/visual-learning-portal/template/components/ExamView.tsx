"use client";

import { useEffect, useState } from "react";
import VisContent from "./VisContent";
import type { Exam } from "@/lib/exams";

/** An exam or a question bank: each question with a collapsible model solution. */
export default function ExamView({ exam }: { exam: Exam }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [allOpen, setAllOpen] = useState(false);

  // /exams/…#q5 opens the solution of question 5 (deep links from the home or the quiz).
  useEffect(() => {
    const m = window.location.hash.match(/^#q(\d+)$/);
    if (!m) return;
    const i = Number(m[1]) - 1;
    setOpen((o) => ({ ...o, [i]: true }));
    requestAnimationFrame(() => document.getElementById(`q${i + 1}`)?.scrollIntoView());
  }, []);

  const toggleAll = () => {
    const next = !allOpen;
    setAllOpen(next);
    const map: Record<number, boolean> = {};
    exam.questions.forEach((_, i) => (map[i] = next));
    setOpen(map);
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{exam.title}</h1>
        {exam.meta && <p className="mt-1 text-sm text-muted">{exam.meta}</p>}
      </header>

      {exam.intro && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <VisContent>{exam.intro}</VisContent>
        </div>
      )}

      {exam.questions.length > 0 && (
        <button
          onClick={toggleAll}
          className="mb-4 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition hover:border-accent"
        >
          {allOpen ? "Hide all solutions" : "Show all solutions"}
        </button>
      )}

      <div className="space-y-6">
        {exam.questions.map((q, i) => (
          <section key={i} id={`q${i + 1}`} className="scroll-mt-20 rounded-xl border border-border bg-card p-4 sm:p-5">
            <h2 className="mb-2 text-lg font-bold text-accent">{q.title}</h2>
            <VisContent>{q.prompt}</VisContent>

            {q.solution && (
              <div className="mt-4">
                <button
                  onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}
                  className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm font-semibold text-accent transition hover:bg-accent/20"
                >
                  {open[i] ? "▾ Hide solution" : "▸ Show model solution"}
                </button>
                {open[i] && (
                  <div className="mt-3 rounded-lg border border-border bg-background p-4">
                    <VisContent>{q.solution}</VisContent>
                  </div>
                )}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
