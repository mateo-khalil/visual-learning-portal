import type { QuizQuestion } from "./types";
import { EXAM_MODE } from "../../mode";
import { QUIZ_EXAMPLE } from "./example";

export { QUIZ_TOPICS, TF, type QuizKind, type QuizQuestion, type QuizTopic } from "./types";

/** The whole bank: one file per area. */
export const allQuestions: QuizQuestion[] = [...QUIZ_EXAMPLE];

/** What the quiz shows: in EXAM_MODE without the ones marked `extra`. */
export const questions: QuizQuestion[] = EXAM_MODE ? allQuestions.filter((q) => !q.extra) : allQuestions;
