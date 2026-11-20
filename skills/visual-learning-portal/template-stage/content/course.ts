/*
 * The course: chapters with their lessons. Lessons are data (lib/stage/types.ts) built by pure
 * functions from the area engines (lib/<area>/): no number typed by hand that an engine computes.
 */
import type { NavChapter } from "@/components/shell/nav";
import type { Chapter } from "@/lib/stage/types";
import { EXAMPLE } from "./example";

export const COURSE: Chapter[] = [EXAMPLE].filter((c) => c.lessons.length > 0);

export function findLesson(chapter: string, lesson: string) {
  const c = COURSE.find((x) => x.id === chapter);
  const index = c ? c.lessons.findIndex((l) => l.id === lesson) : -1;
  return c && index >= 0 ? { chapter: c, lesson: c.lessons[index], index } : null;
}

export const navOf = (course: Chapter[]): NavChapter[] =>
  course.map((c) => ({
    id: c.id,
    title: c.title,
    short: c.short,
    tone: c.tone,
    lessons: c.lessons.map((l) => ({ id: l.id, title: l.title, steps: l.steps.length, minutes: l.minutes })),
  }));
