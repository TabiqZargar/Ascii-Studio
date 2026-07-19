self.onmessage = (e: MessageEvent) => {
  const { imageData, chars, width, height, adjustments } = e.data as {
    imageData: ImageData;
    chars: string;
    width: number;
    height: number;
    adjustments: {
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
    };
  };

  const { width: srcW, height: srcH } = imageData;
  let px = new Uint8ClampedArray(imageData.data);

  // Pre-processing: blur
  if (adjustments.blur > 0) {
    const radius = Math.round(adjustments.blur);
    const tmp = new Uint8ClampedArray(px);
    for (let y = 0; y < srcH; y++) {
      for (let x = 0; x < srcW; x++) {
        let r = 0, g = 0, b = 0, count = 0;
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const nx = Math.min(srcW - 1, Math.max(0, x + kx));
            const ny = Math.min(srcH - 1, Math.max(0, y + ky));
            const i = (ny * srcW + nx) * 4;
            r += tmp[i]; g += tmp[i + 1]; b += tmp[i + 2];
            count++;
          }
        }
        const i = (y * srcW + x) * 4;
        px[i] = r / count;
        px[i + 1] = g / count;
        px[i + 2] = b / count;
      }
    }
  }

  // Pre-processing: sharpness
  if (adjustments.sharpness > 0) {
    const tmp = new Uint8ClampedArray(px);
    const amount = adjustments.sharpness / 10;
    for (let y = 1; y < srcH - 1; y++) {
      for (let x = 1; x < srcW - 1; x++) {
        const i = (y * srcW + x) * 4;
        for (let c = 0; c < 3; c++) {
          const center = tmp[i + c] * 5;
          const n = tmp[((y - 1) * srcW + x) * 4 + c] + tmp[((y + 1) * srcW + x) * 4 + c] +
            tmp[(y * srcW + x - 1) * 4 + c] + tmp[(y * srcW + x + 1) * 4 + c];
          px[i + c] = Math.max(0, Math.min(255, tmp[i + c] + (center - n) * amount));
        }
      }
    }
  }

  const contrastF = (259 * (adjustments.contrast * 128 + 255)) / (255 * (259 - adjustments.contrast * 128));
  const gammaCorr = 1 / Math.max(adjustments.gamma, 0.01);
  const exposureMul = adjustments.exposure;

  const lines: string[] = [];
  const colorLines: string[][] = [];

  // Compute block size for sampling — aspect ratio compensation
  // Characters are ~2x taller than wide, so sample 2 pixels vertically per 1 horizontally
  const blockW = Math.max(1, Math.floor(srcW / width));
  const blockH = Math.max(1, Math.floor(srcH / height / 2)); // divide by 2 for aspect ratio

  for (let sy = 0; sy < height; sy++) {
    const line: string[] = [];
    const cLine: string[] = [];
    for (let sx = 0; sx < width; sx++) {
      // Sample the center of the block
      const sampleX = Math.min(srcW - 1, Math.round(sx * blockW + blockW / 2));
      const sampleY = Math.min(srcH - 1, Math.round(sy * blockH + blockH / 2));

      // Average a small area around the sample point for smoothing
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      const halfW = Math.floor(blockW / 2);
      const halfH = Math.floor(blockH / 2);
      for (let dy = -halfH; dy <= halfH; dy++) {
        for (let dx = -halfW; dx <= halfW; dx++) {
          const px_x = Math.min(srcW - 1, Math.max(0, sampleX + dx));
          const px_y = Math.min(srcH - 1, Math.max(0, sampleY + dy));
          const idx = (px_y * srcW + px_x) * 4;
          rSum += px[idx];
          gSum += px[idx + 1];
          bSum += px[idx + 2];
          count++;
        }
      }
      let r = rSum / count;
      let g = gSum / count;
      let b = bSum / count;

      // Exposure
      r = Math.min(255, r * exposureMul);
      g = Math.min(255, g * exposureMul);
      b = Math.min(255, b * exposureMul);

      // Saturation
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * adjustments.saturation;
      g = gray + (g - gray) * adjustments.saturation;
      b = gray + (b - gray) * adjustments.saturation;

      // Gamma
      r = 255 * Math.pow(Math.max(0, Math.min(255, r)) / 255, gammaCorr);
      g = 255 * Math.pow(Math.max(0, Math.min(255, g)) / 255, gammaCorr);
      b = 255 * Math.pow(Math.max(0, Math.min(255, b)) / 255, gammaCorr);

      // Brightness
      r += adjustments.brightness;
      g += adjustments.brightness;
      b += adjustments.brightness;

      // Contrast
      r = contrastF * (r - 128) + 128;
      g = contrastF * (g - 128) + 128;
      b = contrastF * (b - 128) + 128;

      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));

      let finalR = r, finalG = g, finalB = b;

      if (adjustments.grayscale) {
        const gv = 0.299 * r + 0.587 * g + 0.114 * b;
        finalR = finalG = finalB = gv;
      }

      if (adjustments.edgeDetection) {
        let edgeVal = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const nx = Math.min(srcW - 1, Math.max(0, sampleX + kx));
            const ny = Math.min(srcH - 1, Math.max(0, sampleY + ky));
            const gx = (ky + 1) * 3 + (kx + 1);
            const gy = (kx + 1) * 3 + (ky + 1);
            const npx = (ny * srcW + nx) * 4;
            const l = 0.299 * px[npx] + 0.587 * px[npx + 1] + 0.114 * px[npx + 2];
            edgeVal += l * (gx - gy);
          }
        }
        const ev = Math.min(255, Math.abs(edgeVal));
        finalR = finalG = finalB = ev;
      }

      if (adjustments.invert) {
        finalR = 255 - finalR;
        finalG = 255 - finalG;
        finalB = 255 - finalB;
      }

      const lum = 0.299 * finalR + 0.587 * finalG + 0.114 * finalB;
      const charIdx = Math.floor((lum / 255) * (chars.length - 1));
      line.push(chars[Math.max(0, Math.min(charIdx, chars.length - 1))]);
      cLine.push(
        `rgb(${Math.round(Math.max(0, Math.min(255, finalR)))},${Math.round(Math.max(0, Math.min(255, finalG)))},${Math.round(Math.max(0, Math.min(255, finalB)))})`
      );
    }
    lines.push(line.join(""));
    colorLines.push(cLine);
  }

  self.postMessage({ output: lines.join("\n"), colorGrid: colorLines });
};
