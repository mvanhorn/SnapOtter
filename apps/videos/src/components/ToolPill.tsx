import type React from "react";
import { COLOR } from "@/lib/colors";
import { TEXT } from "@/lib/fonts";

export const ToolPill: React.FC<{
  name: string;
  category: string;
  style?: React.CSSProperties;
}> = ({ name, category, style }) => {
  const color = COLOR.category[category] ?? COLOR.accent;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 12px",
        borderRadius: 6,
        backgroundColor: color,
        color: "white",
        ...TEXT.toolPill,
        whiteSpace: "nowrap",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.1)",
        backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, transparent 100%)",
        ...style,
      }}
    >
      {name}
    </div>
  );
};
