"use client";

import type { ReactElement } from "react";
import { FIGS_EXAMPLE } from "./FigsExample";

/**
 * Figure registry (`[[vis:fig:<id>]]`): one file per area, `components/figures/Figs<Area>.tsx`,
 * each ending with its `FIGS_<AREA>` object (one entry per line — scripts/verify.ts reads it).
 */
export const FIGS: Record<string, () => ReactElement> = {
  ...FIGS_EXAMPLE,
};

export default function Fig({ id }: { id: string }) {
  const F = FIGS[id];
  return F ? <F /> : null;
}
