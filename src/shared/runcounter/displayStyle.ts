import { CSSProperties } from "react";
import { ElementStyle } from "./types";

/** Selectable font families for display elements ("" = inherit/default). */
export const FONT_FAMILY_KEYS = ["", "sans", "mono", "diablo"] as const;

const FONT_FAMILY_CSS: Record<string, string> = {
  "": "",
  sans: "Inter, system-ui, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
  diablo: "'Diablo', monospace",
};

/** Build inline CSS for a styleable display element; falls back to `fallbackColor`. */
export const elementCss = (s: ElementStyle, fallbackColor?: string): CSSProperties => ({
  fontWeight: s.bold ? 700 : 400,
  fontStyle: s.italic ? "italic" : "normal",
  fontSize: `${s.fontSize}px`,
  color: s.color || fallbackColor || undefined,
  fontFamily: FONT_FAMILY_CSS[s.fontFamily] || undefined,
  lineHeight: 1.1,
});
