/**
 * Main ASCII conversion engine.
 *
 * Combines preprocessing, shape vector matching, and dithering
 * to produce high-quality ASCII art output.
 */

import { preprocess, type PreprocessOptions } from "./imageProcessing";
import { sampleShapeVector, findBestShapeChar } from "./shapeVectors";
import { applyDithering, type DitherMode } from "./dithering";
import { analyzeSubject, type SubjectAnalysis } from "./subjectDetection";

export interface ConversionOptions extends PreprocessOptions {
  charset: string;
  asciiWidth: number;
  asciiHeight: number;
  dithering: DitherMode;
  useShapeMatching: boolean;
  ditherLevels: number;
  invertColors: boolean;
  // Original pixel data for color modes
  colorMode: "mono" | "original" | "gradient";
  monoColor: string;
}

export interface ConversionResult {
  ascii: string;
  colorGrid: string[][];
  subjectAnalysis: SubjectAnalysis;
  processingTime: number;
}

/**
 * Perform high-quality ASCII conversion using shape vector matching.
 */
export function convertToAscii(
  imageData: ImageData,
  options: ConversionOptions
): ConversionResult {
  const start = performance.now();
  const { width: srcW, height: srcH } = imageData;

  // Compute target dimensions with aspect ratio correction
  // Monospace characters are ~2x taller than wide
  const aspectCorrection = 0.5;
  const targetW = options.asciiWidth;
  const targetH = Math.round((srcH / srcW) * targetW * aspectCorrection);

  // Step 1: Preprocess image
  const { gray, edges } = preprocess(imageData, options, targetW, targetH);

  // Step 2: Apply dithering if enabled
  let processedGray = gray;
  if (options.dithering !== "none") {
    processedGray = applyDithering(gray, targetW, targetH, options.dithering, options.ditherLevels);
  }

  // Step 3: Build charset for shape matching
  const charset = options.charset || " .:-=+*#%@";

  // Step 4: Generate ASCII output
  const lines: string[] = [];
  const colorLines: string[][] = [];
  const { data: srcData } = imageData;

  // Compute block sizes for color sampling
  const blockW = srcW / targetW;
  const blockH = srcH / targetH;

  for (let row = 0; row < targetH; row++) {
    const line: string[] = [];
    const cLine: string[] = [];

    for (let col = 0; col < targetW; col++) {
      let ch: string;

      if (options.useShapeMatching) {
        // Shape vector matching
        const vector = sampleShapeVector(processedGray, targetW, targetH, col, row, 1, 1);

        // Apply edge enhancement to the vector
        const edgeVal = edges[row * targetW + col] / 255;
        const edgeEnhanceVal = options.edgeEnhance ?? 1.5;
        const enhancedVector = vector.map((v, i) =>
          Math.max(0, Math.min(1, v + edgeVal * edgeEnhanceVal * 0.1 * (i % 2 === 0 ? 1 : -1)))
        ) as [number, number, number, number, number, number];

        // For shape matching, we invert the vector because brighter regions
        // should map to less dense characters
        const invertedVector: [number, number, number, number, number, number] = [
          1 - enhancedVector[0],
          1 - enhancedVector[1],
          1 - enhancedVector[2],
          1 - enhancedVector[3],
          1 - enhancedVector[4],
          1 - enhancedVector[5],
        ];

        const best = findBestShapeChar(invertedVector, charset);
        ch = best.char;
      } else {
        // Traditional luminance-based mapping
        const lum = processedGray[row * targetW + col];
        const invertedLum = options.invertColors ? lum : 255 - lum;
        const charIdx = Math.floor((invertedLum / 255) * (charset.length - 1));
        ch = charset[Math.max(0, Math.min(charIdx, charset.length - 1))];
      }

      line.push(ch);

      // Sample color from original image
      const color = sampleColor(srcData, srcW, srcH, col, row, blockW, blockH, options);
      cLine.push(color);
    }

    lines.push(line.join(""));
    colorLines.push(cLine);
  }

  // Step 5: Analyze subject (for UI feedback)
  const subjectAnalysis = analyzeSubject(imageData);

  const processingTime = performance.now() - start;

  return {
    ascii: lines.join("\n"),
    colorGrid: colorLines,
    subjectAnalysis,
    processingTime,
  };
}

function sampleColor(
  data: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  col: number,
  row: number,
  blockW: number,
  blockH: number,
  options: ConversionOptions
): string {
  if (options.colorMode === "mono") {
    return options.monoColor;
  }

  // Sample center of block
  const sx = Math.min(srcW - 1, Math.max(0, Math.round((col + 0.5) * blockW)));
  const sy = Math.min(srcH - 1, Math.max(0, Math.round((row + 0.5) * blockH)));
  const idx = (sy * srcW + sx) * 4;

  if (options.colorMode === "original") {
    return `rgb(${data[idx]},${data[idx + 1]},${data[idx + 2]})`;
  }

  // Gradient mode: map luminance to gradient
  const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  const t = lum / 255;

  // Simple 3-stop gradient interpolation
  // This will be overridden by the gradient system in the reducer
  const r = Math.round(data[idx] * t);
  const g = Math.round(data[idx + 1] * t);
  const b = Math.round(data[idx + 2] * t);

  return `rgb(${r},${g},${b})`;
}

/** Quick conversion for preview (lower quality, faster) */
export function convertToAsciiQuick(
  imageData: ImageData,
  options: ConversionOptions
): string {
  const { width: srcW, height: srcH, data } = imageData;
  const aspectCorrection = 0.5;
  const targetW = Math.min(options.asciiWidth, 80);
  const targetH = Math.round((srcH / srcW) * targetW * aspectCorrection);
  const charset = options.charset || " .:-=+*#%@";

  const lines: string[] = [];
  const blockW = srcW / targetW;
  const blockH = srcH / targetH;

  for (let row = 0; row < targetH; row++) {
    let line = "";
    for (let col = 0; col < targetW; col++) {
      const sx = Math.floor((col + 0.5) * blockW);
      const sy = Math.floor((row + 0.5) * blockH);
      const idx = (sy * srcW + sx) * 4;
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const invertedLum = options.invertColors ? lum : 255 - lum;
      const charIdx = Math.floor((invertedLum / 255) * (charset.length - 1));
      line += charset[Math.max(0, Math.min(charIdx, charset.length - 1))];
    }
    lines.push(line);
  }

  return lines.join("\n");
}
