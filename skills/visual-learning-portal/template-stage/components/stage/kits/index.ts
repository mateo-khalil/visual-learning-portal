/*
 * Registry of renderers by entity type. Each type also has its geometry in
 * lib/stage/geom.ts (size, anchors, interpolatable fields); verify checks that they match.
 * A topic's own pieces: components/stage/kits/<topic>.tsx + lib/stage/areas/<topic>.ts.
 */
import { CORE, type Kit } from "./core";
import { ELECTRONICS } from "./electronics";
import { KITS_EXAMPLE } from "./example";

export const KITS: Record<string, Kit> = { ...CORE, ...ELECTRONICS, ...KITS_EXAMPLE };
export type { Kit, KitProps } from "./core";
