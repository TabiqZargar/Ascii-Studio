/**
 * Intelligent subject detection for automatic ASCII optimization.
 *
 * Analyzes image characteristics to determine content type
 * and recommend optimal conversion parameters.
 */

export type SubjectType =
  | "portrait"
  | "landscape"
  | "architecture"
  | "logo"
  | "illustration"
  | "screenshot"
  | "text"
  | "anime"
  | "unknown";

export interface SubjectAnalysis {
  type: SubjectType;
  confidence: number;
  features: {
    edgeDensity: number;
    colorVariance: number;
    brightnessMean: number;
    brightnessStd: number;
    symmetryH: number;
    symmetryV: number;
    textureComplexity: number;
    faceRegions: number;
    textRegions: number;
    contrastRatio: number;
  };
  recommendedPreset: string;
  recommendedSettings: {
    charSet: string;
    dithering: string;
    edgeEnhance: number;
    contrast: number;
    brightness: number;
    sharpness: number;
  };
}

/** Analyze an image and determine its subject type */
export function analyzeSubject(imageData: ImageData): SubjectAnalysis {
  const { data, width, height } = imageData;
  const gray = new Float32Array(width * height);
  const edges = new Float32Array(width * height);

  // Convert to grayscale
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  // Compute features
  const features = extractFeatures(gray, data, width, height);

  // Compute edges for edge density
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const gx =
        -gray[(y - 1) * width + (x - 1)] + gray[(y - 1) * width + (x + 1)] +
        -2 * gray[y * width + (x - 1)] + 2 * gray[y * width + (x + 1)] +
        -gray[(y + 1) * width + (x - 1)] + gray[(y + 1) * width + (x + 1)];
      const gy =
        -gray[(y - 1) * width + (x - 1)] - 2 * gray[(y - 1) * width + x] - gray[(y - 1) * width + (x + 1)] +
        gray[(y + 1) * width + (x - 1)] + 2 * gray[(y + 1) * width + x] + gray[(y + 1) * width + (x + 1)];
      edges[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  // Edge density
  let edgeSum = 0;
  for (let i = 0; i < edges.length; i++) edgeSum += edges[i];
  features.edgeDensity = edgeSum / (edges.length * 255);

  // Detect subject type
  const { type, confidence } = classifySubject(features, width, height);

  // Get recommendations
  const recommendedPreset = getPresetForSubject(type);
  const recommendedSettings = getSettingsForSubject(type, features);

  return {
    type,
    confidence,
    features,
    recommendedPreset,
    recommendedSettings,
  };
}

interface Features {
  edgeDensity: number;
  colorVariance: number;
  brightnessMean: number;
  brightnessStd: number;
  symmetryH: number;
  symmetryV: number;
  textureComplexity: number;
  faceRegions: number;
  textRegions: number;
  contrastRatio: number;
}

function extractFeatures(gray: Float32Array, data: Uint8ClampedArray, w: number, h: number): Features {
  const n = w * h;

  // Brightness statistics
  let sum = 0;
  let sumSq = 0;
  let min = 255;
  let max = 0;
  for (let i = 0; i < n; i++) {
    sum += gray[i];
    sumSq += gray[i] * gray[i];
    if (gray[i] < min) min = gray[i];
    if (gray[i] > max) max = gray[i];
  }
  const mean = sum / n;
  const variance = sumSq / n - mean * mean;
  const std = Math.sqrt(Math.max(0, variance));

  // Color variance
  let rSum = 0, gSum = 0, bSum = 0;
  let rSq = 0, gSq = 0, bSq = 0;
  for (let i = 0; i < n; i++) {
    const idx = i * 4;
    rSum += data[idx]; rSq += data[idx] * data[idx];
    gSum += data[idx + 1]; gSq += data[idx + 1] * data[idx + 1];
    bSum += data[idx + 2]; bSq += data[idx + 2] * data[idx + 2];
  }
  const rVar = rSq / n - (rSum / n) ** 2;
  const gVar = gSq / n - (gSum / n) ** 2;
  const bVar = bSq / n - (bSum / n) ** 2;
  const colorVariance = Math.sqrt(Math.max(0, rVar + gVar + bVar)) / 255;

  // Horizontal symmetry
  let symH = 0;
  const halfW = Math.floor(w / 2);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < halfW; x++) {
      symH += Math.abs(gray[y * w + x] - gray[y * w + (w - 1 - x)]);
    }
  }
  symH = 1 - symH / (n * 0.5 * 255);

  // Vertical symmetry
  let symV = 0;
  const halfH = Math.floor(h / 2);
  for (let y = 0; y < halfH; y++) {
    for (let x = 0; x < w; x++) {
      symV += Math.abs(gray[y * w + x] - gray[(h - 1 - y) * w + x]);
    }
  }
  symV = 1 - symV / (n * 0.5 * 255);

  // Texture complexity (local variance)
  let textureSum = 0;
  const blockSize = Math.max(4, Math.floor(Math.min(w, h) / 20));
  let blockCount = 0;
  for (let by = 0; by < h; by += blockSize) {
    for (let bx = 0; bx < w; bx += blockSize) {
      let localSum = 0;
      let localSumSq = 0;
      let localCount = 0;
      for (let dy = 0; dy < blockSize && by + dy < h; dy++) {
        for (let dx = 0; dx < blockSize && bx + dx < w; dx++) {
          const v = gray[(by + dy) * w + (bx + dx)];
          localSum += v;
          localSumSq += v * v;
          localCount++;
        }
      }
      if (localCount > 0) {
        const localMean = localSum / localCount;
        textureSum += localSumSq / localCount - localMean * localMean;
        blockCount++;
      }
    }
  }
  const textureComplexity = Math.sqrt(Math.max(0, textureSum / Math.max(1, blockCount))) / 255;

  // Simple face detection heuristic (skin color ratio in upper half)
  let skinPixels = 0;
  const upperH = Math.floor(h * 0.6);
  for (let y = 0; y < upperH; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      if (r > 95 && g > 40 && b > 20 &&
          r > g && r > b &&
          Math.abs(r - g) > 15 &&
          r - Math.min(g, b) > 15) {
        skinPixels++;
      }
    }
  }
  const faceRegions = skinPixels / (upperH * w);

  // Text detection heuristic (high horizontal edge density)
  let hEdgeSum = 0;
  let vEdgeSum = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const hDiff = Math.abs(gray[y * w + (x - 1)] - gray[y * w + (x + 1)]);
      const vDiff = Math.abs(gray[(y - 1) * w + x] - gray[(y + 1) * w + x]);
      hEdgeSum += hDiff;
      vEdgeSum += vDiff;
    }
  }
  const textRegions = hEdgeSum > vEdgeSum * 1.5 ? (hEdgeSum - vEdgeSum) / (hEdgeSum + vEdgeSum + 1) : 0;

  return {
    edgeDensity: 0,
    colorVariance,
    brightnessMean: mean,
    brightnessStd: std,
    symmetryH: symH,
    symmetryV: symV,
    textureComplexity,
    faceRegions,
    textRegions,
    contrastRatio: max > 0 ? (max - min) / max : 0,
  };
}

