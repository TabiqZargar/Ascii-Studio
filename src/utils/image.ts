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
