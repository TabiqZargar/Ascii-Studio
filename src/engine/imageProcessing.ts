/**
 * Advanced image processing pipeline for high-quality ASCII conversion.
 * Techniques: histogram equalization, unsharp masking, adaptive contrast,
 * gamma correction, edge enhancement, and noise reduction.
 */

export function toGrayscale(data: Uint8ClampedArray, w: number, h: number): Float32Array {
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const idx = i * 4;
    gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }
  return gray;
}

/** Histogram equalization using CDF mapping */
export function histogramEqualize(gray: Float32Array): Float32Array {
  const n = gray.length;
  const hist = new Uint32Array(256);

  for (let i = 0; i < n; i++) {
    hist[Math.min(255, Math.max(0, Math.round(gray[i])))]++;
  }

  const cdf = new Float64Array(256);
  cdf[0] = hist[0];
  for (let i = 1; i < 256; i++) {
    cdf[i] = cdf[i - 1] + hist[i];
  }

  const cdfMin = cdf.find((v) => v > 0) ?? 0;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const v = Math.min(255, Math.max(0, Math.round(gray[i])));
    out[i] = ((cdf[v] - cdfMin) / (n - cdfMin)) * 255;
  }
  return out;
}

/** Adaptive histogram equalization (simplified CLAHE-like) */
export function adaptiveHistogramEqualize(gray: Float32Array, w: number, h: number, tileSize = 64): Float32Array {
  const out = new Float32Array(w * h);
  const tilesX = Math.ceil(w / tileSize);
  const tilesY = Math.ceil(h / tileSize);
  const tileMaps: Uint32Array[] = [];

  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const x0 = tx * tileSize;
      const y0 = ty * tileSize;
      const x1 = Math.min(x0 + tileSize, w);
      const y1 = Math.min(y0 + tileSize, h);
      const hist = new Uint32Array(256);

      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          hist[Math.min(255, Math.max(0, Math.round(gray[y * w + x])))]++;
        }
      }

      const area = (x1 - x0) * (y1 - y0);
      const cdf = new Float64Array(256);
      cdf[0] = hist[0] / area;
      for (let i = 1; i < 256; i++) {
        cdf[i] = cdf[i - 1] + hist[i] / area;
      }
      tileMaps.push(cdf as unknown as Uint32Array);
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tx = Math.min(tilesX - 1, Math.floor(x / tileSize));
      const ty = Math.min(tilesY - 1, Math.floor(y / tileSize));
      const v = Math.min(255, Math.max(0, Math.round(gray[y * w + x])));
      const cdf = tileMaps[ty * tilesX + tx] as unknown as Float64Array;
      out[y * w + x] = Math.max(0, Math.min(255, cdf[v] * 255));
    }
  }
  return out;
}

/** Contrast stretching using percentile clipping */
export function contrastStretch(gray: Float32Array, clipPercent = 0.01): Float32Array {
  const sorted = Array.from(gray).sort((a, b) => a - b);
  const clipIdx = Math.floor(sorted.length * clipPercent);
  const low = sorted[clipIdx] ?? 0;
  const high = sorted[sorted.length - 1 - clipIdx] ?? 255;
  const range = high - low || 1;

  const out = new Float32Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    out[i] = Math.max(0, Math.min(255, ((gray[i] - low) / range) * 255));
  }
  return out;
}

/** Unsharp masking - subtract blurred version to enhance edges */
export function unsharpMask(gray: Float32Array, w: number, h: number, amount = 1.5, radius = 1): Float32Array {
  const blurred = gaussianBlur(gray, w, h, radius);
  const out = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    out[i] = Math.max(0, Math.min(255, gray[i] + (gray[i] - blurred[i]) * amount));
  }
  return out;
}

