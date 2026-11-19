"use client";

import type { ReactNode } from "react";
import FlowSim, { type FlowArrow, type FlowGroup, type FlowNode, type FlowScenario, type FlowStep } from "@/components/steps/FlowSim";
import type { Tone } from "@/components/steps/Stage";
import {
  HANDSHAKE_LABELS,
  HANDSHAKE_PRESETS,
  TRACES,
  isHandshakePreset,
  type HandshakeEvent,
  type HandshakePreset,
} from "@/lib/example/handshake";

/**
 * `[[vis:handshake:<normal|lost-syn-ack>[:solo]]]` — the TCP three-way handshake as a
 * data-described FlowSim: a fixed scene (client, network, server) and one scenario
 * per preset. The states and segments come from lib/example/handshake.ts; this file
 * only adds the narration and decides what lights up. `:solo` hides the scenario tabs.
 */

const NODES: FlowNode[] = [
  { id: "client", x: 30, y: 60, w: 220, h: 120, title: "Client", sub: "TCP state" },
  { id: "net", x: 480, y: 60, w: 180, h: 120, title: "Network", sub: "routers, links" },
  { id: "server", x: 890, y: 60, w: 220, h: 120, title: "Server", sub: "TCP state" },
  { id: "capp", x: 30, y: 250, w: 220, h: 96, title: "Client app", sub: "the browser" },
  { id: "timer", x: 470, y: 250, w: 200, h: 96, title: "Retransmit timer", sub: "server side" },
  { id: "sapp", x: 890, y: 250, w: 220, h: 96, title: "Server app", sub: "a web server" },
];

const GROUPS: FlowGroup[] = [
  { id: "chost", x: 12, y: 8, w: 256, h: 356, label: "" },
  { id: "shost", x: 872, y: 8, w: 256, h: 356, label: "" },
];

/** Narration, aligned one-to-one with TRACES[preset]. */
const TEXT: Record<HandshakePreset, { title: string; desc: ReactNode }[]> = {
  normal: [
    {
      title: "Before: the server listens",
      desc: (
        <>
          The server app called <code>listen()</code> + <code>accept()</code>: its socket is in <strong>LISTEN</strong>. The client app calls{" "}
          <code>connect()</code>; nothing has been sent yet.
        </>
      ),
    },
    {
      title: "1 · SYN: “I want to talk; my numbers start at 100”",
      desc: (
        <>
          The client picks its initial sequence number <strong>x = 100</strong> and sends a segment with the <strong>SYN</strong> flag. It moves to{" "}
          <strong>SYN-SENT</strong>; the server, on receiving it, to <strong>SYN-RECEIVED</strong>.
        </>
      ),
    },
    {
      title: "2 · SYN-ACK: “got 100; mine start at 300”",
      desc: (
        <>
          The server answers with both flags: <strong>ACK = 101</strong> (the SYN consumed one number, so it expects byte 101) and its own{" "}
          <strong>SYN, seq = 300</strong>. On receiving it the client is <strong>ESTABLISHED</strong>: it already knows both sides heard each other.
        </>
      ),
    },
    {
      title: "3 · ACK: “got 300”",
      desc: (
        <>
          The client acknowledges the server&apos;s SYN with <strong>ACK = 301</strong>. Now the server is <strong>ESTABLISHED</strong> too and{" "}
          <code>accept()</code> returns. Three segments, one round trip and a half.
        </>
      ),
    },
  ],
  "lost-syn-ack": [
    {
      title: "Before: the server listens",
      desc: (
        <>
          Same start: the server is in <strong>LISTEN</strong> and the client calls <code>connect()</code>.
        </>
      ),
    },
    {
      title: "1 · SYN arrives",
      desc: (
        <>
          The SYN (seq = 100) gets through. The server moves to <strong>SYN-RECEIVED</strong> and, before answering, <strong>starts its
          retransmission timer</strong>: if no ACK comes back in time, it will resend.
        </>
      ),
    },
    {
      title: "2 · The SYN-ACK is lost",
      desc: (
        <>
          A router drops the SYN-ACK. Nobody is told: the client is still in <strong>SYN-SENT</strong>, the server in{" "}
          <strong>SYN-RECEIVED</strong>, and both just wait.
        </>
      ),
    },
    {
      title: "3 · Timeout (1 s)",
      desc: (
        <>
          The server&apos;s timer fires after the RTO (about <strong>1 s</strong> at first; it doubles on each retry). The client&apos;s own SYN
          timer could fire first and resend the SYN instead: the outcome is the same.
        </>
      ),
    },
    {
      title: "4 · SYN-ACK, again",
      desc: (
        <>
          Same segment as before (seq = 300, ack = 101): a retransmission does <strong>not</strong> pick new numbers. This time it arrives and the
          client is <strong>ESTABLISHED</strong>.
        </>
      ),
    },
    {
      title: "5 · ACK: open, one second late",
      desc: (
        <>
          The final ACK (ack = 301) arrives and the server is <strong>ESTABLISHED</strong>. The application never saw an error, only a slower{" "}
          <code>connect()</code>: about 1 s instead of one round trip.
        </>
      ),
    },
  ],
};

