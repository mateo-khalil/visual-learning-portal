/**
 * EXAM MODE — trims the portal to the level of the course (the slides and the past
 * exams). Material that goes beyond it (textbook depth, proofs, history, variants the
 * course never asks) is not deleted: it is marked and hidden.
 *
 *   true  → hides markdown blocks between `<!-- extra -->` and `<!-- /extra -->`
 *           (each marker on its own line), nav entries/sections with `extra: true`
 *           (lib/site.ts) and quiz questions with `extra: true`.
 *   false → the full portal (markers are ignored, their content shows).
 */
export const EXAM_MODE = true;
const OPEN = /^\s*<!--\s*extra\b[^>]*-->\s*$/;
const CLOSE = /^\s*<!--\s*\/extra\s*-->\s*$/;

/** Removes extra blocks (in exam mode) or only their markers (full portal). */
export function applyMode(md: string, examMode = EXAM_MODE): string {
  const out: string[] = [];
  let depth = 0;
  for (const line of md.split("\n")) {
    if (OPEN.test(line)) {
      depth++;
      continue;
    }
    if (CLOSE.test(line)) {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (examMode && depth > 0) continue;
    out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

/** For scripts/verify.ts: unbalanced markers (1-based line and reason). */
export function brokenMarkers(md: string): string[] {
  const errs: string[] = [];
  const stack: number[] = [];
  md.split("\n").forEach((line, i) => {
    if (OPEN.test(line)) stack.push(i + 1);
    else if (CLOSE.test(line)) {
      if (!stack.length) errs.push(`${i + 1}: <!-- /extra --> without an opening marker`);
      else stack.pop();
    }
  });
  for (const l of stack) errs.push(`${l}: <!-- extra --> is never closed`);
  return errs;
}
