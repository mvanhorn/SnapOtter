import type React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ClipReveal } from "@/components/ClipReveal";
import { COLOR } from "@/lib/colors";
import { TEXT } from "@/lib/fonts";
import { SPRING } from "@/lib/motion";

const PARTICLE_COUNT = 25;

export const LogoReveal: React.FC<{
  convergeFrame?: number;
  burstFrame?: number;
  logoFrame?: number;
  textFrame?: number;
  taglineFrame?: number;
  logoSize?: number;
}> = ({
  convergeFrame = 0,
  burstFrame = 30,
  logoFrame = 30,
  textFrame = 50,
  taglineFrame = 70,
  logoSize = 80,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const logoScale = spring({
    frame: frame - logoFrame,
    fps,
    config: SPRING.popIn,
  });

  const glowRadius = interpolate(frame, [burstFrame, burstFrame + 15], [0, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glowOpacity = interpolate(frame, [burstFrame, burstFrame + 20], [0.2, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const baseAngle = random(`particle-angle-${i}`) * Math.PI * 2;
        const maxRadius = 300 + random(`particle-radius-${i}`) * 200;
        const size = 2 + random(`particle-size-${i}`) * 3;
        const rotSpeed = 0.03 + random(`particle-speed-${i}`) * 0.02;
        const particleOpacity = 0.3 + random(`particle-opacity-${i}`) * 0.7;

        const convergeProgress = interpolate(frame, [convergeFrame, burstFrame], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const angle = baseAngle + frame * rotSpeed;
        const radius = maxRadius * convergeProgress;
        const px = width / 2 + Math.cos(angle) * radius;
        const py = height / 2 + Math.sin(angle) * radius;
        const pOpacity = convergeProgress > 0.05 ? particleOpacity : 0;

        return (
          <div
            key={`particle-${i}`}
            style={{
              position: "absolute",
              left: px - size / 2,
              top: py - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: COLOR.accent,
              opacity: pOpacity,
            }}
          />
        );
      })}

      <div
        style={{
          position: "absolute",
          width: glowRadius * 2,
          height: glowRadius * 2,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLOR.accent} 0%, transparent 70%)`,
          opacity: glowOpacity,
          left: width / 2 - glowRadius,
          top: height / 2 - glowRadius,
        }}
      />

      <Img
        src={staticFile("logo.png")}
        style={{
          width: logoSize,
          height: logoSize,
          transform: `scale(${logoScale})`,
        }}
      />

      <div style={{ height: 16 }} />

      <ClipReveal startFrame={textFrame}>
        <span style={{ ...TEXT.sectionTitle, fontSize: 48, color: "white" }}>SnapOtter</span>
      </ClipReveal>

      <div style={{ height: 8 }} />

      <ClipReveal startFrame={taglineFrame}>
        <span
          style={{
            fontFamily: TEXT.heroSub.fontFamily,
            fontWeight: 500,
            fontSize: 24,
            color: COLOR.accent,
          }}
        >
          Your images. Stay yours.
        </span>
      </ClipReveal>
    </AbsoluteFill>
  );
};
