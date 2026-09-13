"use client";

import { useNow } from "@/lib/clock";

/**
 * The left-hand system readout from the reference. The epoch and timestamp
 * tick — in the source they are live, which is the point of a readout.
 */
export function SystemReadout() {
  const now = useNow();

  const epoch = now === null ? null : Math.floor(now / 1000) * 1000 + 311956;
  const stamp =
    now === null
      ? null
      : (() => {
          const d = new Date(now);
          return `${d.toISOString().slice(0, 10)}T${d.toTimeString().slice(0, 8)}`;
        })();

  return (
    <div className="hud-readout">
      <div>[User]: 0xA4-{platform()}</div>
      <div className="hud-readout__bracket" aria-hidden="true" />
      <div># Module:// Chronod</div>
      <div>Facility=Neural_Node/Chrono_Daemon &middot; PID=4182</div>
      <div suppressHydrationWarning>{epoch ?? " "}</div>
      <div suppressHydrationWarning>{stamp ?? " "}</div>
    </div>
  );
}

function platform(): string {
  if (typeof navigator === "undefined") return "Windows_NT_10_0";
  const p = navigator.platform || "";
  if (/Mac/i.test(p)) return "Darwin_25_6";
  if (/Linux/i.test(p)) return "Linux_6_0";
  return "Windows_NT_10_0";
}
