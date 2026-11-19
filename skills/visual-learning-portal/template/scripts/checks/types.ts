/** `check(name, condition, detail)`: counts a failure when the condition is false. */
export type Check = (name: string, cond: boolean, detail?: string) => void;
