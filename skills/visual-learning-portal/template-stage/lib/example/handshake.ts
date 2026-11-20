/*
 * TCP three-way handshake, as data. Each event is one thing that happens on the wire
 * (or a timer firing) and the TCP state of both ends right after it. The simulator
 * (components/example/HandshakeSim.tsx) turns events into FlowSim steps and
 * scripts/checks/example.ts asserts the final states.
 *
 * Numbers: client ISN x = 100, server ISN y = 300. RTO = 1 s (the usual initial value).
 */

export const HANDSHAKE_PRESETS = ["normal", "lost-syn-ack"] as const;
export type HandshakePreset = (typeof HANDSHAKE_PRESETS)[number];
export const isHandshakePreset = (s: string): s is HandshakePreset => (HANDSHAKE_PRESETS as readonly string[]).includes(s);
export const HANDSHAKE_LABELS: Record<HandshakePreset, string> = {
  normal: "Normal",
  "lost-syn-ack": "SYN-ACK lost",
};

export type TcpState = "CLOSED" | "LISTEN" | "SYN-SENT" | "SYN-RECEIVED" | "ESTABLISHED";
export type Flags = "SYN" | "SYN-ACK" | "ACK";

export interface HandshakeEvent {
  /** Time in ms since the client called connect(). */
  t: number;
  kind: "start" | "segment" | "timeout";
  from?: "client" | "server";
  flags?: Flags;
  seq?: number;
  ack?: number;
  /** The segment never reaches the other end. */
  lost?: boolean;
  client: TcpState;
  server: TcpState;
}

export const ISN_CLIENT = 100;
export const ISN_SERVER = 300;

const synSeg = { kind: "segment", from: "client", flags: "SYN", seq: ISN_CLIENT } as const;
const synAck = { kind: "segment", from: "server", flags: "SYN-ACK", seq: ISN_SERVER, ack: ISN_CLIENT + 1 } as const;
const ackSeg = { kind: "segment", from: "client", flags: "ACK", seq: ISN_CLIENT + 1, ack: ISN_SERVER + 1 } as const;

export const TRACES: Record<HandshakePreset, readonly HandshakeEvent[]> = {
  normal: [
    { t: 0, kind: "start", client: "CLOSED", server: "LISTEN" },
    { t: 0, ...synSeg, client: "SYN-SENT", server: "SYN-RECEIVED" },
    { t: 20, ...synAck, client: "ESTABLISHED", server: "SYN-RECEIVED" },
    { t: 40, ...ackSeg, client: "ESTABLISHED", server: "ESTABLISHED" },
  ],
  "lost-syn-ack": [
    { t: 0, kind: "start", client: "CLOSED", server: "LISTEN" },
    { t: 0, ...synSeg, client: "SYN-SENT", server: "SYN-RECEIVED" },
    { t: 20, ...synAck, lost: true, client: "SYN-SENT", server: "SYN-RECEIVED" },
    { t: 1020, kind: "timeout", from: "server", client: "SYN-SENT", server: "SYN-RECEIVED" },
    { t: 1020, ...synAck, client: "ESTABLISHED", server: "SYN-RECEIVED" },
    { t: 1040, ...ackSeg, client: "ESTABLISHED", server: "ESTABLISHED" },
  ],
};

/** Segments that actually crossed the network (lost ones excluded). */
export const delivered = (p: HandshakePreset) => TRACES[p].filter((e) => e.kind === "segment" && !e.lost);
