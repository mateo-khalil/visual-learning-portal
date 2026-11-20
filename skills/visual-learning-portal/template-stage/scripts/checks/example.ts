/*
 * Canonical results of the example area: what the lessons show is what the engines compute.
 * One file per area; scripts/verify.ts calls each one.
 */
import { maxProbes, PRESETS, run } from "../../lib/example/binarySearch";
import { delivered, ISN_CLIENT, ISN_SERVER, TRACES } from "../../lib/example/handshake";
import { search } from "../../content/example/search";
import type { T } from "./types";

export default function check(t: T) {
  const steps = run("basic");
  const last = steps[steps.length - 1];
  t.eq("binary search: finds 21 at index 4", last.result, 4);
  t.eq("binary search: 4 comparisons", last.probes, 4);
  t.eq("binary search: worst case for 16 values", maxProbes(PRESETS.basic.array.length), 5);
  // The scene of the last engine step lifts and greens the found cell.
  const finalScene = search.steps[steps.length].scene;
  t.eq("lesson: the found cell is green", finalScene.entities.c4.tone, "mint");

  t.eq("handshake: both ends established", TRACES.normal.at(-1)!.client + "/" + TRACES.normal.at(-1)!.server, "ESTABLISHED/ESTABLISHED");
  t.eq("handshake: 3 segments delivered", delivered("normal").length, 3);
  t.eq("handshake: ACK acknowledges the server ISN + 1", delivered("normal")[2].ack, ISN_SERVER + 1);
  t.eq("handshake: SYN-ACK acknowledges the client ISN + 1", delivered("normal")[1].ack, ISN_CLIENT + 1);
  t.eq("handshake: a lost SYN-ACK costs one RTO", TRACES["lost-syn-ack"].at(-1)!.t - TRACES.normal.at(-1)!.t, 1000);
}
