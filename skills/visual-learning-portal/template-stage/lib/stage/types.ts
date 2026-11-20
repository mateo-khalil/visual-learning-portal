/*
 * Stage: step-by-step lessons on an isometric stage.
 *
 * A lesson is a list of steps. Each step DECLARES its full scene (entities, wires and flows)
 * and the stage animates the difference from the previous step: what leaves sinks and fades
 * out, what stays moves, what enters drops into place, and the camera reframes.
 * Scenes are serializable data (JSON): they are built on the server with pure functions and
 * reach the client already resolved. No state hidden in the components.
 *
 * Coordinates: isometric grid. +x goes down-right, +y goes down-left, +z goes up.
 * One grid unit = U px before the camera (see iso.ts).
 */

/** Named tones; the actual colors come from CSS variables (light and dark theme). */
export type Tone =
  | "paper"
  | "ink"
  | "amber"
  | "sky"
  | "mint"
  | "lilac"
  | "rose"
  | "coral"
  | "lime"
  | "slate"
  | "red"
  | "green";

export type V2 = [number, number];
export type V3 = [number, number, number];

/** A wire point: grid coordinates or an entity anchor "id.anchor" (e.g. "pic.RB0"). */
export type LinkPoint = V2 | V3 | string;

export type PillSide = "top" | "bottom" | "left" | "right";

export interface Pill {
  text: string;
  side?: PillSide;
  tone?: Tone;
  /** Short icon (one character or emoji) before the text. */
  icon?: string;
}

/**
 * Stage entity. `type` picks the kit renderer (box, cyl, chip, seg7…). Numeric fields are
 * interpolated between steps; the rest switch instantly (and color via a CSS transition).
 */
export interface Entity {
  type: string;
  /** Minimum corner on the grid. */
  x: number;
  y: number;
  z?: number;
  /** Size in grid units (each type has its own defaults). */
  w?: number;
  d?: number;
  h?: number;
  tone?: Tone;
  /** Upright text above the entity (scales with the camera). May span several lines. */
  text?: string | string[];
  /** Pill-shaped labels with a fixed on-screen size. */
  pills?: Pill[];
  /** Dimmed (not the focus of the step). */
  dim?: boolean;
  /** Highlighted (halo). */
  glow?: boolean;
  /** Extra elevation, to "lift" something and point it out. */
  lift?: number;
  /** Layer: floor (boards, roads, tiles) is always drawn first. */
  layer?: "floor" | "main";
  /** Type-specific properties (value, on, segs, names, angle…). */
  [k: string]: unknown;
}

export interface Link {
  /** Path on the grid; consecutive points are joined by straight segments. */
  pts: LinkPoint[];
  tone?: Tone;
  style?: "solid" | "dashed" | "dotted";
  /** Stroke width in screen px (default 2). */
  width?: number;
  heads?: "end" | "start" | "both" | "none";
  label?: string;
  /** Where the label sits, from 0 to 1 along the path. */
  labelAt?: number;
  /** Logic level: 1 = on (in the tone's color), 0 = gray. No level: plain ink. */
  level?: 0 | 1;
  /** n-line bus: thick stroke with the "/n" mark. */
  bus?: number;
  dim?: boolean;
  /** Height (z) of the points given as [x, y] (0 = the floor). */
  z?: number;
  /** Draw on top of the entities (diagram arrows over discs, etc.). */
  over?: boolean;
}

/** Packets that travel along a wire, in a loop. */
export interface Flow {
  link: string;
  tone?: Tone;
  /** How many packets at once (default 1). */
  n?: number;
  /** Seconds a packet takes to travel the wire (default 1.6). */
  dur?: number;
  /** Reversed (from the end to the start). */
  back?: boolean;
  /** Text that travels with the packet (e.g. "0x77"). */
  label?: string;
  /** A single pass that stops at the end (instead of looping). */
  once?: boolean;
}

export interface Scene {
  entities: Record<string, Entity>;
  links?: Record<string, Link>;
  flows?: Flow[];
}

/** HTML cards over the stage: code, tables, calculations, waveforms. wide = wider column. */
export type Card = { wide?: boolean } & (
  | { kind: "code"; id: string; title?: string; lines: string[]; first?: number; hl?: number[]; dim?: number[] }
  | { kind: "kv"; id: string; title?: string; rows: [string, string, Tone?][] }
  | { kind: "table"; id: string; title?: string; head: string[]; rows: string[][]; hl?: number[]; hlCols?: number[] }
  | { kind: "text"; id: string; title?: string; text: string; tone?: Tone }
  | { kind: "calc"; id: string; title?: string; lines: string[]; result?: string }
  | {
      kind: "wave";
      id: string;
      title?: string;
      /** One row per signal; each value is an equal-width segment. Text = bus with a value. */
      rows: { name: string; v: (0 | 1 | string | null)[]; tone?: Tone }[];
      /** Index of the marked segment (cursor). */
      at?: number;
      ticks?: string[];
    }
  | { kind: "bits"; id: string; title?: string; name: string; value: number; names?: string[]; hl?: number[]; n?: number });

export interface MetricDef {
  id: string;
  label: string;
  icon?: string;
}

export type { StepKind, CalloutKind } from "../ui";
import type { StepKind, CalloutKind } from "../ui";

export interface Callout {
  kind: CalloutKind;
  text: string;
}

export interface Step {
  /** Short label for the step in the step bar (≤ 14 characters). */
  short: string;
  kind?: StepKind;
  title: string;
  /** Short paragraphs (rich text: **bold**, `code`, S̅₁ with an overbar). */
  body: string[];
  callout?: Callout;
  /** "What changed": lines starting with +, ~ or −. */
  changes?: string[];
  scene: Scene;
  cards?: Card[];
  /** Which side of the stage the cards go on (right by default). */
  cardsAt?: "right" | "left";
  /** Metric values; anything not named carries over from the previous step; null = "—". */
  metrics?: Record<string, string | number | null>;
  /** Framing: ids the camera zooms in on (default: everything). */
  focus?: string[];
  /** Extra zoom factor (1 = tight fit). */
  zoom?: number;
}

export interface LegendItem {
  tone: Tone;
  text: string;
  style?: "dot" | "line" | "dash";
}

export interface Lesson {
  /** Lesson slug within its chapter. */
  id: string;
  title: string;
  subtitle: string;
  minutes: number;
  /** What the lesson teaches; `at` = the step (0-based) from which an item counts as seen. */
  learn: { text: string; at: number }[];
  metrics?: MetricDef[];
  legend?: LegendItem[];
  steps: Step[];
}

export interface Chapter {
  /** Chapter slug (lab2, sampling, refresh). */
  id: string;
  title: string;
  short: string;
  tone: Tone;
  blurb: string;
  lessons: Lesson[];
}
