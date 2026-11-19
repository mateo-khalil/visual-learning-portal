"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Toolbar-style step player (reset · previous · play · next · end · speed) with a
 * progress bar and an optional narration box. Use it for long traces (dozens of
 * steps, e.g. a scheduler tick by tick); for slide-style scenes use steps/Player.
 * Shares the ← / → / space shortcuts with Player through `data-stepplayer`.
 */
interface StepPlayerProps {
  step: number;
  total: number;
  setStep: (n: number) => void;
  /** Narration / description of the current step. */
  desc?: ReactNode;
  /** Autoplay tick in ms (divided by the speed). */
  intervalMs?: number;
}

export default function StepPlayer({
  step,
  total,
  setStep,
  desc,
  intervalMs = 1100,
}: StepPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const rootRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const atEnd = step >= total - 1;

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      const cur = stepRef.current;
      if (cur >= total - 1) {
        setPlaying(false);
        return;
      }
      setStep(cur + 1);
    }, intervalMs / speed);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, total, intervalMs, speed, setStep]);

  // Shortcuts: ← / → change step, space plays/pauses. Only when focus is not in an
  // input and this player is the first one visible on screen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const players = Array.from(document.querySelectorAll("[data-stepplayer]"));
      const firstVisible = players.find((p) => {
        const b = p.getBoundingClientRect();
        return b.bottom >= 0 && b.top <= window.innerHeight;
      });
      if (firstVisible !== el) return;
      const cur = stepRef.current;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setPlaying(false);
        setStep(Math.min(total - 1, cur + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPlaying(false);
        setStep(Math.max(0, cur - 1));
      } else if (e.key === " " && t?.tagName !== "BUTTON") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total, setStep]);

  const btn =
    "inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition enabled:hover:border-accent disabled:opacity-40";

  return (
    <div ref={rootRef} data-stepplayer className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          className={btn}
          onClick={() => {
            setPlaying(false);
            setStep(0);
          }}
          disabled={step === 0}
        >
          ⟲ Reset
        </button>
        <button
          className={btn}
          onClick={() => {
            setPlaying(false);
            setStep(Math.max(0, step - 1));
          }}
          disabled={step === 0}
        >
          ◀ Previous
        </button>
        <button
          className="inline-flex items-center gap-1 rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-on-accent transition hover:opacity-90 disabled:opacity-40"
          onClick={() => {
            if (atEnd) {
              setStep(0);
              setPlaying(true);
            } else {
              setPlaying((p) => !p);
            }
          }}
        >
          {playing ? "⏸ Pause" : atEnd ? "↺ Replay" : "▶ Play"}
        </button>
        <button
          className={btn}
          onClick={() => {
            setPlaying(false);
            setStep(Math.min(total - 1, step + 1));
          }}
          disabled={atEnd}
        >
          Next ▶
        </button>
        <button
          className={btn}
          onClick={() => {
            setPlaying(false);
            setStep(total - 1);
          }}
          disabled={atEnd}
        >
          End ⏭
        </button>
        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="rounded-lg border border-border bg-card px-1.5 py-1.5 text-xs"
          title="Speed"
        >
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={2}>2×</option>
          <option value={4}>4×</option>
        </select>
        <span className="ml-auto text-sm tabular-nums text-muted" title="Shortcuts: ← → and space">
          Step {step + 1} / {total}
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full rounded-full bg-accent transition-all duration-200"
          style={{ width: `${total <= 1 ? 100 : (step / (total - 1)) * 100}%` }}
        />
      </div>

      {desc !== undefined && (
        <div className="rounded-xl border border-border bg-card p-3 text-sm leading-relaxed">
          {desc}
        </div>
      )}
    </div>
  );
}
