"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Step-by-step player: the step title (mono) + narration, and below it
 * "← Previous · dots · Next →". Dots are clickable; with many steps they become a
 * progress bar. Shortcuts: ← / → and space (only the first player visible on screen
 * listens; it shares the `data-stepplayer` attribute with StepPlayer).
 *
 * It is controlled: the parent owns `step` (usually `useState(0)`) and passes the
 * snapshot for that step to its drawing. `total` is the number of snapshots.
 */
export default function Player({
  step,
  total,
  setStep,
  title,
  desc,
  intervalMs = 1600,
}: {
  step: number;
  total: number;
  setStep: (n: number) => void;
  title?: ReactNode;
  desc?: ReactNode;
  intervalMs?: number;
}) {
  const [playing, setPlaying] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const atEnd = step >= total - 1;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const cur = stepRef.current;
      if (cur >= total - 1) {
        setPlaying(false);
        return;
      }
      setStep(cur + 1);
    }, intervalMs);
    return () => clearInterval(id);
  }, [playing, total, intervalMs, setStep]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      const el = rootRef.current;
      if (!el) return;
      const visible = (p: Element) => {
        const b = p.getBoundingClientRect();
        return b.bottom >= 0 && b.top <= window.innerHeight;
      };
      const first = Array.from(document.querySelectorAll("[data-stepplayer]")).find(visible);
      if (first !== el) return;
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

  const navBtn =
    "inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium transition enabled:hover:border-accent disabled:opacity-35 sm:px-4";
  const smallBtn =
    "rounded-lg px-2 py-1 text-xs font-medium text-muted transition hover:bg-foreground/5 hover:text-foreground disabled:opacity-35";

  return (
    <div ref={rootRef} data-stepplayer className="space-y-4">
      {(title || desc) && (
        <div className="min-h-[4.5rem] px-1">
          {title && (
            <p className="font-mono text-base font-semibold sm:text-lg">
              {title}
            </p>
          )}
          {desc && (
            <div className="mt-1 text-[15px] leading-relaxed text-foreground/80">
              {desc}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          className={navBtn}
          onClick={() => {
            setPlaying(false);
            setStep(Math.max(0, step - 1));
          }}
          disabled={step === 0}
        >
          ← Previous
        </button>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          {total <= 16 ? (
            <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5">
              {Array.from({ length: total }, (_, i) => (
                <button
                  key={i}
                  aria-label={`Step ${i + 1}`}
                  onClick={() => {
                    setPlaying(false);
                    setStep(i);
                  }}
                  className={`h-2.5 w-2.5 rounded-full transition ${
                    i === step
                      ? "scale-110 bg-foreground"
                      : i < step
                        ? "bg-foreground/40"
                        : "bg-foreground/15 hover:bg-foreground/30"
                  }`}
                />
              ))}
            </div>
          ) : (
            <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-foreground/10">
              <div
                className="h-full rounded-full bg-accent transition-all duration-200"
                style={{ width: `${(step / (total - 1)) * 100}%` }}
              />
            </div>
          )}
          <div className="flex items-center gap-1">
            <button
              className={smallBtn}
              onClick={() => {
                setPlaying(false);
                setStep(0);
              }}
              disabled={step === 0}
            >
              ⟲<span className="hidden sm:inline"> start</span>
            </button>
            <button
              className={smallBtn}
              onClick={() => {
                if (atEnd) {
                  setStep(0);
                  setPlaying(true);
                } else setPlaying((p) => !p);
              }}
            >
              {playing ? "⏸" : "▶"}
              <span className="hidden sm:inline">{playing ? " pause" : " auto"}</span>
            </button>
            <span className="text-xs tabular-nums text-muted" title="Shortcuts: ← → and space">
              {step + 1}/{total}
            </span>
          </div>
        </div>

        <button
          className={navBtn}
          onClick={() => {
            setPlaying(false);
            setStep(Math.min(total - 1, step + 1));
          }}
          disabled={atEnd}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
