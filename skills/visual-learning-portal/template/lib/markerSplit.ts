/**
 * Visuals always live in React (markdown cannot embed components). Topics, guides
 * and exams split their markdown into:
 *
 * - the marker `[[vis:<key>]]` (on its own line), which mounts an interactive visual
 *   or a figure; the key can carry parameters separated by `:`
 *   (`[[vis:bsearch:basic]]`, `[[vis:bsearch:basic:sheet]]`, `[[vis:fig:tcp-states]]`);
 * - a fenced block whose language is a diagram (```steps, ```flow, ```sequence,
 *   ```tree, ```gantt, ```queues), drawn by `components/diagrams`. Any other fenced
 *   block stays a code block.
 */
export type Part =
  | { type: "md"; body: string }
  | { type: "vis"; key: string }
  | { type: "dia"; lang: string; body: string };

export const VIS_MARKER = /^\[\[vis:([\w:,-]+)\]\]$/;
export const DIAGRAM_LANGS = new Set(["steps", "flow", "sequence", "tree", "gantt", "queues"]);
const FENCE_OPEN = /^```(\w+)\s*$/;

export function splitParts(md: string): Part[] {
  const parts: Part[] = [];
  let buffer: string[] = [];
  const flush = () => {
    if (buffer.length) {
      parts.push({ type: "md", body: buffer.join("\n") });
      buffer = [];
    }
  };
  const lines = md.split("\n");
  let fenced = false; // inside an ordinary code block: leave everything as is
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!fenced) {
      const f = line.match(FENCE_OPEN);
      if (f && DIAGRAM_LANGS.has(f[1])) {
        const body: string[] = [];
        i++;
        while (i < lines.length && lines[i].trim() !== "```") body.push(lines[i++]);
        flush();
        parts.push({ type: "dia", lang: f[1], body: body.join("\n") });
        continue;
      }
      const m = line.trim().match(VIS_MARKER);
      if (m) {
        flush();
        parts.push({ type: "vis", key: m[1] });
        continue;
      }
    }
    if (line.trimStart().startsWith("```")) fenced = !fenced;
    buffer.push(line);
  }
  flush();
  return parts;
}