function SegmentPanel({ e }: { e: HandshakeEvent }) {
  if (e.kind !== "segment") return null;
  const cells: [string, string][] = [
    ["flags", e.flags ?? ""],
    ["seq", String(e.seq ?? "—")],
    ["ack", e.ack === undefined ? "—" : String(e.ack)],
    ["t", `${e.t} ms`],
  ];
  return (
    <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
      {cells.map(([k, v]) => (
        <span key={k} className="rounded-lg border border-border bg-foreground/[0.03] px-2.5 py-1">
          <span className="text-muted">{k} </span>
          <code className="font-semibold">{v}</code>
        </span>
      ))}
      {e.lost && <span className="rounded-lg border border-rose-500/50 bg-rose-500/10 px-2.5 py-1 font-semibold text-rose-600 dark:text-rose-400">lost in the network</span>}
    </div>
  );
}

function scenario(p: HandshakePreset): FlowScenario {
  const trace = TRACES[p];
  let timerRunning = false;
  const steps: FlowStep[] = trace.map((e, i) => {
    const tones: Record<string, Tone> = {};
    const values: Record<string, string> = { client: e.client, server: e.server };
    const badges: Record<string, string> = {};
    const arrows: FlowArrow[] = [];
    const seg = e.kind === "segment" ? `${e.flags} seq=${e.seq}${e.ack !== undefined ? ` ack=${e.ack}` : ""}` : "";

    if (e.kind === "start") {
      tones.capp = "active";
      tones.sapp = "active";
      values.capp = "connect()";
      values.sapp = "accept() …";
      arrows.push({ from: "capp", to: "client", label: "connect()", tone: "ctrl", mono: true });
    } else if (e.kind === "timeout") {
      tones.timer = "warn";
      tones.server = "active";
      values.timer = "fired: resend";
      arrows.push({ from: "timer", to: "server", label: "timeout", tone: "ctrl" });
      timerRunning = false;
    } else if (e.from === "client") {
      tones.client = "active";
      tones.net = "active";
      tones.server = "active";
      arrows.push({ from: "client", to: "net", label: seg, tone: "req", mono: true });
      arrows.push({ from: "net", to: "server", tone: "req" });
    } else {
      tones.server = "active";
      tones.net = e.lost ? "bad" : "active";
      arrows.push({ from: "server", to: "net", label: seg, tone: e.lost ? "bad" : "res", mono: true });
      if (e.lost) {
        badges.net = "✗";
        values.net = "dropped";
      } else {
        tones.client = "active";
        arrows.push({ from: "net", to: "client", tone: "res" });
      }
    }
    // The timer runs from the moment the server sends its SYN-ACK in the lossy scenario.
    if (p === "lost-syn-ack" && e.kind === "segment" && e.flags === "SYN" && !e.lost) timerRunning = true;
    if (timerRunning && !tones.timer) {
      tones.timer = "info";
      values.timer = "running: 1 s";
    }
    if (p === "normal" && !tones.timer) tones.timer = "dim";
    if (e.client === "ESTABLISHED") tones.client = "ok";
    if (e.server === "ESTABLISHED") {
      tones.server = "ok";
      tones.sapp = "ok";
      values.sapp = "accept() returns";
      arrows.push({ from: "server", to: "sapp", label: "accept()", tone: "res", mono: true });
    }
    return {
      title: TEXT[p][i]?.title ?? `Event ${i}`,
      desc: TEXT[p][i]?.desc ?? "",
      tones,
      values,
      badges,
      arrows,
      groupTones: e.client === "ESTABLISHED" && e.server === "ESTABLISHED" ? { chost: "ok", shost: "ok" } : undefined,
      panel: <SegmentPanel e={e} />,
    };
  });
  return { id: p, label: HANDSHAKE_LABELS[p], steps };
}

const SCENARIOS: FlowScenario[] = HANDSHAKE_PRESETS.map(scenario);

export default function HandshakeSim({ preset }: { preset?: string }) {
  const [first = "normal", mode] = (preset ?? "normal").split(":");
  const initial: HandshakePreset = isHandshakePreset(first) ? first : "normal";
  return <FlowSim key={initial} w={1140} h={372} nodes={NODES} groups={GROUPS} scenarios={SCENARIOS} initial={initial} lockScenario={mode === "solo"} />;
}
