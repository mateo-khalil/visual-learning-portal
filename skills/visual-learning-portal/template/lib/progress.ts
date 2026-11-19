"use client";

import { useCallback, useSyncExternalStore } from "react";
import { PROGRESS_EVENT as EVENT, PROGRESS_KEY } from "./storage";

/**
 * Study progress ("✓ Studied") in localStorage: one map href → true, with its own
 * event so the sidebar updates instantly.
 */
function read(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
  } catch {
    return {};
  }
}

let cache: { raw: string | null; map: Record<string, boolean> } = { raw: null, map: {} };

function snapshot(): Record<string, boolean> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(PROGRESS_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cache.raw) cache = { raw, map: read() };
  return cache.map;
}

const EMPTY: Record<string, boolean> = {};

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useProgress() {
  const map = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  const toggle = useCallback((href: string) => {
    const cur = read();
    if (cur[href]) delete cur[href];
    else cur[href] = true;
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(cur));
    } catch {
      /* no storage: it just does not persist */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return { map, toggle };
}
