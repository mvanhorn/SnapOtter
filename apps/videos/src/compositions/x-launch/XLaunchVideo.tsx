import type React from "react";
import { AbsoluteFill, Series, staticFile } from "remotion";
import { GrainOverlay } from "@/components/GrainOverlay";
import { BackgroundMusic } from "@/lib/audio";
import { COLOR } from "@/lib/colors";
import { AiShowcaseScene } from "./scenes/AiShowcaseScene";
import { FeatureBurstScene } from "./scenes/FeatureBurstScene";
import { GitHubCTAScene } from "./scenes/GitHubCTAScene";
import { HookScene } from "./scenes/HookScene";
import { PrivacyBeatScene } from "./scenes/PrivacyBeatScene";
import { TerminalInstallScene } from "./scenes/TerminalInstallScene";
import { ToolGridRevealScene } from "./scenes/ToolGridRevealScene";

export const XLaunchVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.dark }}>
      <Series>
        <Series.Sequence durationInFrames={120}>
          <HookScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={150}>
          <TerminalInstallScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <ToolGridRevealScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <AiShowcaseScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={120}>
          <PrivacyBeatScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={150}>
          <FeatureBurstScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={150}>
          <GitHubCTAScene />
        </Series.Sequence>
      </Series>

      <GrainOverlay opacity={0.03} />
      <BackgroundMusic
        src={staticFile("audio/x-launch.mp3")}
        volume={0.4}
        fadeInFrames={30}
        fadeOutFrames={60}
        totalFrames={1050}
      />
    </AbsoluteFill>
  );
};
