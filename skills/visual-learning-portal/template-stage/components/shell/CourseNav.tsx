"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PROGRESS_EVENT, readSeen } from "@/lib/storage";
import { UI } from "@/lib/ui";
import { lessonHref, type NavChapter } from "./nav";

/** Tree of chapters and lessons, with the progress saved in this browser. */
export default function CourseNav({ nav, current, onPick }: { nav: NavChapter[]; current?: { chapter: string; lesson: string }; onPick?: () => void }) {
  const [seen, setSeen] = useState<Record<string, number>>({});
  const [open, setOpen] = useState<Record<string, boolean>>(() => Object.fromEntries(nav.map((c) => [c.id, !current || c.id === current.chapter])));

  useEffect(() => {
    const read = () => {
      const s: Record<string, number> = {};
      for (const c of nav) for (const l of c.lessons) s[`${c.id}/${l.id}`] = readSeen(c.id, l.id);
      setSeen(s);
    };
    read();
    window.addEventListener(PROGRESS_EVENT, read);
    return () => window.removeEventListener(PROGRESS_EVENT, read);
  }, [nav]);

  const done = (c: NavChapter, l: NavChapter["lessons"][number]) => (seen[`${c.id}/${l.id}`] ?? -1) >= l.steps - 1;
  const total = nav.reduce((s, c) => s + c.lessons.length, 0);
  const totalDone = nav.reduce((s, c) => s + c.lessons.filter((l) => done(c, l)).length, 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-baseline justify-between px-1 pb-2 font-mono text-[12px]">
        <span className="font-bold">{UI.topics}</span>
        <span className="text-muted">
          {total} {UI.lessons}
        </span>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {nav.map((c, ci) => {
          const n = c.lessons.filter((l) => done(c, l)).length;
          return (
            <div key={c.id}>
              <button onClick={() => setOpen((o) => ({ ...o, [c.id]: !o[c.id] }))} className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left font-mono text-[13px] font-semibold hover:bg-panel-2">
                <span className={`inline-block transition-transform ${open[c.id] ? "rotate-90" : ""}`}>›</span>
                <span className={`tone-${c.tone} inline-block h-3.5 w-3.5 rounded-[4px] border-[1.4px] border-[var(--outline)]`} style={{ background: "var(--c2)" }} />
                <span className="flex-1">
                  0{ci + 1}. {c.short}
                </span>
                <span className="text-[11px] font-normal text-muted">
                  {n}/{c.lessons.length}
                </span>
              </button>
              {open[c.id] && (
                <ul className="mt-0.5 mb-1 ml-[15px] space-y-0.5 border-l-[1.5px] border-line pl-2">
                  {c.lessons.map((l) => {
                    const active = current?.chapter === c.id && current?.lesson === l.id;
                    const ok = done(c, l);
                    return (
                      <li key={l.id}>
                        <Link
                          href={lessonHref(c.id, l.id)}
                          onClick={onPick}
                          className={`flex items-start gap-2 rounded-lg px-2 py-1.5 font-mono text-[12.5px] leading-tight ${active ? "btn btn-primary font-semibold" : "hover:bg-panel-2"}`}
                        >
                          <span className={`mt-[1px] inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] border-[1.4px] text-[9px] ${ok ? "border-[var(--mint-i)] bg-[var(--mint-1)] text-[var(--mint-i)]" : "border-line"}`}>{ok ? "✓" : ""}</span>
                          <span>{l.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 rounded-xl border border-line bg-panel-2 px-3 py-2 font-mono text-[11.5px]">
        <div className="flex justify-between">
          <span className="font-semibold tracking-wide uppercase">{UI.progress}</span>
          <span>
            {totalDone} / {total}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(100 * totalDone) / Math.max(1, total)}%` }} />
        </div>
      </div>
    </div>
  );
}