function classifySubject(features: Features, w: number, h: number): { type: SubjectType; confidence: number } {
  const scores: Record<SubjectType, number> = {
    portrait: 0,
    landscape: 0,
    architecture: 0,
    logo: 0,
    illustration: 0,
    screenshot: 0,
    text: 0,
    anime: 0,
    unknown: 0,
  };

  const aspectRatio = w / h;

  // Portrait indicators: face-like skin regions, vertical aspect
  if (features.faceRegions > 0.05) scores.portrait += 0.4;
  if (features.faceRegions > 0.15) scores.portrait += 0.3;
  if (aspectRatio < 0.8) scores.portrait += 0.15;
  if (features.textureComplexity > 0.1 && features.textureComplexity < 0.3) scores.portrait += 0.1;

  // Landscape indicators: horizontal aspect, low texture complexity, high color variance
  if (aspectRatio > 1.3) scores.landscape += 0.3;
  if (features.textureComplexity < 0.15) scores.landscape += 0.15;
  if (features.colorVariance > 0.2) scores.landscape += 0.15;
  if (features.brightnessMean > 100 && features.brightnessMean < 200) scores.landscape += 0.1;

  // Architecture: high edge density, high symmetry
  if (features.edgeDensity > 0.15) scores.architecture += 0.25;
  if (features.symmetryH > 0.7) scores.architecture += 0.2;
  if (features.symmetryV > 0.6) scores.architecture += 0.15;
  if (features.textureComplexity > 0.2) scores.architecture += 0.1;

  // Logo: very high symmetry, limited color palette
  if (features.symmetryH > 0.8 && features.symmetryV > 0.8) scores.logo += 0.4;
  if (features.colorVariance < 0.15) scores.logo += 0.2;
  if (features.edgeDensity > 0.1) scores.logo += 0.1;

  // Text: high horizontal edge density
  if (features.textRegions > 0.1) scores.text += 0.4;
  if (features.textRegions > 0.3) scores.text += 0.3;
  if (features.symmetryH > 0.6) scores.text += 0.1;

  // Screenshot: very high brightness, low texture
  if (features.brightnessMean > 180) scores.screenshot += 0.3;
  if (features.textureComplexity < 0.1) scores.screenshot += 0.2;
  if (features.contrastRatio > 0.7) scores.screenshot += 0.15;

  // Illustration: medium color variance, medium edges
  if (features.colorVariance > 0.25 && features.colorVariance < 0.5) scores.illustration += 0.2;
  if (features.textureComplexity > 0.15 && features.textureComplexity < 0.35) scores.illustration += 0.15;

  // Find best
  let bestType: SubjectType = "unknown";
  let bestScore = 0;
  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestType = type as SubjectType;
    }
  }

  const confidence = Math.min(1, bestScore);
  return { type: bestScore > 0.1 ? bestType : "unknown", confidence };
}

