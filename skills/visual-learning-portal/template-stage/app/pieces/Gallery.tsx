"use client";

import Stage from "@/components/stage/Stage";
import type { Scene } from "@/lib/stage/types";

export default function Gallery({ items }: { items: { title: string; note: string; scene: Scene }[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((it, i) => (
        <section key={i} className="card overflow-hidden">
          <div className="border-b border-line px-4 py-2">
            <div className="font-mono text-[13px] font-bold">{it.title}</div>
            <div className="font-mono text-[11.5px] text-muted">{it.note}</div>
          </div>
          <div className="h-[300px]">
            <Stage scene={it.scene} stepKey={0} label={it.title} />
          </div>
        </section>
      ))}
    </div>
  );
}
