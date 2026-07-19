import type { ColorMode } from "../types";

export interface ColorTheme {
  name: string;
  colors: string[];
}

export const COLOR_THEMES: Record<string, ColorTheme> = {
  matrix: { name: "Matrix Green", colors: ["#001100", "#003300", "#006600", "#00cc00", "#00ff00", "#33ff33"] },
  amber: { name: "Amber CRT", colors: ["#1a0f00", "#332200", "#664400", "#cc8800", "#ffaa00", "#ffcc44"] },
  cyberpunk: { name: "Cyberpunk", colors: ["#0d0221", "#0f084b", "#26015f", "#a600ff", "#ff2afc", "#ff0099"] },
  fire: { name: "Fire", colors: ["#1a0000", "#4a0000", "#8b0000", "#cc3300", "#ff6600", "#ffcc00"] },
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function interpolateColor(
  colors: [number, number, number][],
  t: number
): [number, number, number] {
  const n = colors.length - 1;
  const idx = Math.min(Math.floor(t * n), n - 1);
  const frac = t * n - idx;
  const c0 = colors[idx];
  const c1 = colors[Math.min(idx + 1, n)];
  return [
    Math.round(c0[0] + (c1[0] - c0[0]) * frac),
    Math.round(c0[1] + (c1[1] - c0[1]) * frac),
    Math.round(c0[2] + (c1[2] - c0[2]) * frac),
  ];
}

export function getThemeColor(
  mode: ColorMode,
  luminance: number,
  originalColor?: string
): string {
  if (mode === "original" && originalColor) return originalColor;
  if (mode === "mono") return "";

  const theme = COLOR_THEMES[mode];
  if (!theme) return "";

  const rgbColors = theme.colors.map(hexToRgb);
  const t = luminance / 255;
  const [r, g, b] = interpolateColor(rgbColors, t);
  return `rgb(${r},${g},${b})`;
}

export function getMonoColor(
  _luminance: number,
  originalColor?: string,
  mode?: ColorMode
): string {
  if (mode === "original" && originalColor) return originalColor;
  return "";
}
