/**
 * Character shape vector system.
 *
 * Instead of mapping brightness to characters by density alone,
 * we sample each character's visual shape using 6 spatial circles
 * in a 2x3 grid (left/right x top/middle/bottom).
 *
 * This captures WHERE ink falls in each cell, not just how much.
 * Inspired by Alex Harri's research on ASCII rendering.
 */

export interface ShapeChar {
  char: string;
  density: number;
  vector: [number, number, number, number, number, number];
}

// 6 sampling circle positions (normalized 0..1 within cell)
// Left column, Right column x Top, Middle, Bottom
const SAMPLE_POSITIONS: Array<[number, number]> = [
  [0.3, 0.2], // top-left
  [0.7, 0.2], // top-right
  [0.3, 0.5], // middle-left
  [0.7, 0.5], // middle-right
  [0.3, 0.8], // bottom-left
  [0.7, 0.8], // bottom-right
];

const SAMPLE_RADIUS = 0.28;

/**
 * Pre-computed shape vectors for ASCII characters.
 * Each vector encodes visual density in 6 spatial regions.
 */
export const ASCII_SHAPE_CHARS: ShapeChar[] = [
  // Space - zero density everywhere
  { char: " ", density: 0, vector: [0, 0, 0, 0, 0, 0] },

  // Period/dot - tiny dot in lower center
  { char: ".", density: 0.05, vector: [0, 0, 0, 0, 0.3, 0.3] },

  // Comma - dot in lower area
  { char: ",", density: 0.06, vector: [0, 0, 0, 0, 0.35, 0.2] },

  // Colon - two dots
  { char: ":", density: 0.1, vector: [0, 0, 0.3, 0.3, 0.3, 0.3] },

  // Semicolon
  { char: ";", density: 0.12, vector: [0, 0, 0.3, 0.3, 0.35, 0.2] },

  // Apostrophe
  { char: "'", density: 0.06, vector: [0.3, 0.3, 0, 0, 0, 0] },

  // Hyphen/minus
  { char: "-", density: 0.12, vector: [0, 0, 0.7, 0.7, 0, 0] },

  // Underscore
  { char: "_", density: 0.12, vector: [0, 0, 0, 0, 0.7, 0.7] },

  // Pipe/vertical bar
  { char: "|", density: 0.2, vector: [0.6, 0.6, 0.6, 0.6, 0.6, 0.6] },

  // Exclamation
  { char: "!", density: 0.2, vector: [0.5, 0.5, 0.5, 0.5, 0.3, 0.3] },

  // Tilde
  { char: "~", density: 0.15, vector: [0, 0.3, 0.5, 0, 0.3, 0] },

  // Plus
  { char: "+", density: 0.22, vector: [0, 0, 0.8, 0.8, 0, 0] },

  // Equals
  { char: "=", density: 0.18, vector: [0, 0, 0.6, 0.6, 0.6, 0.6] },

  // Less than
  { char: "<", density: 0.2, vector: [0.3, 0, 0, 0.5, 0.3, 0] },

  // Greater than
  { char: ">", density: 0.2, vector: [0, 0.3, 0.5, 0, 0, 0.3] },

  // Question mark
  { char: "?", density: 0.25, vector: [0.3, 0.3, 0.1, 0.4, 0, 0.3] },

  // Slash
  { char: "/", density: 0.2, vector: [0.1, 0.5, 0.2, 0.4, 0.5, 0.1] },

  // Backslash
  { char: "\\", density: 0.2, vector: [0.5, 0.1, 0.4, 0.2, 0.1, 0.5] },

  // Parentheses
  { char: "(", density: 0.18, vector: [0.3, 0, 0.5, 0, 0.3, 0] },
  { char: ")", density: 0.18, vector: [0, 0.3, 0, 0.5, 0, 0.3] },

  // Brackets
  { char: "[", density: 0.2, vector: [0.5, 0, 0.5, 0, 0.5, 0] },
  { char: "]", density: 0.2, vector: [0, 0.5, 0, 0.5, 0, 0.5] },

  // Braces
  { char: "{", density: 0.22, vector: [0.3, 0, 0.5, 0, 0.3, 0] },
  { char: "}", density: 0.22, vector: [0, 0.3, 0, 0.5, 0, 0.3] },

  // Caret
  { char: "^", density: 0.15, vector: [0.3, 0.3, 0.5, 0.5, 0, 0] },

  // Letters (approximate shape vectors)
  { char: "i", density: 0.18, vector: [0.3, 0.3, 0, 0, 0.2, 0.2] },
  { char: "l", density: 0.22, vector: [0.4, 0.4, 0.4, 0.4, 0.4, 0.4] },
  { char: "t", density: 0.22, vector: [0.1, 0.5, 0.4, 0.4, 0, 0.2] },
  { char: "f", density: 0.22, vector: [0.1, 0.5, 0.4, 0.3, 0, 0.2] },
  { char: "j", density: 0.18, vector: [0.3, 0.3, 0, 0, 0.3, 0.2] },
  { char: "r", density: 0.2, vector: [0, 0.3, 0.4, 0.2, 0.4, 0] },
  { char: "v", density: 0.22, vector: [0.4, 0.4, 0.3, 0.3, 0.1, 0.1] },
  { char: "w", density: 0.28, vector: [0.4, 0.4, 0.3, 0.3, 0.2, 0.2] },
  { char: "x", density: 0.22, vector: [0.3, 0.3, 0.4, 0.4, 0.3, 0.3] },
  { char: "z", density: 0.22, vector: [0.4, 0.4, 0.3, 0.3, 0.4, 0.4] },
  { char: "c", density: 0.22, vector: [0.3, 0.3, 0.3, 0, 0.3, 0.3] },
  { char: "o", density: 0.28, vector: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3] },
  { char: "e", density: 0.28, vector: [0.3, 0.3, 0.4, 0.3, 0.3, 0.3] },
  { char: "s", density: 0.25, vector: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3] },
  { char: "a", density: 0.25, vector: [0.2, 0.2, 0.2, 0.3, 0.3, 0.3] },
  { char: "n", density: 0.25, vector: [0.3, 0, 0.4, 0.3, 0.4, 0.3] },
  { char: "u", density: 0.25, vector: [0.3, 0.3, 0, 0, 0.3, 0.3] },
  { char: "d", density: 0.28, vector: [0, 0.3, 0, 0.3, 0.3, 0.3] },
  { char: "p", density: 0.28, vector: [0.3, 0, 0.3, 0, 0.3, 0.3] },
  { char: "b", density: 0.28, vector: [0.3, 0, 0.3, 0.3, 0.3, 0.3] },
  { char: "g", density: 0.25, vector: [0.3, 0.3, 0.2, 0.2, 0.3, 0.2] },
  { char: "h", density: 0.25, vector: [0.3, 0, 0.4, 0.3, 0.4, 0.3] },
  { char: "k", density: 0.25, vector: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3] },
  { char: "m", density: 0.32, vector: [0.3, 0.3, 0.4, 0.4, 0.4, 0.4] },
  { char: "A", density: 0.35, vector: [0.3, 0.3, 0.5, 0.5, 0.2, 0.2] },
  { char: "B", density: 0.35, vector: [0.4, 0.4, 0.4, 0.4, 0.4, 0.4] },
  { char: "C", density: 0.3, vector: [0.3, 0.3, 0.3, 0, 0.3, 0.3] },
  { char: "D", density: 0.35, vector: [0.4, 0.3, 0.4, 0.3, 0.4, 0.3] },
  { char: "E", density: 0.32, vector: [0.4, 0, 0.4, 0, 0.4, 0] },
  { char: "F", density: 0.3, vector: [0.4, 0, 0.4, 0, 0.4, 0] },
  { char: "G", density: 0.32, vector: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3] },
  { char: "H", density: 0.35, vector: [0.3, 0.3, 0.5, 0.5, 0.3, 0.3] },
  { char: "I", density: 0.25, vector: [0.4, 0.4, 0.4, 0.4, 0.4, 0.4] },
  { char: "J", density: 0.25, vector: [0.3, 0.3, 0.3, 0.3, 0.3, 0.2] },
  { char: "K", density: 0.32, vector: [0.3, 0.3, 0.4, 0.3, 0.3, 0.3] },
  { char: "L", density: 0.3, vector: [0.3, 0, 0.3, 0, 0.3, 0.3] },
  { char: "M", density: 0.4, vector: [0.3, 0.3, 0.5, 0.5, 0.4, 0.4] },
  { char: "N", density: 0.35, vector: [0.3, 0.3, 0.5, 0.4, 0.4, 0.3] },
  { char: "O", density: 0.35, vector: [0.3, 0.3, 0.4, 0.4, 0.3, 0.3] },
  { char: "P", density: 0.32, vector: [0.4, 0.3, 0.4, 0.3, 0.4, 0] },
  { char: "Q", density: 0.35, vector: [0.3, 0.3, 0.4, 0.4, 0.3, 0.4] },
  { char: "R", density: 0.35, vector: [0.4, 0.3, 0.4, 0.3, 0.4, 0.3] },
  { char: "S", density: 0.32, vector: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3] },
  { char: "T", density: 0.3, vector: [0.5, 0.5, 0.3, 0.3, 0, 0] },
  { char: "U", density: 0.32, vector: [0.3, 0.3, 0, 0, 0.3, 0.3] },
  { char: "V", density: 0.3, vector: [0.4, 0.4, 0.2, 0.2, 0.1, 0.1] },
  { char: "W", density: 0.38, vector: [0.4, 0.4, 0.3, 0.3, 0.3, 0.3] },
  { char: "X", density: 0.3, vector: [0.3, 0.3, 0.4, 0.4, 0.3, 0.3] },
  { char: "Y", density: 0.28, vector: [0.4, 0.4, 0.3, 0.3, 0, 0] },
  { char: "Z", density: 0.3, vector: [0.4, 0.4, 0.3, 0.3, 0.4, 0.4] },

  // Numbers
  { char: "0", density: 0.32, vector: [0.3, 0.3, 0.4, 0.4, 0.3, 0.3] },
  { char: "1", density: 0.2, vector: [0.3, 0.3, 0.2, 0.2, 0.3, 0.3] },
  { char: "2", density: 0.28, vector: [0.3, 0.3, 0.2, 0.3, 0.3, 0.3] },
  { char: "3", density: 0.28, vector: [0.3, 0.3, 0.2, 0.3, 0.3, 0.3] },
  { char: "4", density: 0.3, vector: [0.2, 0.3, 0.3, 0.4, 0, 0.2] },
  { char: "5", density: 0.28, vector: [0.3, 0.2, 0.3, 0.3, 0.3, 0.3] },
  { char: "6", density: 0.3, vector: [0.3, 0.2, 0.3, 0.3, 0.3, 0.3] },
  { char: "7", density: 0.25, vector: [0.4, 0.4, 0.2, 0.2, 0.1, 0.1] },
  { char: "8", density: 0.32, vector: [0.3, 0.3, 0.4, 0.4, 0.3, 0.3] },
  { char: "9", density: 0.3, vector: [0.3, 0.3, 0.3, 0.3, 0.2, 0.3] },

  // Symbols
  { char: "@", density: 0.4, vector: [0.3, 0.3, 0.4, 0.4, 0.3, 0.3] },
  { char: "#", density: 0.42, vector: [0.3, 0.3, 0.5, 0.5, 0.3, 0.3] },
  { char: "$", density: 0.38, vector: [0.3, 0.3, 0.4, 0.4, 0.3, 0.3] },
  { char: "%", density: 0.32, vector: [0.3, 0.1, 0.2, 0.3, 0.1, 0.3] },
  { char: "&", density: 0.38, vector: [0.2, 0.2, 0.3, 0.3, 0.3, 0.3] },
  { char: "*", density: 0.25, vector: [0.3, 0.3, 0.4, 0.4, 0.3, 0.3] },
];

