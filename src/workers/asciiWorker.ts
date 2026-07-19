/**
 * Simple, high-quality ASCII conversion.
 *
 * Pipeline: Canvas resize → aspect ratio correction → block sample →
 * perceptual luminance → character mapping.
 *
 * No dithering, no shape matching, no aggressive preprocessing.
 */

const CHAR_RAMP = "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,^`' .";

function convertFrame(
  imageData: ImageData,
  charset: string,
  width: number,
  adjustments: { brightness: number; contrast: number; gamma: number; invert: boolean }
): { output: string; colorGrid: string[][] } {
  const chars = charset || CHAR_RAMP;
  const { width: srcW, height: srcH, data } = imageData;
  const aspectCorrection = 0.5;
  const outW = width;
  const outH = Math.round((srcH / srcW) * outW * aspectCorrection);
  const blockW = srcW / outW;
  const blockH = srcH / outH;
  const brightness = adjustments.brightness;
  const contrast = adjustments.contrast;
  const contrastFactor = (259 * (contrast * 128 + 255)) / (255 * (259 - contrast * 128));
  const gamma = adjustments.gamma;
  const invGamma = gamma !== 1 ? 1 / gamma : 1;
  const invert = adjustments.invert;
  const lines: string[] = [];
  const colorLines: string[][] = [];

  for (let row = 0; row < outH; row++) {
    const line: string[] = [];
    const cLine: string[] = [];
    const py0 = Math.floor(row * blockH);
    const py1 = Math.min(srcH, Math.ceil((row + 1) * blockH));
    for (let col = 0; col < outW; col++) {
      const px0 = Math.floor(col * blockW);
      const px1 = Math.min(srcW, Math.ceil((col + 1) * blockW));
      let lumSum = 0;
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let count = 0;
      for (let py = py0; py < py1; py++) {
        for (let px = px0; px < px1; px++) {
          const idx = (py * srcW + px) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          lumSum += 0.299 * r + 0.587 * g + 0.114 * b;
          rSum += r;
          gSum += g;
          bSum += b;
          count++;
        }
      }
      let lum = lumSum / count;
      lum += brightness;
      lum = contrastFactor * (lum - 128) + 128;
      if (invGamma !== 1) {
        lum = 255 * Math.pow(Math.max(0, Math.min(255, lum)) / 255, invGamma);
      }
      lum = Math.max(0, Math.min(255, lum));
      if (invert) lum = 255 - lum;
      const charIdx = Math.floor((lum / 255) * (chars.length - 1));
      line.push(chars[Math.max(0, Math.min(charIdx, chars.length - 1))]);
      const r = Math.round(rSum / count);
      const g = Math.round(gSum / count);
      const b = Math.round(bSum / count);
      cLine.push(`rgb(${r},${g},${b})`);
    }
    lines.push(line.join(""));
    colorLines.push(cLine);
  }
  return { output: lines.join("\n"), colorGrid: colorLines };
}

self.onmessage = (e: MessageEvent) => {
  const msg = e.data;

  if (msg.type === "batch") {
    const { frames, charset, width, adjustments } = msg as {
      frames: ImageData[];
      charset: string;
      width: number;
      adjustments: { brightness: number; contrast: number; gamma: number; invert: boolean };
    };
    const results: { output: string; colorGrid: string[][] }[] = [];
    for (let i = 0; i < frames.length; i++) {
      results.push(convertFrame(frames[i], charset, width, adjustments));
      self.postMessage({ type: "progress", current: i + 1, total: frames.length });
    }
    self.postMessage({ type: "batch-done", results });
    return;
  }

  const { imageData, charset, width, adjustments } = msg as {
    imageData: ImageData;
    charset: string;
    width: number;
    adjustments: { brightness: number; contrast: number; gamma: number; invert: boolean };
  };

  self.postMessage(convertFrame(imageData, charset, width, adjustments));
};