/** Sobel edge detection - returns edge magnitude map */
export function sobelEdges(gray: Float32Array, w: number, h: number): Float32Array {
  const edges = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const gx =
        -gray[(y - 1) * w + (x - 1)] + gray[(y - 1) * w + (x + 1)] +
        -2 * gray[y * w + (x - 1)] + 2 * gray[y * w + (x + 1)] +
        -gray[(y + 1) * w + (x - 1)] + gray[(y + 1) * w + (x + 1)];
      const gy =
        -gray[(y - 1) * w + (x - 1)] - 2 * gray[(y - 1) * w + x] - gray[(y - 1) * w + (x + 1)] +
        gray[(y + 1) * w + (x - 1)] + 2 * gray[(y + 1) * w + x] + gray[(y + 1) * w + (x + 1)];
      edges[idx] = Math.min(255, Math.sqrt(gx * gx + gy * gy));
    }
  }
  return edges;
}

/** Gaussian blur */
export function gaussianBlur(gray: Float32Array, w: number, h: number, radius: number): Float32Array {
  const kernel = buildGaussianKernel(radius);
  const kLen = kernel.length;
  const kHalf = (kLen - 1) / 2;
  const temp = new Float32Array(w * h);
  const out = new Float32Array(w * h);

  // Horizontal pass
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let wSum = 0;
      for (let k = 0; k < kLen; k++) {
        const nx = Math.min(w - 1, Math.max(0, x + k - kHalf));
        sum += gray[y * w + nx] * kernel[k];
        wSum += kernel[k];
      }
      temp[y * w + x] = sum / wSum;
    }
  }

  // Vertical pass
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let wSum = 0;
      for (let k = 0; k < kLen; k++) {
        const ny = Math.min(h - 1, Math.max(0, y + k - kHalf));
        sum += temp[ny * w + x] * kernel[k];
        wSum += kernel[k];
      }
      out[y * w + x] = sum / wSum;
    }
  }

  return out;
}

/** Apply gamma correction */
export function gammaCorrect(gray: Float32Array, gamma: number): Float32Array {
  if (gamma === 1) return gray;
  const invGamma = 1 / gamma;
  const out = new Float32Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    out[i] = 255 * Math.pow(Math.max(0, gray[i]) / 255, invGamma);
  }
  return out;
}

/** Simple box blur for noise reduction */
export function boxBlur(gray: Float32Array, w: number, h: number, radius: number): Float32Array {
  const out = new Float32Array(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = Math.min(w - 1, Math.max(0, x + dx));
          const ny = Math.min(h - 1, Math.max(0, y + dy));
          sum += gray[ny * w + nx];
          count++;
        }
      }
      out[y * w + x] = sum / count;
    }
  }
  return out;
}

function buildGaussianKernel(radius: number): Float32Array {
  const sigma = radius / 3;
  const size = Math.max(1, Math.ceil(radius) * 2 + 1);
  const kernel = new Float32Array(size);
  const half = (size - 1) / 2;
  let sum = 0;

  for (let i = 0; i < size; i++) {
    const x = i - half;
    kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
    sum += kernel[i];
  }

  for (let i = 0; i < size; i++) {
    kernel[i] /= sum;
  }
  return kernel;
}

/** Full preprocessing pipeline */
export interface PreprocessOptions {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  gamma: number;
  sharpness: number;
  blur: number;
  invert: boolean;
  grayscale: boolean;
  edgeDetection: boolean;
  enableHistogramEq?: boolean;
  enableAdaptiveEq?: boolean;
  enableUnsharpMask?: boolean;
  enableNoiseReduction?: boolean;
  edgeEnhance?: number;
}

export interface PreprocessResult {
  gray: Float32Array;
  edges: Float32Array;
  width: number;
  height: number;
}

