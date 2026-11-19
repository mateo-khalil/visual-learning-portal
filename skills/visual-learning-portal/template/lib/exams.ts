import { readContent, type ContentDir } from "./content";

export type ExamQuestion = {
  title: string;
  prompt: string;
  solution: string;
};

export type Exam = {
  title: string;
  meta: string;
  intro: string;
  questions: ExamQuestion[];
};

/**
 * Markdown shape (used by content/exams and content/questions):
 *   # Title
 *   Meta: ... (optional line after the title)
 *   <intro paragraphs>
 *   ## Question 1 — ...
 *   <prompt>
 *   ### Solution
 *   <solution>
 *   ## Question 2 — ...
 *
 * Every `## ` line starts a new question, so no line inside a fenced block may start
 * with `## ` (scripts/verify.ts checks it).
 */
export function loadExam(slug: string, dir: ContentDir = "exams"): Exam {
  const md = readContent(dir, `${slug}.md`);
  const lines = md.split("\n");

  const title = (lines[0] || "").replace(/^#\s*/, "").trim();

  const rest = lines.slice(1).join("\n");
  const parts = rest.split(/^##\s+/m);

  let head = parts[0];
  let meta = "";
  const metaMatch = head.match(/^\s*meta:\s*(.+)$/im);
  if (metaMatch) {
    meta = metaMatch[1].trim();
    head = head.replace(metaMatch[0], "");
  }
  const intro = head.trim();

  const questions: ExamQuestion[] = parts.slice(1).map((block) => {
    const nl = block.indexOf("\n");
    const qTitle = (nl === -1 ? block : block.slice(0, nl)).trim();
    const body = nl === -1 ? "" : block.slice(nl + 1);
    const [prompt, ...solParts] = body.split(/^###\s+Solution.*$/im);
    return {
      title: qTitle,
      prompt: prompt.trim(),
      solution: solParts.join("\n").trim(),
    };
  });

  return { title, meta, intro, questions };
}
