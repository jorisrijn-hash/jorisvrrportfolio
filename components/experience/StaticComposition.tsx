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
 * CHECKPOINT 1 — the static reproduction of loadingempty.png.
 *
 * No animation, no video, no canvas. Layer order matches the reference:
 * ground -> block noise -> grid -> radial wash -> markers -> centre.
 */
export function StaticComposition() {
  return (
    <div className="experience" data-state="loading">
      <BlockNoise />
      <ExperienceGrid />
      <div className="wash-layer" aria-hidden="true" />
      <CornerRegistrationMarks />
      <StateLabel />

      <TechnicalMarker x={67} y={74} w={155} h={106} label="Status-Log">
        <StatusLogDiagram />
      </TechnicalMarker>

      <TechnicalMarker x={1709} y={68} w={117} h={116} label="All-Clear">
        <AllClearDiagram />
      </TechnicalMarker>

      <TechnicalMarker x={85} y={762} w={125} h={75} label="CH-Open">
        <ChannelOpenDiagram />
      </TechnicalMarker>

      <TechnicalMarker x={1635} y={757} w={179} h={96} label="Sync-OK">
        <SyncOkDiagram />
      </TechnicalMarker>

      <CenterDiagram />
    </div>
  );
}
