/*
 * Helpers for building scenes without repetition: a lesson's "world" is built with pure
 * functions and each step combines, dims or highlights it.
 */
import type { Entity, Flow, Link, Pill, PillSide, Scene, Tone } from "./types";

/** Merges scene pieces (later ones override earlier ones). */
export function scene(...parts: (Partial<Scene> | null | undefined | false)[]): Scene {
  const out: Scene = { entities: {}, links: {}, flows: [] };
  for (const p of parts) {
    if (!p) continue;
    Object.assign(out.entities, p.entities ?? {});
    Object.assign(out.links!, p.links ?? {});
    out.flows!.push(...(p.flows ?? []));
  }
  return out;
}

export const pill = (text: string, side: PillSide = "top", tone?: Tone, icon?: string): Pill => ({ text, side, tone, icon });

/** Changes some entities (by id) with a patch or a function. */
export function patch(s: Scene, changes: Record<string, Partial<Entity> | ((e: Entity) => Partial<Entity>)>): Scene {
  const entities: Record<string, Entity> = { ...s.entities };
  for (const [id, ch] of Object.entries(changes)) {
    const e = entities[id];
    if (!e) continue;
    entities[id] = { ...e, ...(typeof ch === "function" ? ch(e) : ch) } as Entity;
  }
  return { ...s, entities };
}

/** Dims everything except the given ids (entities, and the wires that touch them). */
export function focusOn(s: Scene, keep: string[]): Scene {
  const k = new Set(keep);
  const entities: Record<string, Entity> = {};
  for (const [id, e] of Object.entries(s.entities)) entities[id] = k.has(id) ? e : { ...e, dim: true };
  const links: Record<string, Link> = {};
  for (const [id, l] of Object.entries(s.links ?? {})) {
    const touches = k.has(id) || l.pts.some((p) => typeof p === "string" && k.has(p.split(".")[0]));
    links[id] = touches ? l : { ...l, dim: true };
  }
  return { ...s, entities, links, flows: (s.flows ?? []).filter((f) => !links[f.link]?.dim) };
}

/** Removes entities (and the wires and flows that touch them). */
export function without(s: Scene, ids: string[]): Scene {
  const k = new Set(ids);
  const entities = Object.fromEntries(Object.entries(s.entities).filter(([id]) => !k.has(id)));
  const links = Object.fromEntries(Object.entries(s.links ?? {}).filter(([id, l]) => !k.has(id) && !l.pts.some((p) => typeof p === "string" && k.has(p.split(".")[0]))));
  const flows = (s.flows ?? []).filter((f: Flow) => f.link in links);
  return { entities, links, flows };
}

/** Keeps only those entities (and the wires between them). */
export function only(s: Scene, ids: string[]): Scene {
  return without(
    s,
    Object.keys(s.entities).filter((id) => !ids.includes(id)),
  );
}
