"use client";

import type { ReactElement } from "react";
import { Arrow, Box, FigFrame, T, Txt, tint } from "./draw";

/*
 * SVG figures of the example area, drawn with the helpers of ./draw. Used with
 * [[vis:fig:<id>]]. Convention (scripts/verify.ts reads it): the FIGS_EXAMPLE object
 * goes at the END of the file, one entry per line: `  "id": Component,`.
 */

const GREEN = "#16a34a";
const BLUE = "#2563eb";
const ROSE = "#e11d48";

/** 16 → 8 → 4 → 2 → 1: what is left of the array after each comparison. */
function SortedArrayHalving() {
  const n = 16;
  const cell = 34;
  const x0 = 128;
  const rowH = 30;
  const gap = 18;
  const top = 34;
  // Window kept after k comparisons (following a target near index 4).
  const kept: [number, number][] = [
    [0, 16],
    [0, 8],
    [4, 8],
    [4, 6],
    [4, 5],
  ];
  const H = top + kept.length * (rowH + gap) + 30;
  return (
    <FigFrame w={x0 + n * cell + 110} h={H} label="Each comparison keeps half of the array">
      {Array.from({ length: n }, (_, i) => (
        <Txt key={i} x={x0 + i * cell + cell / 2} y={top - 10} size={10.5} color={T.muted} mono>
          {i}
        </Txt>
      ))}
      {kept.map(([a, b], k) => {
        const y = top + k * (rowH + gap);
        return (
          <g key={k}>
            <Txt x={x0 - 14} y={y + rowH / 2 + 4} anchor="end" size={12} weight={700}>
              {k === 0 ? "start" : `after ${k}`}
            </Txt>
            {Array.from({ length: n }, (_, i) => {
              const inside = i >= a && i < b;
              return (
                <rect
                  key={i}
                  x={x0 + i * cell + 2}
                  y={y}
                  width={cell - 4}
                  height={rowH}
                  rx={5}
                  fill={inside ? tint(k === kept.length - 1 ? GREEN : BLUE, 26) : tint(T.muted, 8)}
                  stroke={inside ? (k === kept.length - 1 ? GREEN : BLUE) : T.border}
                  strokeWidth={inside ? 1.4 : 1}
                  opacity={inside ? 1 : 0.55}
                />
              );
            })}
            <Txt x={x0 + n * cell + 14} y={y + rowH / 2 + 4} anchor="start" size={12.5} weight={700} color={k === kept.length - 1 ? GREEN : T.fg}>
              {`${b - a} left`}
            </Txt>
          </g>
        );
      })}
      <Txt x={x0 + (n * cell) / 2} y={H - 10} size={12.5} color={T.muted}>
        16 → 8 → 4 → 2 → 1: four halvings, and log₂ 16 = 4
      </Txt>
    </FigFrame>
  );
}

/** The two state machines of the handshake, side by side. */
function TcpStates() {
  const W = 720;
  const bw = 210;
  const bh = 46;
  const cx = [180, 540];
  const ys = [56, 156, 256];
  const client = ["CLOSED", "SYN-SENT", "ESTABLISHED"];
  const server = ["LISTEN", "SYN-RECEIVED", "ESTABLISHED"];
  const clientEdges = ["connect(): send SYN", "recv SYN-ACK, send ACK"];
  const serverEdges = ["recv SYN, send SYN-ACK", "recv ACK"];
  const col = (states: string[], edges: string[], x: number, c: string) => (
    <g>
      {states.map((s, i) => (
        <Box key={s} x={x - bw / 2} y={ys[i]} w={bw} h={bh} label={s} fill={tint(i === states.length - 1 ? GREEN : c, 18)} stroke={i === states.length - 1 ? GREEN : c} />
      ))}
      {edges.map((e, i) => (
        <g key={e}>
          <Arrow x1={x} y1={ys[i] + bh + 2} x2={x} y2={ys[i + 1] - 4} color={T.muted} />
          <Txt x={x + 12} y={(ys[i] + bh + ys[i + 1]) / 2 + 4} anchor="start" size={11.5} color={T.muted}>
            {e}
          </Txt>
        </g>
      ))}
    </g>
  );
  return (
    <FigFrame w={W} h={330} label="TCP states of client and server during the three-way handshake">
      <Txt x={cx[0]} y={30} size={14} weight={800} color={BLUE}>
        Client
      </Txt>
      <Txt x={cx[1]} y={30} size={14} weight={800} color={ROSE}>
        Server
      </Txt>
      <line x1={W / 2} y1={20} x2={W / 2} y2={310} stroke={T.border} strokeDasharray="4 5" />
      {col(client, clientEdges, cx[0], BLUE)}
      {col(server, serverEdges, cx[1], ROSE)}
    </FigFrame>
  );
}

type Figure = () => ReactElement;

export const FIGS_EXAMPLE: Record<string, Figure> = {
  "sorted-array-halving": SortedArrayHalving,
  "tcp-states": TcpStates,
};
