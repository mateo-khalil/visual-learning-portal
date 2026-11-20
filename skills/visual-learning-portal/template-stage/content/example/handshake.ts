/*
 * Example lesson 2: the TCP three-way handshake, with packets travelling on the wires (flows)
 * and a lost segment. Every step is one event of the engine (lib/example/handshake.ts).
 */
import { pill } from "@/lib/stage/build";
import type { Entity, Flow, Lesson, Link, Scene, Step } from "@/lib/stage/types";
import { ISN_CLIENT, ISN_SERVER, TRACES, type HandshakeEvent } from "@/lib/example/handshake";

const H = 0.7;

/** Client and server on a desk, two wires (one per direction), and the packet of the event. */
export function world(ev: HandshakeEvent | null): Scene {
  const e: Record<string, Entity> = {
    desk: { type: "slab", x: -1, y: -1.4, w: 14, d: 5.2, h: 0.15, tone: "paper" },
    client: { type: "box", x: 0, y: 0, z: 0.15, w: 2.6, d: 2.2, h: 1.3, tone: "sky", text: "Client", pills: ev ? [pill(ev.client, "top", ev.client === "ESTABLISHED" ? "mint" : "sky")] : undefined },
    server: { type: "box", x: 9.4, y: 0, z: 0.15, w: 2.6, d: 2.2, h: 1.3, tone: "lilac", text: "Server", pills: ev ? [pill(ev.server, "top", ev.server === "ESTABLISHED" ? "mint" : "lilac")] : undefined },
  };
  const links: Record<string, Link> = {
    up: { pts: [[2.6, 0.6, H], [9.4, 0.6, H]], tone: "sky", over: true },
    down: { pts: [[9.4, 1.6, H], [2.6, 1.6, H]], tone: "lilac", over: true },
  };
  const flows: Flow[] = [];
  if (ev?.kind === "segment") {
    const label = `${ev.flags} seq=${ev.seq}${ev.ack ? ` ack=${ev.ack}` : ""}`;
    flows.push({ link: ev.from === "client" ? "up" : "down", label, tone: ev.lost ? "rose" : ev.from === "client" ? "sky" : "lilac", dur: 2.4, once: ev.lost });
    if (ev.lost) e.lost = { type: "label", x: 6, y: 2.6, z: H, pills: [pill("lost on the way", "bottom", "rose", "✗")] };
  }
  if (ev?.kind === "timeout") e.timer = { type: "tank", x: 10.2, y: 2.8, z: 0.15, w: 1, d: 1, h: 1.4, fill: 1, tone: "rose", pills: [pill("RTO = 1 s", "right", "rose")] };
  return { entities: e, links, flows };
}

function describe(ev: HandshakeEvent): string {
  if (ev.kind === "start") return "Both ends are ready: the server is listening.";
  if (ev.kind === "timeout") return "No ACK arrived before the retransmission timer expired: the server sends the SYN-ACK again.";
  if (ev.lost) return `The ${ev.flags} is lost: nothing reaches the other end, so nobody changes state.`;
  return `${ev.from === "client" ? "The client" : "The server"} sends **${ev.flags}**${ev.ack ? `, acknowledging ${ev.ack - 1} + 1` : ""}.`;
}

const steps = (preset: keyof typeof TRACES, start: number): Step[] =>
  TRACES[preset].slice(start).map((ev) => ({
    short: ev.kind === "timeout" ? "Timeout" : ev.kind === "start" ? "Ready" : `${ev.lost ? "✗ " : ""}${ev.flags}`,
    kind: ev.lost || ev.kind === "timeout" ? "test" : "technique",
    title: ev.kind === "segment" ? `${ev.flags} at t = ${ev.t} ms` : ev.kind === "timeout" ? `Timeout at t = ${ev.t} ms` : "Before connect()",
    body: [describe(ev), `Client: **${ev.client}** · server: **${ev.server}**.`],
    scene: world(ev),
    metrics: { t: `${ev.t} ms`, client: ev.client, server: ev.server },
  }));

export const handshake: Lesson = {
  id: "tcp-handshake",
  title: "The TCP handshake",
  subtitle: "Three segments open a connection; a lost one costs a full timeout.",
  minutes: 4,
  metrics: [
    { id: "t", label: "t" },
    { id: "client", label: "Client" },
    { id: "server", label: "Server" },
  ],
  legend: [
    { tone: "sky", text: "client to server", style: "line" },
    { tone: "lilac", text: "server to client", style: "line" },
    { tone: "rose", text: "lost / timer" },
  ],
  learn: [
    { text: "SYN, SYN-ACK, ACK and the **sequence numbers**", at: 3 },
    { text: "The **states** of both ends", at: 3 },
    { text: "What a **lost SYN-ACK** costs", at: 6 },
  ],
  steps: [
    ...steps("normal", 0),
    {
      short: "Numbers",
      kind: "idea",
      title: "Each side picks its own sequence number",
      body: [`Client ISN = ${ISN_CLIENT}, server ISN = ${ISN_SERVER}. Each ACK is **the number of the other side + 1**: the SYN counts as one byte.`],
      scene: world(TRACES.normal[TRACES.normal.length - 1]),
      cards: [
        {
          kind: "kv",
          id: "isn",
          title: "Sequence numbers",
          rows: [
            ["client ISN", String(ISN_CLIENT)],
            ["server ISN", String(ISN_SERVER)],
            ["SYN-ACK ack", String(ISN_CLIENT + 1), "sky"],
            ["ACK ack", String(ISN_SERVER + 1), "lilac"],
          ],
        },
      ],
    },
    ...steps("lost-syn-ack", 2),
    {
      short: "Exam",
      kind: "exam",
      title: "What to draw",
      body: ["Two vertical timelines, one arrow per segment with its flags, seq and ack, and the state of each side after every arrow."],
      callout: { kind: "say", text: "“A lost SYN-ACK costs one RTO: the connection opens about a second later.”" },
      scene: world(TRACES["lost-syn-ack"][TRACES["lost-syn-ack"].length - 1]),
    },
  ],
};
