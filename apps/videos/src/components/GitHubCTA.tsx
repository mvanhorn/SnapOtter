import type React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { ClipReveal } from "@/components/ClipReveal";
import { COLOR } from "@/lib/colors";
import { FONT, TEXT } from "@/lib/fonts";

export const GitHubCTA: React.FC<{
  labelFrame?: number;
  logoFrame?: number;
  taglineFrame?: number;
  ctaFrame?: number;
  urlFrame?: number;
}> = ({ labelFrame = 0, logoFrame = 15, taglineFrame = 30, ctaFrame = 50, urlFrame = 65 }) => {
  const frame = useCurrentFrame();

  const logoScale = interpolate(frame, [logoFrame, logoFrame + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const glowRadius = interpolate(frame, [logoFrame, logoFrame + 15], [0, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const borderOpacity = interpolate(Math.sin(frame * 0.06), [-1, 1], [0.3, 0.6]);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        border: `2px solid rgba(245, 158, 11, ${borderOpacity})`,
      }}
    >
      <ClipReveal startFrame={labelFrame}>
        <span
          style={{
            ...TEXT.label,
            color: COLOR.accent,
            fontSize: 18,
          }}
        >
          100% OPEN SOURCE
        </span>
      </ClipReveal>

      <div style={{ height: 24 }} />

      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            width: glowRadius * 2,
            height: glowRadius * 2,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${COLOR.accent} 0%, transparent 70%)`,
            opacity: 0.15,
            left: 40 - glowRadius,
            top: 40 - glowRadius,
          }}
        />
        <Img
          src={staticFile("logo.png")}
          style={{
            width: 80,
            height: 80,
            transform: `scale(${logoScale})`,
          }}
        />
      </div>

      <div style={{ height: 20 }} />

      <ClipReveal startFrame={taglineFrame}>
        <span style={{ ...TEXT.sectionTitle, fontSize: 48 }}>Free forever.</span>
      </ClipReveal>

      <div style={{ height: 16 }} />

      <ClipReveal startFrame={ctaFrame}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          <span style={{ fontFamily: FONT.body, fontWeight: 400, fontSize: 20, color: "white" }}>
            Star us on GitHub
          </span>
        </div>
      </ClipReveal>

      <div style={{ height: 8 }} />

      <ClipReveal startFrame={urlFrame}>
        <span style={{ fontFamily: FONT.mono, fontSize: 16, color: COLOR.accent }}>
          github.com/snapotter-hq/SnapOtter
        </span>
      </ClipReveal>
    </AbsoluteFill>
  );
};