function getPresetForSubject(type: SubjectType): string {
  const presetMap: Record<SubjectType, string> = {
    portrait: "portrait",
    landscape: "landscape",
    architecture: "clean",
    logo: "high-contrast",
    illustration: "clean",
    screenshot: "terminal",
    text: "terminal",
    anime: "portrait",
    unknown: "clean",
  };
  return presetMap[type] ?? "clean";
}

function getSettingsForSubject(type: SubjectType, features: Features): SubjectAnalysis["recommendedSettings"] {
  const base = {
    charSet: "classic",
    dithering: "floyd-steinberg",
    edgeEnhance: 1.5,
    contrast: 1.2,
    brightness: 0,
    sharpness: 1,
  };

  switch (type) {
    case "portrait":
      return {
        ...base,
        charSet: "dense",
        dithering: "floyd-steinberg",
        edgeEnhance: 1.0,
        contrast: 1.15,
        brightness: features.brightnessMean < 100 ? 15 : 0,
        sharpness: 0.8,
      };
    case "landscape":
      return {
        ...base,
        charSet: "dense",
        edgeEnhance: 1.2,
        contrast: 1.1,
        sharpness: 0.5,
      };
    case "architecture":
      return {
        ...base,
        charSet: "classic",
        edgeEnhance: 2.0,
        contrast: 1.3,
        sharpness: 1.5,
      };
    case "logo":
      return {
        ...base,
        charSet: "classic",
        dithering: "none",
        edgeEnhance: 2.5,
        contrast: 1.5,
        sharpness: 2.0,
      };
    case "text":
      return {
        ...base,
        charSet: "classic",
        dithering: "none",
        edgeEnhance: 2.0,
        contrast: 1.4,
        sharpness: 1.5,
      };
    case "screenshot":
      return {
        ...base,
        charSet: "classic",
        dithering: "none",
        edgeEnhance: 1.0,
        contrast: 1.1,
        sharpness: 0.5,
      };
    default:
      return base;
  }
}
