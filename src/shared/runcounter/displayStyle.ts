import { CSSProperties } from "react";
import { ElementStyle } from "./types";

/** Curated font choices (value = CSS font-family; "" = inherit/default). */
export const FONT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Default" },
  { value: "ui-monospace, SFMono-Regular, Menlo, monospace", label: "Monospace" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "'Segoe UI', system-ui, sans-serif", label: "Segoe UI" },
  { value: "Verdana, Geneva, sans-serif", label: "Verdana" },
  { value: "Tahoma, Geneva, sans-serif", label: "Tahoma" },
  { value: "'Trebuchet MS', Helvetica, sans-serif", label: "Trebuchet MS" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Times New Roman', Times, serif", label: "Times New Roman" },
  { value: "Garamond, Georgia, serif", label: "Garamond" },
  { value: "'Courier New', Courier, monospace", label: "Courier New" },
  { value: "Consolas, 'Lucida Console', monospace", label: "Consolas" },
  { value: "Impact, Haettenschweiler, sans-serif", label: "Impact" },
  { value: "'Comic Sans MS', 'Comic Sans', cursive", label: "Comic Sans MS" },
  { value: "'Diablo', monospace", label: "Diablo" },
];

// Back-compat: earlier versions stored short keys instead of CSS font-family values.
const LEGACY_FONT: Record<string, string> = {
  sans: "Inter, system-ui, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
  diablo: "'Diablo', monospace",
};

/** Build inline CSS for a styleable display element; falls back to `fallbackColor`. */
export const elementCss = (s: ElementStyle, fallbackColor?: string): CSSProperties => {
  const fontFamily = LEGACY_FONT[s.fontFamily] ?? s.fontFamily;
  return {
    fontWeight: s.bold ? 700 : 400,
    fontStyle: s.italic ? "italic" : "normal",
    fontSize: `${s.fontSize}px`,
    color: s.color || fallbackColor || undefined,
    fontFamily: fontFamily || undefined,
    lineHeight: 1.1,
  };
};
