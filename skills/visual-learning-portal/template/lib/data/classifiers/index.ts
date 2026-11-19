import type { Dataset } from "./types";
import { DATASETS_EXAMPLE } from "./example";

export type { Dataset };

/** Every classifier dataset (`[[vis:classify:<id>]]`), one file per area. */
export const DATASETS: Record<string, Dataset> = {
  ...DATASETS_EXAMPLE,
};
