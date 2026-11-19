import { site } from "./site";

/** localStorage keys, all derived from `site.storagePrefix` (one namespace per portal). */
export const PROGRESS_KEY = `${site.storagePrefix}-progress`;
export const QUIZ_BEST_KEY = `${site.storagePrefix}-quiz-best`;
export const THEME_KEY = `${site.storagePrefix}-theme`;
export const PROGRESS_EVENT = `${site.storagePrefix}-progress-change`;