/** Euclidean distance between two 6D vectors */
export function shapeDistance(a: readonly number[], b: readonly number[]): number {
  let sum = 0;
  for (let i = 0; i < 6; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/** Find the best character for a given 6D shape vector */
export function findBestShapeChar(vector: readonly number[], charset?: string): ShapeChar {
  const chars = charset ? filterCharset(charset) : ASCII_SHAPE_CHARS;
  let best = chars[0];
  let bestDist = Infinity;

  for (const sc of chars) {
    const dist = shapeDistance(vector, sc.vector);
    if (dist < bestDist) {
      bestDist = dist;
      best = sc;
    }
  }
  return best;
}

function filterCharset(charset: string): ShapeChar[] {
  const chars = new Set(charset);
  return ASCII_SHAPE_CHARS.filter((sc) => chars.has(sc.char));
}

/** Compute the 6D shape vector for a grayscale image region */
export function sampleShapeVector(
  gray: Float32Array,
  w: number,
  h: number,
  cellX: number,
  cellY: number,
  cellW: number,
  cellH: number
): [number, number, number, number, number, number] {
  const vector: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0];

  for (let i = 0; i < 6; i++) {
    const [px, py] = SAMPLE_POSITIONS[i];
    const cx = cellX + px * cellW;
    const cy = cellY + py * cellH;
    const r = SAMPLE_RADIUS * Math.min(cellW, cellH);
    let sum = 0;
    let count = 0;

    // Sample within the circle
    const x0 = Math.max(0, Math.floor(cx - r));
    const x1 = Math.min(w - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r));
    const y1 = Math.min(h - 1, Math.ceil(cy + r));

    for (let sy = y0; sy <= y1; sy++) {
      for (let sx = x0; sx <= x1; sx++) {
        const dx = sx - cx;
        const dy = sy - cy;
        if (dx * dx + dy * dy <= r * r) {
          sum += gray[sy * w + sx];
          count++;
        }
      }
    }

    vector[i] = count > 0 ? sum / count / 255 : 0;
  }

  return vector;
}
