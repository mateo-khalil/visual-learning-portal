"use client";

import Fig from "@/components/figures/Figs";
import Classifier from "@/components/Classifier";
// Example area
import BinarySearchSim from "@/components/example/BinarySearchSim";
import HandshakeSim from "@/components/example/HandshakeSim";

/**
 * Maps a `[[vis:<kind>:<arg>]]` marker to its visual. The whole arg (it may contain
 * more `:`, e.g. `bsearch:basic:sheet`) arrives as `preset` and each component
 * parses it. Valid kinds and presets live in `lib/registry` (verify checks them).
 */
export default function Vis({ vkey }: { vkey: string }) {
  const [kind, ...rest] = vkey.split(":");
  const arg = rest.join(":") || undefined;

  switch (kind) {
    case "fig":
      return <Fig id={arg ?? ""} />;
    case "classify":
      return <Classifier dataset={arg} />;
    case "bsearch":
      return <BinarySearchSim preset={arg} />;
    case "handshake":
      return <HandshakeSim preset={arg} />;
    default:
      return null;
  }
}
