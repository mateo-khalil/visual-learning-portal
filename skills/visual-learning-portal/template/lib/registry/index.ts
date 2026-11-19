import { KINDS_EXAMPLE } from "./example";

/**
 * Every kind with presets, merged from one file per area. `fig` and `classify` are
 * validated separately (against FIGS and DATASETS). Add an area: create
 * `lib/registry/<area>.ts` and spread it here.
 */
export const KINDS: Record<string, readonly string[]> = {
  ...KINDS_EXAMPLE,
};
