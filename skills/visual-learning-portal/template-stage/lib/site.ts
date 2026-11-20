/** The portal's identity: name, language, storage prefix and external links. */
export const site = {
  name: "Stage Portal",
  /** Small badge after the name (empty = none). */
  badge: "step by step",
  tagline: "Every mechanism, one change at a time",
  description: "Step-by-step lessons on animated isometric scenes: every idea drawn, then explained.",
  /** `<html lang>`: the language the lessons are written in. */
  locale: "en",
  /** Prefix of the localStorage keys (progress, theme). */
  storagePrefix: "stage-portal",
  /** External links in the top bar (e.g. a classic portal with the quiz and past exams). */
  links: [] as { label: string; href: string }[],
};
