import { EXAM_MODE } from "./mode";

/**
 * The portal's identity and navigation. Everything that says the portal's name, the
 * `<html lang>`, the localStorage keys and the sidebar comes from here.
 */
export const site = {
  /** Shown in the sidebar and in every <title>. The first word is drawn in the accent color. */
  name: "Visual Portal",
  /** Optional small badge after the name (e.g. "2" for a second-exam portal). Empty = none. */
  badge: "",
  tagline: "Course · exam. Theory with drawings, step-by-step simulators and model answers.",
  description:
    "A visual study portal: every topic explained with diagrams, step-by-step simulators, solved past exams and a quiz.",
  /** `<html lang>`. Use the language the content is written in ("en", "es", "pt-BR"…). */
  locale: "en",
  /** Prefix of every localStorage key (`<prefix>-progress`, `<prefix>-quiz-best`, `<prefix>-theme`). */
  storagePrefix: "visual-portal",
};

/** `extra: true` = beyond the course level: hidden in EXAM_MODE (lib/mode.ts). */
export type NavItem = { title: string; href: string; badge?: string; extra?: boolean };
export type NavSection = { title: string; items: NavItem[]; extra?: boolean };

export const nav: NavSection[] = [
  {
    title: "Start here",
    items: [
      { title: "Home and study plan", href: "/" },
      { title: "The sheet: everything on one page", href: "/guides/summary-sheet", badge: "✎" },
      { title: "Quiz / Mock test", href: "/quiz", badge: "?" },
    ],
  },
  {
    title: "Topics",
    items: [{ title: "Binary search", href: "/topics/binary-search", badge: "★" }],
  },
  {
    title: "Simulators",
    items: [
      { title: "Binary search, step by step", href: "/simulators/binary-search", badge: "▶" },
      { title: "TCP three-way handshake", href: "/simulators/handshake", badge: "▶" },
    ],
  },
  {
    title: "Practice",
    items: [
      { title: "Sample exam", href: "/exams/sample-exam", badge: "★" },
      { title: "Question bank: binary search", href: "/questions/binary-search" },
      { title: "Doing it by hand", href: "/guides/by-hand", badge: "✎" },
    ],
  },
];

/** The navigation that shows: in EXAM_MODE without `extra` sections and entries. */
export const visibleNav: NavSection[] = EXAM_MODE
  ? nav
      .filter((s) => !s.extra)
      .map((s) => ({ ...s, items: s.items.filter((i) => !i.extra) }))
      .filter((s) => s.items.length)
  : nav;
