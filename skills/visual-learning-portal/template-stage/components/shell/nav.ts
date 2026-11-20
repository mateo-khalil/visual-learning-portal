import type { Tone } from "@/lib/stage/types";

/** The bare minimum of each chapter for navigation (sent to the client without the scenes). */
export interface NavChapter {
  id: string;
  title: string;
  short: string;
  tone: Tone;
  lessons: { id: string; title: string; steps: number; minutes: number }[];
}

export const lessonHref = (chapter: string, lesson: string) => `/${chapter}/${lesson}`;
