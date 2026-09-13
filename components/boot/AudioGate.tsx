"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useSound } from "@/lib/sound";

/**
 * AUDIO GATE — shown before the boot sequence.
 *
 * This is the honest fix for autoplay policy. A browser will not let a page
 * make sound until it has been interacted with, so a visitor who is never
 * asked either hears nothing or has the score start part-way through. Asking
 * first means the answer IS the gesture: whichever button is pressed unlocks
 * audio, and the sequence then begins with the soundtrack from its first frame.
 *
 * Both options are equal in weight — neither is styled as the "right" one.
 */
export function AudioGate({ onChoose }: { onChoose: (withSound: boolean) => void }) {
  const { setEnabled } = useSound();

  const choose = (withSound: boolean) => {
    setEnabled(withSound);
    onChoose(withSound);
  };

  return (
    <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div className="gate__inner">
        <p className="gate__eyebrow">// Audio·RX</p>
        <h1 id="gate-title" className="gate__title">Output Routing</h1>
        <p className="gate__line">Select channel state to initialize interface</p>
        <p className="gate__line">Scope: SFX · Voice Synth · No ambient loop</p>

        <div className="gate__actions">
          <button type="button" className="gate__btn" onClick={() => choose(true)} autoFocus>
            <Volume2 size={13} strokeWidth={1.5} aria-hidden="true" />
            <span>On</span>
          </button>
          <button type="button" className="gate__btn" onClick={() => choose(false)}>
            <VolumeX size={13} strokeWidth={1.5} aria-hidden="true" />
            <span>Off</span>
          </button>
        </div>
      </div>
    </div>
  );
}
