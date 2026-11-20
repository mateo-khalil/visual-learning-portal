/*
 * Minimal rich text for step paragraphs:
 *   **bold** · `code` · [text](/path) · S̅₁ (letter + U+0305) is drawn with an overbar.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { splitOverline } from "./prims";

function overline(text: string, key: string): ReactNode[] {
  return splitOverline(text).map((p, i) =>
    p.ovl ? (
      <span key={`${key}-${i}`} className="ovl">
        {p.t}
      </span>
    ) : (
      <span key={`${key}-${i}`}>{p.t}</span>
    ),
  );
}

const TOKEN = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

export function rich(text: string, keyBase = "r"): ReactNode[] {
  const out: ReactNode[] = [];
  text.split(TOKEN).forEach((part, i) => {
    if (!part) return;
    const key = `${keyBase}${i}`;
    if (part.startsWith("**") && part.endsWith("**")) out.push(<strong key={key}>{overline(part.slice(2, -2), key)}</strong>);
    else if (part.startsWith("`") && part.endsWith("`")) out.push(<code key={key}>{part.slice(1, -1)}</code>);
    else if (part.startsWith("[")) {
      const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
      if (m)
        out.push(
          m[2].startsWith("/") ? (
            <Link key={key} href={m[2]} className="underline decoration-accent decoration-2 underline-offset-2">
              {overline(m[1], key)}
            </Link>
          ) : (
            <a key={key} href={m[2]} target="_blank" rel="noreferrer" className="underline decoration-accent decoration-2 underline-offset-2">
              {overline(m[1], key)}
            </a>
          ),
        );
    } else out.push(...overline(part, key));
  });
  return out;
}

export default function Rich({ text, className }: { text: string; className?: string }) {
  return <span className={`rich ${className ?? ""}`}>{rich(text)}</span>;
}
