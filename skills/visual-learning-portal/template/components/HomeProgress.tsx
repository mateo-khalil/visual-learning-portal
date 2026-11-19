"use client";

import { visibleNav as nav } from "@/lib/site";
import { useProgress } from "@/lib/progress";

/** Home progress bar: topics, guides and question banks marked as studied. */
export default function HomeProgress() {
  const { map } = useProgress();
  const hrefs = nav
    .flatMap((s) => s.items)
    .map((i) => i.href)
    .filter((h) => /^\/(topics|guides|questions)\//.test(h));
  const done = hrefs.filter((h) => map[h]).length;
  const pct = hrefs.length ? Math.round((done / hrefs.length) * 100) : 0;
  return (
    <div className="mt-5 max-w-md">
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>Your progress (topics, guides and banks marked as studied)</span>
        <span className="tabular-nums">
          {done}/{hrefs.length}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/10">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
