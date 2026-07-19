/**
 * Simple, high-quality ASCII conversion.
 *
 * Pipeline: Canvas resize → aspect ratio correction → block sample →
 * perceptual luminance → character mapping.
 *
 * No dithering, no shape matching, no aggressive preprocessing.
 */

const CHAR_RAMP = "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,^`' .";

self.onmessage = (e: MessageEvent) => {
  const { imageData, charset, width, adjustments } = e.data as {
    imageData: ImageData;
    charset: string;
    width: number;
    adjustments: {
      brightness: number;
      contrast: number;
      gamma: number;
      invert: boolean;
    };
  };

  const chars = charset || CHAR_RAMP;
  const { width: srcW, height: srcH, data } = imageData;

  // Aspect ratio correction: monospace chars are ~2x taller than wide.
  // Standard correction factor: 0.5 (half the height).
  const aspectCorrection = 0.5;
  const outW = width;
  const outH = Math.round((srcH / srcW) * outW * aspectCorrection);

  // Block sizes for sampling
  const blockW = srcW / outW;
  const blockH = srcH / outH;

  // Pre-compute adjustments
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

    // Compute the pixel range for this row of blocks
    const py0 = Math.floor(row * blockH);
    const py1 = Math.min(srcH, Math.ceil((row + 1) * blockH));

    for (let col = 0; col < outW; col++) {
      const px0 = Math.floor(col * blockW);
      const px1 = Math.min(srcW, Math.ceil((col + 1) * blockW));

      // Average luminance of the block
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

          // Perceptual luminance (ITU-R BT.601)
          lumSum += 0.299 * r + 0.587 * g + 0.114 * b;
          rSum += r;
          gSum += g;
          bSum += b;
          count++;
        }
      }

      let lum = lumSum / count;

      // Apply brightness
      lum += brightness;

      // Apply contrast
      lum = contrastFactor * (lum - 128) + 128;

      // Apply gamma
      if (invGamma !== 1) {
        lum = 255 * Math.pow(Math.max(0, Math.min(255, lum)) / 255, invGamma);
      }

      // Clamp
      lum = Math.max(0, Math.min(255, lum));

      // Invert for dark backgrounds
      if (invert) lum = 255 - lum;

      // Map luminance to character
      // lum 0 = darkest = first char (most dense)
      // lum 255 = brightest = last char (least dense / space)
      const charIdx = Math.floor((lum / 255) * (chars.length - 1));
      line.push(chars[Math.max(0, Math.min(charIdx, chars.length - 1))]);

      // Color from original pixels
      const r = Math.round(rSum / count);
      const g = Math.round(gSum / count);
      const b = Math.round(bSum / count);
      cLine.push(`rgb(${r},${g},${b})`);
    }

    lines.push(line.join(""));
    colorLines.push(cLine);
  }

  self.postMessage({
    output: lines.join("\n"),
    colorGrid: colorLines,
  });
};
