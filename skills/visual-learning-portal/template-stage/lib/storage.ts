import { site } from "./site";

export const THEME_KEY = `${site.storagePrefix}:theme`;
/** Event fired when the progress changes (the course nav and the home page listen to it). */
export const PROGRESS_EVENT = `${site.storagePrefix}-progress`;
export const seenKey = (chapter: string, lesson: string) => `${site.storagePrefix}:seen:${chapter}/${lesson}`;

/** Furthest step seen in a lesson (−1 = never opened). */
export function readSeen(chapter: string, lesson: string): number {
  try {
    const v = localStorage.getItem(seenKey(chapter, lesson));
    return v == null ? -1 : Number(v);
  } catch {
    return -1;
  }
}

export function writeSeen(chapter: string, lesson: string, step: number) {
  try {
    if (readSeen(chapter, lesson) < step) localStorage.setItem(seenKey(chapter, lesson), String(step));
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  } catch {}
}
