import { BSEARCH_PRESETS } from "../example/binarySearch";
import { HANDSHAKE_PRESETS } from "../example/handshake";

/**
 * Kinds of `[[vis:<kind>:<preset>[:mode]]]` for the example area, generated from the
 * engines' presets (never typed by hand: a renamed preset breaks verify, not the page).
 * Modes: `bsearch:<p>:sheet[:n]` (frozen, no controls) and `handshake:<p>:solo` (no tabs).
 */
export const KINDS_EXAMPLE: Record<string, readonly string[]> = {
  bsearch: [...BSEARCH_PRESETS],
  handshake: [...HANDSHAKE_PRESETS],
};
