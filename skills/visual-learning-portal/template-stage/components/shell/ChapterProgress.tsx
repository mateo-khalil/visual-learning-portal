"use client";

import { useEffect, useState } from "react";
import { readSeen } from "@/lib/storage";
import { UI } from "@/lib/ui";

/** "seen / total" for a lesson, read from this browser. */
export default function ChapterProgress({ chapter, lesson, steps }: { chapter: string; lesson: string; steps: number }) {
  const [seen, setSeen] = useState(-1);
  useEffect(() => setSeen(readSeen(chapter, lesson)), [chapter, lesson]);
  const done = seen >= steps - 1;
  if (seen < 0) return <span className="text-muted">
      {steps} {UI.steps}
    </span>;
  return <span className={done ? "font-semibold text-[var(--mint-i)]" : "text-muted"}>{done ? UI.seen : `${seen + 1}/${steps}`}</span>;
}
