import fs from "fs";
import path from "path";
import { applyMode } from "./mode";

const contentDir = path.join(process.cwd(), "content");

/** The content folders, one route each: /topics/<slug>, /guides/<slug>… */
export const CONTENT_DIRS = ["topics", "guides", "questions", "exams"] as const;
export type ContentDir = (typeof CONTENT_DIRS)[number];

export function readContent(...segments: string[]): string {
  return applyMode(fs.readFileSync(path.join(contentDir, ...segments), "utf-8"));
}

export function listContent(dir: ContentDir): string[] {
  const full = path.join(contentDir, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

/** The first "# Title" of a markdown file, or the slug as a fallback. */
export function contentTitle(dir: ContentDir, slug: string): string {
  try {
    const md = readContent(dir, `${slug}.md`);
    const m = md.match(/^#\s+(.+)$/m);
    return m ? m[1].trim() : slug;
  } catch {
    return slug;
  }
}
