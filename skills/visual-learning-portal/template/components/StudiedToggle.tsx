"use client";

import { usePathname } from "next/navigation";
import { useProgress } from "@/lib/progress";

/** "Mark as studied" button at the bottom of each topic/guide; reflected in the sidebar. */
export default function StudiedToggle() {
  const pathname = usePathname();
  const { map, toggle } = useProgress();
  const done = !!map[pathname];
  return (
    <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-5">
      <button
        onClick={() => toggle(pathname)}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
          done ? "bg-accent text-on-accent" : "border border-accent/50 bg-accent/10 text-accent hover:bg-accent/20"
        }`}
      >
        {done ? "✓ Studied" : "Mark as studied"}
      </button>
      <span className="text-xs text-muted">
        {done ? "It shows with a ✓ in the menu. Tap again to unmark." : "Saved in this browser; you will see it in the menu."}
      </span>
    </div>
  );
}
