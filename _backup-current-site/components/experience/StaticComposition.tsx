import { ExperienceGrid } from "@/components/environment/ExperienceGrid";
import { BlockNoise } from "@/components/environment/BlockNoise";
import { CornerRegistrationMarks } from "@/components/environment/CornerRegistrationMarks";
import { CenterDiagram } from "@/components/environment/CenterDiagram";
import { StateLabel } from "@/components/environment/StateLabel";
import {
  TechnicalMarker,
  StatusLogDiagram,
  AllClearDiagram,
  ChannelOpenDiagram,
  SyncOkDiagram,
} from "@/components/environment/TechnicalMarker";

/**
 * The resting composition — the reproduction of loadingempty.png.
 *
 * No video, no canvas. Layer order matches the reference:
 * ground -> block noise -> grid -> radial wash -> markers -> centre.
 *
 * Mounted for the whole session and never unmounted: the boot sequence plays
 * over it and fades away, so handover has nothing to re-layout.
 */
export function StaticComposition({
  resolved = true,
  centre = true,
}: {
  resolved?: boolean;
  /** false once the sculpture has taken over drawing the centre construction */
  centre?: boolean;
}) {
  return (
    <>
      {/* Persistent through every phase — the reference shows the grid, its
          wash and the corner brackets from the first frame. */}
      <BlockNoise />
      <ExperienceGrid />
      <div className="wash-layer" aria-hidden="true" />
      <CornerRegistrationMarks />

      {/* The resting furniture. Absent during the boot in the reference; it
          resolves only once the sequence completes. */}
      <div className="resting" data-resolved={resolved}>
      <StateLabel />

      <TechnicalMarker left={67} top={74} w={155} h={106} label="Status-Log">
        <StatusLogDiagram />
      </TechnicalMarker>

      <TechnicalMarker right={78} top={68} w={117} h={116} label="All-Clear">
        <AllClearDiagram />
      </TechnicalMarker>

      <TechnicalMarker left={85} bottom={109} w={125} h={75} label="CH-Open">
        <ChannelOpenDiagram />
      </TechnicalMarker>

      <TechnicalMarker right={90} bottom={93} w={179} h={96} label="Sync-OK">
        <SyncOkDiagram />
      </TechnicalMarker>

      {centre ? <CenterDiagram /> : null}
      </div>
    </>
  );
}
