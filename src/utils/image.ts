export function loadImageToCanvas(
  imageUrl: string,
  canvas: HTMLCanvasElement
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No canvas context"));
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageUrl;
  });
}

export function applyTransform(
  imageData: ImageData,
  transform: { rotation: number; flipH: boolean; flipV: boolean }
): ImageData {
  const { width, height } = imageData;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = width;
  tmpCanvas.height = height;
  const tmpCtx = tmpCanvas.getContext("2d")!;
  tmpCtx.putImageData(imageData, 0, 0);

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((transform.rotation * Math.PI) / 180);
  if (transform.flipH) ctx.scale(-1, 1);
  if (transform.flipV) ctx.scale(1, -1);
  ctx.drawImage(tmpCanvas, -width / 2, -height / 2);
  ctx.restore();

  return ctx.getImageData(0, 0, width, height);
}

export function cropImage(
  imageData: ImageData,
  rect: { x: number; y: number; width: number; height: number }
): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = rect.width;
  canvas.height = rect.height;
  const ctx = canvas.getContext("2d")!;
  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = imageData.width;
  tmpCanvas.height = imageData.height;
  const tmpCtx = tmpCanvas.getContext("2d")!;
  tmpCtx.putImageData(imageData, 0, 0);
  ctx.drawImage(tmpCanvas, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
  return ctx.getImageData(0, 0, rect.width, rect.height);
}

export function downscaleImage(imageData: ImageData, maxDim: number): ImageData {
  const { width, height } = imageData;
  if (width <= maxDim && height <= maxDim) return imageData;
  const scale = maxDim / Math.max(width, height);
  const newW = Math.round(width * scale);
  const newH = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = newW;
  canvas.height = newH;
  const ctx = canvas.getContext("2d")!;
  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = width;
  tmpCanvas.height = height;
  const tmpCtx = tmpCanvas.getContext("2d")!;
  tmpCtx.putImageData(imageData, 0, 0);
  ctx.drawImage(tmpCanvas, 0, 0, newW, newH);
  return ctx.getImageData(0, 0, newW, newH);
}

export function buildAsciiFromGrid(grid: string[][], _charWidth: number, charHeight: number): string {
  const lines: string[] = [];
  for (let y = 0; y < charHeight; y++) {
    lines.push((grid[y] ?? []).join(""));
  }
  return lines.join("\n");
}

export function gridFromAscii(ascii: string, charWidth: number, charHeight: number): string[][] {
  const lines = ascii.split("\n");
  const grid: string[][] = [];
  for (let y = 0; y < charHeight; y++) {
    const line = lines[y] ?? "";
    const row: string[] = [];
    for (let x = 0; x < charWidth; x++) {
      row.push(line[x] ?? " ");
    }
    grid.push(row);
  }
  return grid;
}

export function downscaleForDisplay(imageData: ImageData, maxDim: number): ImageData {
  return downscaleImage(imageData, maxDim);
}

import type { ImageAnalysis } from "../types";

export function analyzeImage(imageData: ImageData): ImageAnalysis {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  let brightnessSum = 0;
  let contrastSum = 0;
  let edgeCount = 0;

  const gray = new Uint8ClampedArray(totalPixels);
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    gray[i / 4] = lum;
    brightnessSum += lum;
  }

  const avgBrightness = brightnessSum / totalPixels;

  for (let i = 0; i < gray.length; i++) {
    contrastSum += Math.abs(gray[i] - avgBrightness);
  }
  const avgContrast = contrastSum / totalPixels;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const gx = -gray[(idx - width - 1)] + gray[(idx - width + 1)] - 2 * gray[idx - 1] + 2 * gray[idx + 1] - gray[(idx + width - 1)] + gray[(idx + width + 1)];
      const gy = -gray[(idx - width - 1)] - 2 * gray[(idx - width)] - gray[(idx - width + 1)] + gray[(idx + width - 1)] + 2 * gray[(idx + width)] + gray[(idx + width + 1)];
      if (Math.sqrt(gx * gx + gy * gy) > 50) edgeCount++;
    }
  }

  const edgeRatio = edgeCount / totalPixels;
  let score: ImageAnalysis["score"];
  let label: string;
  let detail: string;

  if (avgContrast > 50 && avgBrightness > 40 && avgBrightness < 220) {
    score = "excellent";
    label = "Great for ASCII";
    detail = "Good contrast and brightness";
  } else if (avgContrast > 30 || (avgBrightness > 30 && avgBrightness < 230)) {
    score = "good";
    label = "Good candidate";
    detail = "May need some adjustments";
  } else {
    score = "difficult";
    label = "Needs adjustment";
    detail = "Low contrast or extreme brightness";
  }

  let suggestedPreset: string | undefined = undefined;
  if (edgeRatio > 0.15) suggestedPreset = "clean";
  else if (avgBrightness < 80) suggestedPreset = "noir";
  else if (avgBrightness > 180) suggestedPreset = "high-contrast";

  return { score, label, detail, suggestedPreset, avgBrightness, avgContrast };
}
