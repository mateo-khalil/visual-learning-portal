"use client";

import { useEffect, useState } from "react";
import Stage from "@/components/stage/Stage";
import type { Scene } from "@/lib/stage/types";

/** Home-page stage: cycles through the scenes every few seconds, using the framework's transition. */
export default function HeroStage({ scenes }: { scenes: { label: string; scene: Scene }[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((n) => (n + 1) % scenes.length), 4200);
    return () => clearInterval(t);
  }, [paused, scenes.length]);
  return (
    <div className="card relative h-[340px] overflow-hidden md:h-[420px]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <Stage scene={scenes[i].scene} stepKey={i} label={scenes[i].label} />
      <div className="absolute bottom-3 left-3 flex gap-1.5">
        {scenes.map((s, k) => (
          <button
            key={k}
            onClick={() => setI(k)}
            className={`rounded-full border-[1.5px] px-2.5 py-0.5 font-mono text-[11px] font-semibold ${k === i ? "border-[var(--outline)] bg-[var(--amber-1)] text-[var(--fg)]" : "border-line bg-panel text-muted"}`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
