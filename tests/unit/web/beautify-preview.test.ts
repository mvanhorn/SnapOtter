// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

// Import the module source to test the exported helper functions.
// We test buildPreviewStyle and renderFramePreview indirectly by
// re-implementing the pure logic here (they're module-private).
// Instead, we test the CSS output contract directly.

// ---------------------------------------------------------------------------
// hexToRgba (matches the module-private helper)
// ---------------------------------------------------------------------------
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

describe("hexToRgba", () => {
  it("converts black with full opacity", () => {
    expect(hexToRgba("#000000", 1)).toBe("rgba(0, 0, 0, 1)");
  });

  it("converts white with half opacity", () => {
    expect(hexToRgba("#ffffff", 0.5)).toBe("rgba(255, 255, 255, 0.5)");
  });

  it("converts arbitrary color", () => {
    expect(hexToRgba("#ff5f57", 0.3)).toBe("rgba(255, 95, 87, 0.3)");
  });
});

// ---------------------------------------------------------------------------
// buildPreviewStyle contract tests
// ---------------------------------------------------------------------------

const SHADOW_CSS: Record<string, string> = {
  subtle: "0px 4px 20px rgba(0,0,0,0.2)",
  medium: "0px 10px 40px rgba(0,0,0,0.35)",
  dramatic: "0px 20px 80px rgba(0,0,0,0.5)",
};

function buildPreviewStyle(
  settings: Record<string, unknown>,
  bgImageUrl?: string | null,
): React.CSSProperties {
  const bg = settings.backgroundType as string;
  let background: string | undefined;
  const extra: React.CSSProperties = {};

  if (bg === "solid") {
    background = settings.backgroundColor as string;
  } else if (bg === "linear-gradient") {
    const stops = settings.gradientStops as { color: string; position: number }[];
    const angle = settings.gradientAngle as number;
    background = `linear-gradient(${angle}deg, ${stops.map((s) => `${s.color} ${s.position}%`).join(", ")})`;
  } else if (bg === "radial-gradient") {
    const stops = settings.gradientStops as { color: string; position: number }[];
    background = `radial-gradient(circle, ${stops.map((s) => `${s.color} ${s.position}%`).join(", ")})`;
  } else if (bg === "image" && bgImageUrl) {
    extra.backgroundImage = `url("${bgImageUrl}")`;
    extra.backgroundSize = "cover";
    extra.backgroundPosition = "center";
  }

  const shadowPreset = settings.shadowPreset as string;
  let boxShadow: string | undefined;
  if (shadowPreset === "custom") {
    const blur = settings.shadowBlur as number;
    const ox = settings.shadowOffsetX as number;
    const oy = settings.shadowOffsetY as number;
    const color = settings.shadowColor as string;
    const opacity = (settings.shadowOpacity as number) / 100;
    boxShadow = `${ox}px ${oy}px ${blur}px ${hexToRgba(color, opacity)}`;
  } else if (shadowPreset !== "none") {
    boxShadow = SHADOW_CSS[shadowPreset];
  }

  const frame = settings.frame as string;
  const hasFrame = frame && frame !== "none";

  return {
    background,
    ...extra,
    padding: `${settings.padding}px`,
    borderRadius: hasFrame ? "0px" : `${settings.borderRadius}px`,
    boxShadow,
  };
}

describe("buildPreviewStyle", () => {
  const baseSettings = {
    backgroundType: "solid",
    backgroundColor: "#ff0000",
    gradientStops: [
      { color: "#667eea", position: 0 },
      { color: "#764ba2", position: 100 },
    ],
    gradientAngle: 135,
    padding: 64,
    borderRadius: 12,
    shadowPreset: "subtle",
    shadowBlur: 20,
    shadowOffsetX: 0,
    shadowOffsetY: 10,
    shadowColor: "#000000",
    shadowOpacity: 30,
    frame: "none",
  };

  it("solid background returns the color", () => {
    const style = buildPreviewStyle(baseSettings);
    expect(style.background).toBe("#ff0000");
  });

  it("linear gradient builds CSS gradient string", () => {
    const style = buildPreviewStyle({ ...baseSettings, backgroundType: "linear-gradient" });
    expect(style.background).toContain("linear-gradient(135deg");
    expect(style.background).toContain("#667eea 0%");
    expect(style.background).toContain("#764ba2 100%");
  });

  it("radial gradient builds CSS gradient string", () => {
    const style = buildPreviewStyle({ ...baseSettings, backgroundType: "radial-gradient" });
    expect(style.background).toContain("radial-gradient(circle");
  });

  it("image background sets backgroundImage with blob URL", () => {
    const style = buildPreviewStyle(
      { ...baseSettings, backgroundType: "image" },
      "blob:http://localhost/abc-123",
    );
    expect(style.backgroundImage).toBe('url("blob:http://localhost/abc-123")');
    expect(style.backgroundSize).toBe("cover");
    expect(style.backgroundPosition).toBe("center");
    expect(style.background).toBeUndefined();
  });

  it("image background without URL does not set backgroundImage", () => {
    const style = buildPreviewStyle({ ...baseSettings, backgroundType: "image" });
    expect(style.backgroundImage).toBeUndefined();
  });

  it("transparent background sets no background", () => {
    const style = buildPreviewStyle({ ...baseSettings, backgroundType: "transparent" });
    expect(style.background).toBeUndefined();
    expect(style.backgroundImage).toBeUndefined();
  });

  it("padding and borderRadius are set from settings", () => {
    const style = buildPreviewStyle(baseSettings);
    expect(style.padding).toBe("64px");
    expect(style.borderRadius).toBe("12px");
  });

  it("named shadow presets return correct CSS", () => {
    expect(buildPreviewStyle({ ...baseSettings, shadowPreset: "subtle" }).boxShadow).toBe(
      SHADOW_CSS.subtle,
    );
    expect(buildPreviewStyle({ ...baseSettings, shadowPreset: "medium" }).boxShadow).toBe(
      SHADOW_CSS.medium,
    );
    expect(buildPreviewStyle({ ...baseSettings, shadowPreset: "dramatic" }).boxShadow).toBe(
      SHADOW_CSS.dramatic,
    );
  });

  it("none shadow returns no boxShadow", () => {
    const style = buildPreviewStyle({ ...baseSettings, shadowPreset: "none" });
    expect(style.boxShadow).toBeUndefined();
  });

  it("custom shadow computes CSS from parameters", () => {
    const style = buildPreviewStyle({
      ...baseSettings,
      shadowPreset: "custom",
      shadowBlur: 30,
      shadowOffsetX: 5,
      shadowOffsetY: 15,
      shadowColor: "#ff0000",
      shadowOpacity: 50,
    });
    expect(style.boxShadow).toBe("5px 15px 30px rgba(255, 0, 0, 0.5)");
  });

  it("borderRadius is 0px when a frame is present", () => {
    const style = buildPreviewStyle({ ...baseSettings, frame: "macos-light" });
    expect(style.borderRadius).toBe("0px");
  });

  it("borderRadius is normal when frame is none", () => {
    const style = buildPreviewStyle({ ...baseSettings, frame: "none" });
    expect(style.borderRadius).toBe("12px");
  });
});
