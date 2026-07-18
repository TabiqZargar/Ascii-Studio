import type { GradientPreset } from "../types";

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function lerpColor(c1: string, c2: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export function gradientColorAt(colors: string[], t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  if (colors.length === 0) return "#ffffff";
  if (colors.length === 1) return colors[0];
  const segment = clamped * (colors.length - 1);
  const idx = Math.floor(segment);
  const frac = segment - idx;
  if (idx >= colors.length - 1) return colors[colors.length - 1];
  return lerpColor(colors[idx], colors[idx + 1], frac);
}

export function brightnessToGradientColor(brightness: number, gradient: GradientPreset): string {
  return gradientColorAt(gradient.colors, brightness / 255);
}
