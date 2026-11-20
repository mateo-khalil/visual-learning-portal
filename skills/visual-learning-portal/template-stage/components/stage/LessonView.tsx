"use client";

/*
 * Lesson screen: chapter navigation | stage with metrics and cards + step bar | step text with
 * "what changed" and "you'll learn". Keyboard: ← → step, R replay, Space pause, Home / End.
 * The URL carries ?step=N (and ?anim=0 for screenshots without animation).
 */
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Callout, Lesson, Tone } from "@/lib/stage/types";
import { CALLOUTS, KINDS, UI } from "@/lib/ui";
import { readSeen, writeSeen } from "@/lib/storage";
import CourseNav from "../shell/CourseNav";
import { lessonHref, type NavChapter } from "../shell/nav";
import TopBar from "../shell/TopBar";
import Cards from "./Cards";
import Rich from "./Rich";
import Stage, { type Reserve } from "./Stage";

interface Props {
  chapter: NavChapter;
  lesson: Lesson;
  nav: NavChapter[];
  index: number;
  next?: { href: string; title: string };
  prev?: { href: string; title: string };
}

const NO_RESERVE: Reserve = { l: 0, r: 0, t: 0, b: 0 };

export default function LessonView({ chapter, lesson, nav, index, next, prev }: Props) {
  const N = lesson.steps.length;
  const [i, setI] = useState(0);
  const [replay, setReplay] = useState(0);
  const [paused, setPaused] = useState(false);
  const [instant, setInstant] = useState(false);
  const [noAnim, setNoAnim] = useState(false);
  const [seen, setSeen] = useState(-1);
  const [drawer, setDrawer] = useState(false);
  const [reserve, setReserve] = useState<Reserve>(NO_RESERVE);
  const cardsRef = useRef<HTMLDivElement>(null);
  const ready = useRef(false);

  // Initial step from the URL (without animating that first jump) and the motion preference.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const p = Number(q.get("step"));
    const off = q.get("anim") === "0" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setNoAnim(off);
    setSeen(readSeen(chapter.id, lesson.id));
    if (p >= 1 && p <= N && p !== 1) {
      setInstant(true);
      setI(p - 1);
    }
    ready.current = true;
  }, [N, chapter.id, lesson.id]);

  useEffect(() => {
    if (instant) {
      const t = setTimeout(() => setInstant(false), 50);
      return () => clearTimeout(t);
    }
  }, [instant]);

  useEffect(() => {
    if (!ready.current) return;
    const q = new URLSearchParams(window.location.search);
    q.set("step", String(i + 1));
    window.history.replaceState(null, "", `?${q.toString()}`);
    writeSeen(chapter.id, lesson.id, i);
    setSeen((s) => Math.max(s, i));
  }, [i, chapter.id, lesson.id]);

  const go = useCallback((n: number) => setI(Math.max(0, Math.min(N - 1, n))), [N]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        go(i + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(i - 1);
      } else if (e.key === "Home") go(0);
      else if (e.key === "End") go(N - 1);
      else if (e.key === "r" || e.key === "R") setReplay((n) => n + 1);
      else if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, N, go]);

  const step = lesson.steps[i];
  const cards = step.cards ?? [];
  const side = step.cardsAt ?? "right";
  const wide = cards.some((c) => c.wide);

  // Margin for the cards (only when they sit over the stage: md and up).
  useLayoutEffect(() => {
    const el = cardsRef.current;
    if (!el) return;
    const measure = () => {
      const visible = el.offsetParent !== null && cards.length > 0;
      const w = visible ? el.offsetWidth + 18 : 0;
      setReserve((r) => {
        const nr = side === "left" ? { l: w, r: 0, t: 0, b: 0 } : { l: 0, r: w, t: 0, b: 0 };
        return r.l === nr.l && r.r === nr.r ? r : nr;
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cards.length, side, wide, i]);

  // Metrics carry over: whatever a step doesn't name stays as it was.
  const metricVals = useMemo(() => {
    const out: Record<string, string | number | null>[] = [];
    let cur: Record<string, string | number | null> = {};
    for (const s of lesson.steps) {
      cur = { ...cur, ...(s.metrics ?? {}) };
      out.push(cur);
    }
    return out;
  }, [lesson.steps]);

  const learnDone = (at: number) => Math.max(seen, i) >= at;
  const kind = step.kind ? KINDS[step.kind] : null;
  const nextShort = i < N - 1 ? lesson.steps[i + 1].short : null;

  return (
    <div className="flex min-h-dvh flex-col md:h-dvh">
      <TopBar>
        <button className="btn inline-flex h-9 w-9 items-center justify-center font-mono text-[15px] min-[1200px]:hidden" aria-label={UI.menu} onClick={() => setDrawer(true)}>
          ☰
        </button>
      </TopBar>

      {drawer && (
        <div className="fixed inset-0 z-50 min-[1200px]:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDrawer(false)} />
          <div className="absolute top-0 bottom-0 left-0 w-[290px] bg-bg p-3 shadow-xl">
            <CourseNav nav={nav} current={{ chapter: chapter.id, lesson: lesson.id }} onPick={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-line bg-bg/95 px-3 py-2.5 backdrop-blur md:hidden">
        <button className="btn px-3 py-2 font-mono text-[12.5px] font-semibold" onClick={() => go(i - 1)} disabled={i === 0} aria-label={UI.back}>
          ←
        </button>
        <span className="font-mono text-[12px] text-muted">
          {i + 1}/{N}
        </span>
        {nextShort ? (
          <button className="btn btn-primary flex-1 truncate px-3 py-2 text-left font-mono text-[12.5px] font-semibold" onClick={() => go(i + 1)}>
            {nextShort} →
          </button>
        ) : (
          <Link href={next ? next.href : "/"} className="btn btn-primary flex-1 truncate px-3 py-2 text-left font-mono text-[12.5px] font-semibold">
            {next ? next.title : UI.home} →
          </Link>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 pb-20 md:flex-row md:pb-3">
        <aside className="hidden w-[250px] shrink-0 min-[1200px]:flex">
          <CourseNav nav={nav} current={{ chapter: chapter.id, lesson: lesson.id }} />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-3 max-md:contents">
          <header className="card px-4 pt-3 pb-3 max-md:order-1">
            <div className="font-mono text-[11.5px] text-muted">
              {chapter.title} <span className="mx-1">/</span> {UI.lessonOf(index + 1, chapter.lessons.length)}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="font-mono text-[21px] leading-tight font-bold tracking-tight md:text-[24px]">{lesson.title}</h1>
              <div className="flex flex-wrap gap-1.5 md:ml-auto">
                <Badge tone="amber">◷ {lesson.minutes} {UI.minutes}</Badge>
                <Badge tone="lilac">☰ {N} {UI.steps}</Badge>
              </div>
            </div>
            <p className="mt-1 text-[13.5px] text-muted">{lesson.subtitle}</p>
          </header>

          <section className="card relative flex h-[min(62vh,520px)] shrink-0 max-md:order-2 flex-col overflow-hidden md:h-auto md:min-h-[300px] md:flex-1">
            <div className="flex items-start gap-2 px-3 pt-3">
              <Metrics defs={lesson.metrics ?? []} vals={metricVals[i]} prev={i > 0 ? metricVals[i - 1] : undefined} stepKey={i} />
              <div className="ml-auto flex shrink-0 gap-2">
                <button className="btn px-2.5 py-1 font-mono text-[12px] font-semibold" onClick={() => setReplay((n) => n + 1)} title={`${UI.replay} (R)`}>
                  ↻ <span className="hidden sm:inline">{UI.replay}</span>
                </button>
                <button className="btn px-2.5 py-1 font-mono text-[12px] font-semibold" onClick={() => setPaused((p) => !p)} title={`${UI.pause} (${UI.keySpace})`}>
                  {paused ? "▶" : "❚❚"} <span className="hidden sm:inline">{paused ? UI.resume : UI.pause}</span>
                </button>
              </div>
            </div>
            <div className="relative min-h-0 flex-1">
              <Stage
                scene={step.scene}
                stepKey={i}
                prev={i > 0 ? lesson.steps[i - 1].scene : undefined}
                replayKey={replay}
                paused={paused}
                instant={instant || noAnim}
                focus={step.focus}
                zoom={step.zoom}
                reserve={reserve}
                label={step.title}
              />
              <div
                ref={cardsRef}
                className={`scrollbar-thin absolute top-1 bottom-3 hidden ${wide ? "w-[min(470px,60%)]" : "w-fit max-w-[min(310px,44%)] min-w-[210px]"} flex-col gap-2 overflow-y-auto p-0.5 md:flex ${side === "left" ? "left-3" : "right-3"} ${cards.length ? "" : "pointer-events-none opacity-0"}`}
              >
                <Cards key={i} cards={cards} />
              </div>
            </div>
            {lesson.legend && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 px-3 pb-2 font-mono text-[11px] text-muted">
                {lesson.legend.map((l, k) => (
                  <span key={k} className={`tone-${l.tone} inline-flex items-center gap-1.5`}>
                    {l.style === "line" || l.style === "dash" ? (
                      <svg width="18" height="6">
                        <line x1="1" y1="3" x2="17" y2="3" stroke="var(--ci)" strokeWidth="2.5" strokeDasharray={l.style === "dash" ? "4 3" : undefined} />
                      </svg>
                    ) : (
                      <span className="inline-block h-2.5 w-2.5 rounded-full border border-[var(--outline)]" style={{ background: "var(--ci)" }} />
                    )}
                    <Rich text={l.text} />
                  </span>
                ))}
              </div>
            )}
          </section>

          {cards.length > 0 && (
            <div className="flex flex-col gap-2 max-md:order-4 md:hidden">
              <Cards key={`m${i}`} cards={cards} />
            </div>
          )}

          <Stepper lesson={lesson} i={i} go={go} />
        </main>

        <aside className="flex w-full shrink-0 flex-col gap-3 max-md:contents md:w-[330px] lg:w-[350px]">
          <section className="card flex min-h-0 flex-col p-4 max-md:order-3 md:flex-1">
            <div className="flex items-center justify-between font-mono text-[11.5px] font-semibold tracking-wider">
              <span className="uppercase">
                {UI.step} {i + 1} / {N}
              </span>
              {kind && <Badge tone={kind.tone}>{kind.label.toUpperCase()}</Badge>}
            </div>
            <div key={i} className="step-in scrollbar-thin mt-2 min-h-0 flex-1 overflow-y-auto pr-1">
              <h2 className="font-mono text-[18px] leading-snug font-bold">
                <Rich text={step.title} />
              </h2>
              <div className="mt-2 space-y-2.5 text-[14px] leading-relaxed">
                {step.body.map((p, k) => (
                  <p key={k}>
                    <Rich text={p} />
                  </p>
                ))}
              </div>
              {step.callout && <CalloutBox c={step.callout} />}
              {step.changes && step.changes.length > 0 && (
                <div className="mt-4">
                  <div className="font-mono text-[11px] font-semibold tracking-wider text-muted uppercase">{UI.changed}</div>
                  <ul className="mt-1.5 space-y-1 font-mono text-[12.5px]">
                    {step.changes.map((c, k) => {
                      const sign = c[0];
                      const tone: Tone = sign === "+" ? "mint" : sign === "−" || sign === "-" ? "rose" : "amber";
                      return (
                        <li key={k} className="flex gap-2">
                          <span className={`tone-${tone} mt-[1px] inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] text-[11px] font-bold`} style={{ background: "var(--c1)", color: "var(--ci)" }}>
                            {sign === "+" || sign === "−" || sign === "-" || sign === "~" ? sign : "·"}
                          </span>
                          <span>
                            <Rich text={c.replace(/^[+~−-]\s*/, "")} />
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
            <div className="mt-3 hidden gap-2 pt-1 md:flex">
              <button className="btn px-3 py-2 font-mono text-[12.5px] font-semibold" onClick={() => go(i - 1)} disabled={i === 0}>
                ← {UI.back}
              </button>
              {nextShort ? (
                <button className="btn btn-primary flex-1 px-3 py-2 text-left font-mono text-[12.5px] font-semibold" onClick={() => go(i + 1)}>
                  {UI.next}: {nextShort} →
                </button>
              ) : next ? (
                <Link href={next.href} className="btn btn-primary flex-1 px-3 py-2 text-left font-mono text-[12.5px] font-semibold">
                  {UI.nextLesson}: {next.title} →
                </Link>
              ) : (
                <Link href="/" className="btn btn-primary flex-1 px-3 py-2 text-left font-mono text-[12.5px] font-semibold">
                  {UI.home} →
                </Link>
              )}
            </div>
            <div className="mt-2 hidden gap-1.5 font-mono text-[10.5px] text-muted md:flex">
              <Kbd>←</Kbd>
              <Kbd>→</Kbd> {UI.keysStep} · <Kbd>R</Kbd> {UI.keysReplay} · <Kbd>{UI.keySpace}</Kbd> {UI.keysPause}
            </div>
          </section>

          <section className="card p-4 max-md:order-6">
            <div className="font-mono text-[11.5px] font-semibold tracking-wider uppercase">{UI.learn}</div>
            <ul className="mt-2 space-y-1.5">
              {lesson.learn.map((l, k) => (
                <li key={k} className="flex gap-2 text-[13px] leading-snug">
                  <button
                    onClick={() => go(l.at)}
                    className={`mt-[1px] inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] text-[10px] ${learnDone(l.at) ? "border-[var(--mint-i)] bg-[var(--mint-1)] text-[var(--mint-i)]" : "border-line"}`}
                    aria-label={UI.goToStep(l.at + 1)}
                  >
                    {learnDone(l.at) ? "✓" : ""}
                  </button>
                  <Rich text={l.text} />
                </li>
              ))}
            </ul>
            {prev && (
              <Link href={prev.href} className="mt-3 block font-mono text-[11.5px] text-muted hover:underline">
                ← {UI.prevLesson}: {prev.title}
              </Link>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`tone-${tone} inline-flex items-center gap-1 rounded-full border-[1.5px] px-2 py-0.5 font-mono text-[11px] font-semibold`} style={{ background: "var(--c1)", borderColor: "var(--ci)", color: "var(--fg)" }}>
      {children}
    </span>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-line bg-panel-2 px-1 py-[1px] font-mono text-[10px]">{children}</kbd>;
}

function CalloutBox({ c }: { c: Callout }) {
  const k = CALLOUTS[c.kind];
  return (
    <div className={`tone-${k.tone} mt-4 flex gap-3 rounded-xl border-[1.5px] p-3`} style={{ background: "color-mix(in srgb, var(--c1) 55%, var(--panel))", borderColor: "color-mix(in srgb, var(--ci) 45%, transparent)" }}>
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-[1.5px] font-mono text-[12px] font-bold" style={{ borderColor: "var(--ci)", color: "var(--ci)" }}>
        {k.icon}
      </span>
      <div>
        <div className="font-mono text-[10.5px] font-bold tracking-wider" style={{ color: "var(--ci)" }}>
          {k.label.toUpperCase()}
        </div>
        <div className="mt-0.5 text-[13.5px] leading-snug">
          <Rich text={c.text} />
        </div>
      </div>
    </div>
  );
}

function Metrics({ defs, vals, prev, stepKey }: { defs: { id: string; label: string; icon?: string }[]; vals: Record<string, string | number | null>; prev?: Record<string, string | number | null>; stepKey: number }) {
  if (!defs.length) return <div />;
  return (
    <div className="scrollbar-thin flex min-w-0 gap-1.5 overflow-x-auto pb-1">
      {defs.map((d) => {
        const v = vals[d.id];
        const changed = prev ? prev[d.id] !== v && v != null : false;
        return (
          <div key={`${d.id}-${changed ? stepKey : "s"}`} className={`min-w-[86px] shrink-0 rounded-lg border-[1.5px] px-2 py-1 ${changed ? "metric-flash border-[var(--mint-i)]" : "border-line"}`}>
            <div className="truncate font-mono text-[9.5px] font-semibold tracking-wider text-muted uppercase">
              {d.icon ? `${d.icon} ` : ""}
              <Rich text={d.label} />
            </div>
            <div className="font-mono text-[14px] font-bold whitespace-nowrap">{v == null ? "—" : <Rich text={String(v)} />}</div>
          </div>
        );
      })}
    </div>
  );
}

function Stepper({ lesson, i, go }: { lesson: Lesson; i: number; go: (n: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(`[data-step="${i}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [i]);
  return (
    <section className="card shrink-0 px-3 pt-2.5 pb-2 max-md:order-5">
      <div className="flex justify-between font-mono text-[11px] font-semibold tracking-wider">
        <span className="uppercase">{UI.inLesson}</span>
        <span className="text-muted">{UI.stepOf(i + 1, lesson.steps.length)}</span>
      </div>
      <div ref={ref} className="scrollbar-thin mt-1.5 flex overflow-x-auto pb-1">
        {lesson.steps.map((s, k) => (
          <button key={k} data-step={k} onClick={() => go(k)} className="group relative flex min-w-[78px] flex-1 flex-col items-center px-0.5 pt-1">
            {k > 0 && <span className={`absolute top-[14px] right-1/2 left-[-50%] h-[2px] ${k <= i ? "bg-[var(--outline)]" : "bg-line"}`} />}
            <span
              className={`relative z-[1] inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border-[1.6px] font-mono text-[11px] font-bold transition ${
                k === i ? "border-[var(--outline)] bg-[var(--mint-1)] ring-[3px] ring-[var(--mint-2)]" : k < i ? "border-[var(--outline)] bg-[var(--mint-1)]" : "border-[var(--outline)] bg-panel"
              }`}
            >
              {k + 1}
            </span>
            <span className={`mt-1 text-center font-mono text-[10.5px] leading-tight ${k === i ? "font-bold" : "text-muted group-hover:text-[var(--fg)]"}`}>
              <Rich text={s.short} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export { lessonHref };
