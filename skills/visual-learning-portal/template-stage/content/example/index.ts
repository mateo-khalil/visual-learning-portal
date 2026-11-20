import type { Chapter } from "@/lib/stage/types";
import { handshake } from "./handshake";
import { search } from "./search";

export const EXAMPLE: Chapter = {
  id: "example",
  title: "Example · Algorithms and networks",
  short: "Example",
  tone: "sky",
  blurb: "Two lessons that use every pattern: an engine-driven scene, moving pointers, packets on wires and a lost segment.",
  lessons: [search, handshake],
};
