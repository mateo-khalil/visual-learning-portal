/** What each checks file receives: a way to record named results. */
export interface T {
  /** Strict equality (via JSON for objects and arrays). */
  eq(name: string, got: unknown, want: unknown): void;
  /** The condition is true. */
  ok(name: string, cond: boolean, detail?: string): void;
}
