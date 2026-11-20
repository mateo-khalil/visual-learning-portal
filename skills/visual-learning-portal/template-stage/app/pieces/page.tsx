/*
 * Catalog of stage pieces: every entity type with its properties, for picking one and for
 * checking the drawing in both themes. Not linked from the navigation.
 */
import TopBar from "@/components/shell/TopBar";
import { pill } from "@/lib/stage/build";
import type { Scene } from "@/lib/stage/types";
import Gallery from "./Gallery";

const items: { title: string; note: string; scene: Scene }[] = [
  {
    title: "box · cyl · tank · label",
    note: "box {w,d,h,tone,text,faces} · cyl {w=diameter} · tank {fill 0..1, marks} · label {text}",
    scene: {
      entities: {
        a: { type: "box", x: 0, y: 0, w: 2.4, d: 2, h: 1.2, tone: "sky", text: ["Timer 0", "TMR0"], pills: [pill("box", "top")] },
        b: { type: "cyl", x: 3.4, y: 0, w: 2, d: 2, h: 0.8, tone: "lilac", text: "cyl", glow: true },
        t: { type: "tank", x: 6.6, y: 0.2, w: 1.6, d: 1.6, h: 3, fill: 0.6, tone: "mint", marks: [{ at: 61 / 256, text: "61" }, { at: 1, text: "256" }], pills: [pill("tank", "top")] },
        l: { type: "label", x: 1, y: 3.6, text: "label: free text", z: 0 },
        f: { type: "box", x: 0, y: 4.8, w: 3, d: 1.4, h: 1, tone: "amber", faces: { left: "left face", right: "right" } },
      },
      links: { ab: { pts: ["a.e", "b.w"], tone: "sky", label: "wire" } },
      flows: [{ link: "ab", tone: "sky" }],
    },
  },
  {
    title: "slab · tile",
    note: "slab {title, style: dashed, lane} · tile {big, small}: tiles (Karnaugh, memory)",
    scene: {
      entities: {
        s: { type: "slab", x: 0, y: 0, w: 6, d: 4, title: "slab with title", tone: "paper" },
        z: { type: "slab", x: 7, y: 0, w: 4, d: 4, style: "dashed", title: "zone", tone: "lilac" },
        t0: { type: "tile", x: 1, y: 1.2, w: 1, d: 1, z: 0.2, big: "1", small: "m5", tone: "amber" },
        t1: { type: "tile", x: 2.1, y: 1.2, w: 1, d: 1, z: 0.2, big: "X", small: "m1", tone: "paper" },
        t2: { type: "tile", x: 3.2, y: 1.2, w: 1, d: 1, z: 0.2, big: "0", small: "m3", tone: "paper" },
      },
    },
  },
  {
    title: "bits · mem",
    note: "bits {value, names (MSB→LSB), hl, n} · mem {rows: addr, name, value, hl}",
    scene: {
      entities: {
        r: { type: "bits", x: 0, y: 0, w: 8, d: 1, value: 0xd6, names: ["RBPU", "INTEDG", "T0CS", "T0SE", "PSA", "PS2", "PS1", "PS0"], hl: [5, 4], pills: [pill("OPTION_REG = 0xD6", "top", "amber")] },
        m: {
          type: "mem",
          x: 0.5,
          y: 2.6,
          w: 5,
          d: 3,
          rows: [
            { addr: "0x20", name: "DIG0", value: "0x77" },
            { addr: "0x21", name: "DIG1", value: "0x38", hl: true },
            { addr: "0x22", name: "DIG2", value: "0x5C" },
          ],
        },
        fsr: { type: "box", x: 8, y: 3.4, w: 1.6, d: 1.2, h: 0.6, tone: "lilac", text: "FSR" },
      },
      links: { p: { pts: ["fsr.w", [7, 4], "m.r1"], tone: "lilac", label: "0x21" } },
    },
  },
  {
    title: "chip · block",
    note: "chip {name, pins: {e,s,w,n}, hiPins, litPins} · block = light-colored chip (flip-flops, modules)",
    scene: {
      entities: {
        pic: { type: "chip", x: 0, y: 0, w: 4, d: 5.6, name: "PIC16F877A", pins: { w: ["RA0", "RA1", "RA2", "RA3", "RC0"], e: ["RB0", "RB1", "RB2", "RB3", "RB4", "RB5", "RB6"] }, hiPins: ["RA0"], litPins: ["RB1", "RB2"] },
        ff: { type: "block", x: 7, y: 1, w: 2, d: 2.4, text: "FF-D", pins: { w: ["D", "CK"], e: ["Q"], s: ["R̅"] }, tone: "sky" },
      },
      links: { w: { pts: ["pic.RB1", [5.6, 2.15], [5.6, 1.8], "ff.D"], level: 1, tone: "amber" }, w2: { pts: ["pic.RB4", [6, 3.35], [6, 3.0], "ff.CK"], level: 0 } },
    },
  },
  {
    title: "seg7 · led · ledbar",
    note: "seg7 {segs: bit0=a…bit6=g, on, level} · led {on, tone} · ledbar {value, names, n}",
    scene: {
      entities: {
        d3: { type: "seg7", x: 0, y: 0, segs: 0x76, on: true },
        d2: { type: "seg7", x: 2, y: 0, segs: 0x5c, on: true, level: 0.5 },
        d1: { type: "seg7", x: 4, y: 0, segs: 0x38, on: false },
        d0: { type: "seg7", x: 6, y: 0, segs: 0x77, on: true, glow: true, tone: "red" },
        l1: { type: "led", x: 0.4, y: 2.4, on: true },
        l2: { type: "led", x: 1.6, y: 2.4, on: false },
        bar: { type: "ledbar", x: 9, y: 0.2, value: 0b01000000, names: ["RB7", "RB6", "RB5", "RB4", "RB3", "RB2", "RB1", "RB0"] },
      },
    },
  },
  {
    title: "pot · switch · gate",
    note: "pot {v 0..1} · switch {on} · gate {kind: and | or | not | nand | nor, inputs}",
    scene: {
      entities: {
        p0: { type: "pot", x: 0, y: 0, v: 0.25, pills: [pill("1.25 V", "top")] },
        p1: { type: "pot", x: 2.4, y: 0, v: 0.75, tone: "amber", pills: [pill("3.75 V", "top")] },
        sw: { type: "switch", x: 5, y: 0.3, on: true, pills: [pill("SELECT = 1", "top")] },
        g1: { type: "gate", x: 0, y: 3, kind: "and", pills: [pill("AND", "bottom")] },
        g2: { type: "gate", x: 2.6, y: 3, kind: "or", pills: [pill("OR", "bottom")] },
        g3: { type: "gate", x: 5.2, y: 3, kind: "not", inputs: 1, pills: [pill("NOT", "bottom")] },
      },
      links: { a: { pts: ["g1.out", "g2.in0"], level: 1, tone: "amber" } },
    },
  },
  {
    title: "car · sensor · lamp · barrier · state",
    note: "car · sensor {on, name} · lamp {on = blinks} · barrier {on = lowered} · state {name, out}",
    scene: {
      entities: {
        road: { type: "slab", x: -1, y: 0, w: 10, d: 3, h: 0.15, tone: "slate", lane: true },
        s: { type: "sensor", x: 1.8, y: 0.2, z: 0.15, w: 0.5, d: 2.6, on: true },
        c: { type: "car", x: 0.5, y: 0.8, z: 0.15, w: 2, d: 1.4, h: 1.25 },
        b: { type: "barrier", x: 4, y: 0.2, z: 0.15, w: 0.5, d: 2.6, h: 1.3, on: true },
        l: { type: "lamp", x: 6, y: -1.1, on: true },
        q: { type: "state", x: 1, y: 4.5, name: "q₃", out: "EN = 1", tone: "amber", glow: true, lift: 0.3 },
        q0: { type: "state", x: 4.5, y: 4.5, name: "q₀", out: "EN = 0" },
      },
      links: { t: { pts: ["q0.w", "q.e"], tone: "mint", label: "0,0" } },
    },
  },
];

export const metadata = { title: "Stage pieces" };

export default function Page() {
  return (
    <div className="min-h-dvh">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="font-mono text-2xl font-bold">Stage pieces</h1>
        <p className="mb-4 text-muted">Every entity type with its properties. Geometry in lib/stage/geom.ts, drawing in components/stage/kits/.</p>
        <Gallery items={items} />
      </main>
    </div>
  );
}
