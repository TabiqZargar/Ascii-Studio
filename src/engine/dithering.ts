/**
 * Dithering algorithms for ASCII art.
 *
 * - Floyd-Steinberg error diffusion (highest quality)
 * - Bayer ordered dithering (fast, deterministic pattern)
 * - No dithering (nearest value)
 *
 * Dithering spreads quantization error to neighboring cells,
 * producing perceptually smoother gradients.
 */

export type DitherMode = "none" | "floyd-steinberg" | "bayer";

/** 4x4 Bayer matrix thresholds */
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/**
 * Apply Floyd-Steinberg error diffusion dithering.
 *
 * Each pixel's quantization error is distributed to neighbors:
 *   7/16 to right
 *   3/16 to bottom-left
 *   5/16 to bottom
 *   1/16 to bottom-right
 */
export function floydSteinbergDither(
  luminance: Float32Array,
  w: number,
  h: number,
  levels: number
): Float32Array {
  const out = new Float32Array(luminance.length);
  const step = 255 / (levels - 1);

  // Work with a copy to avoid modifying input
  const buffer = new Float32Array(luminance);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const old = buffer[idx];
      const snapped = Math.round(old / step) * step;
      const clamped = Math.max(0, Math.min(255, snapped));
      out[idx] = clamped;
      const error = old - clamped;

      // Distribute error
      if (x + 1 < w) buffer[idx + 1] += error * 7 / 16;
      if (y + 1 < h) {
        if (x - 1 >= 0) buffer[(y + 1) * w + (x - 1)] += error * 3 / 16;
        buffer[(y + 1) * w + x] += error * 5 / 16;
        if (x + 1 < w) buffer[(y + 1) * w + (x + 1)] += error * 1 / 16;
      }
    }
  }

  return out;
}

/**
 * Apply Bayer ordered dithering.
 *
 * Uses a 4x4 threshold matrix to determine quantization at each pixel.
 * Faster than Floyd-Steinberg but produces visible patterns.
 */
export function bayerDither(
  luminance: Float32Array,
  w: number,
  h: number,
  levels: number
): Float32Array {
  const out = new Float32Array(luminance.length);
  const step = 255 / (levels - 1);
  const thresholdRange = 16;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const threshold = (BAYER_4X4[y % 4][x % 4] / 16 - 0.5) * thresholdRange;
      const adjusted = luminance[idx] + threshold;
      const snapped = Math.round(adjusted / step) * step;
      out[idx] = Math.max(0, Math.min(255, snapped));
    }
  }

  return out;
}

/** Apply dithering based on mode */
export function applyDithering(
  luminance: Float32Array,
  w: number,
  h: number,
  mode: DitherMode,
  levels: number
): Float32Array {
  switch (mode) {
    case "floyd-steinberg":
      return floydSteinbergDither(luminance, w, h, levels);
    case "bayer":
      return bayerDither(luminance, w, h, levels);
    default:
      return new Float32Array(luminance);
  }
}
