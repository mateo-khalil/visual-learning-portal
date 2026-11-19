import Markdown from "./Markdown";
import Vis from "./visuals/Vis";
import Diagram from "./diagrams/Diagram";
import { splitParts } from "@/lib/markerSplit";

/**
 * Renders markdown that may embed visuals with `[[vis:<key>]]` and diagrams written
 * as ```steps / ```flow / ```sequence / ```tree / ```gantt / ```queues blocks. Used
 * by topics, guides, question banks and exams.
 */

/** Figures and frozen snapshots (`fig:…`, `…:sheet`) are labelled as diagrams, not as interactive. */
function isFrozen(key: string) {
  const segs = key.split(":");
  return segs[0] === "fig" || segs.includes("sheet");
}

export default function VisContent({ children }: { children: string }) {
  return (
    <>
      {splitParts(children).map((part, i) =>
        part.type === "md" ? (
          <Markdown key={i}>{part.body}</Markdown>
        ) : part.type === "dia" ? (
          <div key={i} className="my-6 rounded-2xl border border-border bg-card/40 p-3.5 sm:p-5">
            <Diagram lang={part.lang} body={part.body} />
          </div>
        ) : (
          <div key={i} className="my-8 rounded-2xl border border-border bg-card/40 p-4 sm:p-5">
            {isFrozen(part.key) ? (
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">📐 Diagram</p>
            ) : (
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent">Interactive · try it ▶</p>
            )}
            <Vis vkey={part.key} />
          </div>
        ),
      )}
    </>
  );
}