export function preprocess(
  imageData: ImageData,
  options: PreprocessOptions,
  targetW: number,
  targetH: number
): PreprocessResult {
  const { width: srcW, height: srcH, data } = imageData;

  // Apply color adjustments to raw pixel data first
  const adjusted = applyColorAdjustments(data.slice(), options);

  // Scale to target size using block averaging (like jp2a)
  const scaled = scaleImage(adjusted, srcW, srcH, targetW, targetH);

  // Convert to grayscale
  let gray = toGrayscale(scaled, targetW, targetH);

  // Noise reduction
  if (options.enableNoiseReduction || options.blur > 0) {
    const blurRadius = options.enableNoiseReduction ? 1 : Math.round(options.blur);
    if (blurRadius > 0) {
      gray = boxBlur(gray, targetW, targetH, blurRadius);
    }
  }

  // Histogram equalization
  if (options.enableAdaptiveEq) {
    gray = adaptiveHistogramEqualize(gray, targetW, targetH, Math.max(16, Math.min(64, targetW / 4)));
  } else if (options.enableHistogramEq) {
    gray = histogramEqualize(gray);
  }

  // Contrast stretching
  gray = contrastStretch(gray, 0.005);

  // Unsharp mask
  if (options.enableUnsharpMask || options.sharpness > 0) {
    const amount = options.enableUnsharpMask ? 1.5 : options.sharpness / 5;
    if (amount > 0) {
      gray = unsharpMask(gray, targetW, targetH, amount, 1);
    }
  }

  // Edge detection
  let edges = sobelEdges(gray, targetW, targetH);
  if (options.edgeEnhance && options.edgeEnhance > 0) {
    edges = contrastStretch(edges, 0.01);
  }

  // Invert
  if (options.invert) {
    for (let i = 0; i < gray.length; i++) {
      gray[i] = 255 - gray[i];
    }
  }

  return { gray, edges, width: targetW, height: targetH };
}

function applyColorAdjustments(data: Uint8ClampedArray, options: PreprocessOptions): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data.length);
  const { brightness, contrast, saturation, exposure, gamma, grayscale } = options;
  const contrastF = (259 * (contrast * 128 + 255)) / (255 * (259 - contrast * 128));
  const invGamma = 1 / Math.max(gamma, 0.01);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] * exposure;
    let g = data[i + 1] * exposure;
    let b = data[i + 2] * exposure;

    // Saturation
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    r = lum + (r - lum) * saturation;
    g = lum + (g - lum) * saturation;
    b = lum + (b - lum) * saturation;

    // Gamma
    r = 255 * Math.pow(Math.max(0, Math.min(255, r)) / 255, invGamma);
    g = 255 * Math.pow(Math.max(0, Math.min(255, g)) / 255, invGamma);
    b = 255 * Math.pow(Math.max(0, Math.min(255, b)) / 255, invGamma);

    // Brightness
    r += brightness;
    g += brightness;
    b += brightness;

    // Contrast
    r = contrastF * (r - 128) + 128;
    g = contrastF * (g - 128) + 128;
    b = contrastF * (b - 128) + 128;

    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    if (grayscale) {
      const gv = 0.299 * r + 0.587 * g + 0.114 * b;
      r = g = b = gv;
    }

    out[i] = r;
    out[i + 1] = g;
    out[i + 2] = b;
    out[i + 3] = 255;
  }
  return out;
}

function scaleImage(data: Uint8ClampedArray, srcW: number, srcH: number, dstW: number, dstH: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(dstW * dstH * 4);
  const blockW = srcW / dstW;
  const blockH = srcH / dstH;

  for (let dy = 0; dy < dstH; dy++) {
    for (let dx = 0; dx < dstW; dx++) {
      const sx0 = Math.floor(dx * blockW);
      const sy0 = Math.floor(dy * blockH);
      const sx1 = Math.min(srcW, Math.ceil((dx + 1) * blockW));
      const sy1 = Math.min(srcH, Math.ceil((dy + 1) * blockH));

      let rSum = 0, gSum = 0, bSum = 0;
      let count = 0;

      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const si = (sy * srcW + sx) * 4;
          rSum += data[si];
          gSum += data[si + 1];
          bSum += data[si + 2];
          count++;
        }
      }

      const di = (dy * dstW + dx) * 4;
      out[di] = rSum / count;
      out[di + 1] = gSum / count;
      out[di + 2] = bSum / count;
      out[di + 3] = 255;
    }
  }
  return out;
}
