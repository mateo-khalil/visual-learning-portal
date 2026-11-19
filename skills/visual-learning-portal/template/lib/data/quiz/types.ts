// Quiz bank (multiple choice + true/false). Options go WITHOUT the letter: the UI adds
// A, B, C… in the same order. `answer` is the index of the right option (0 = A).

/** One per area of the portal: the quiz filter shows them in this order. */
export const QUIZ_TOPICS = ["Searching", "Complexity", "Networking"] as const;
export type QuizTopic = (typeof QUIZ_TOPICS)[number];
export type QuizKind = "choice" | "tf";

export interface QuizQuestion {
  id: string; // unique, with an area prefix: "bs-01", "net-03"
  topic: QuizTopic;
  kind: QuizKind;
  question: string;
  code?: string; // optional monospaced block (an array, a snippet, console output…)
  options: string[]; // for true/false: TF
  answer: number; // index into options
  explanation: string; // why that one, and why the others are not
  source?: string; // "Sample exam · Q2" | "Slides 4, p. 12"
  debatable?: string; // if the key is ambiguous: which assumption to write down
  link?: string; // internal route to review
  extra?: boolean; // true = beyond the course level: hidden in EXAM_MODE (lib/mode.ts)
}

export const TF = ["True", "False"];
