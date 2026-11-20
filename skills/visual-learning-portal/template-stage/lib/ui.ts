/*
 * Interface strings and the step / callout kinds. This is the only file that changes with the
 * portal's language: the framework (lib/stage, components/stage) has no text of its own.
 * Translate the labels; keep or rename the keys (lessons refer to them).
 */
import type { Tone } from "./stage/types";

/** Step kinds: the badge at the top right of the step panel. */
export const KINDS = {
  problem: { label: "Problem", tone: "rose" },
  idea: { label: "Idea", tone: "lilac" },
  technique: { label: "Technique", tone: "sky" },
  code: { label: "Code", tone: "slate" },
  test: { label: "Test", tone: "mint" },
  exam: { label: "Exam", tone: "amber" },
  summary: { label: "Summary", tone: "lime" },
} as const satisfies Record<string, { label: string; tone: Tone }>;

/** Highlighted boxes in the step panel. */
export const CALLOUTS = {
  idea: { label: "Key idea", icon: "✦", tone: "lilac" },
  say: { label: "Say it like this", icon: "❝", tone: "mint" },
  warning: { label: "Watch out", icon: "!", tone: "rose" },
  source: { label: "From the course", icon: "i", tone: "sky" },
  board: { label: "On the board", icon: "✎", tone: "amber" },
} as const satisfies Record<string, { label: string; icon: string; tone: Tone }>;

export type StepKind = keyof typeof KINDS;
export type CalloutKind = keyof typeof CALLOUTS;

export const UI = {
  step: "Step",
  stepOf: (i: number, n: number) => `Step ${i} of ${n}`,
  lessonOf: (i: number, n: number) => `Lesson ${i} of ${n}`,
  back: "Back",
  next: "Next",
  nextLesson: "Next lesson",
  home: "Back to the course",
  changed: "What changed",
  learn: "You will learn",
  inLesson: "In this lesson",
  replay: "Replay",
  pause: "Pause",
  resume: "Resume",
  keysStep: "step",
  keysReplay: "replay",
  keysPause: "pause",
  keySpace: "Space",
  minutes: "min",
  steps: "steps",
  topics: "Course",
  lessons: "lessons",
  progress: "Progress",
  prevLesson: "Previous lesson",
  menu: "Course",
  theme: "Toggle theme",
  lessonsLink: "Lessons",
  seen: "✓ done",
  goToStep: (n: number) => `Go to step ${n}`,
};
