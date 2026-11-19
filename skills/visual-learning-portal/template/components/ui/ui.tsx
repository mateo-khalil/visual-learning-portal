"use client";

/** Reusable pills/tabs (scenario pickers, presets, modes). */
export function Pills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
            value === o.id
              ? "border-accent bg-accent/12 text-accent"
              : "border-border bg-card hover:border-accent"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A line-style legend: one swatch (solid or dashed) per item. */
export function Legend({ items }: { items: { color: string; label: string; dashed?: boolean }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-0.5 w-5 rounded"
            style={{
              background: it.dashed
                ? `repeating-linear-gradient(90deg, ${it.color} 0 4px, transparent 4px 7px)`
                : it.color,
            }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}

export function Card({
  title,
  children,
  tone = "default",
}: {
  title?: string;
  children: React.ReactNode;
  tone?: "default" | "good" | "bad";
}) {
  const toneCls =
    tone === "good"
      ? "border-emerald-500/40 bg-emerald-500/5"
      : tone === "bad"
        ? "border-rose-500/40 bg-rose-500/5"
        : "border-border bg-card";
  return (
    <div className={`rounded-xl border p-4 ${toneCls}`}>
      {title && <p className="mb-2 text-sm font-bold">{title}</p>}
      {children}
    </div>
  );
}
