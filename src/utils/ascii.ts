const ASCII_CHARS = "@%#*+=-:. ";

function pixelToAscii(brightness: number): string {
  const index = Math.floor((brightness / 255) * (ASCII_CHARS.length - 1));
  return ASCII_CHARS[Math.max(0, Math.min(index, ASCII_CHARS.length - 1))];
}

export function imageDataToAscii(
  imageData: ImageData,
  density: number,
  brightness: number,
  contrast: number
): string {
  const { width, height, data } = imageData;
  const lines: string[] = [];

  const contrastFactor =
    (259 * (contrast * 128 + 255)) / (255 * (259 - contrast * 128));

  for (let y = 0; y < height; y += density) {
    let line = "";
    for (let x = 0; x < width; x += density) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      let lum = 0.299 * r + 0.587 * g + 0.114 * b;
      lum = lum + brightness;
      lum = contrastFactor * (lum - 128) + 128;
      lum = Math.max(0, Math.min(255, lum));

      line += pixelToAscii(lum);
    }
    lines.push(line);
  }

  return lines.join("\n");
}
