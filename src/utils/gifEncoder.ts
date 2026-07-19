/**
 * Pure-JS GIF89a encoder.
 * Encodes an array of ImageData frames into an animated GIF Blob.
 */

interface GifFrameInput {
  imageData: ImageData;
  delayMs: number;
}

function quantize(data: Uint8ClampedArray, pixelCount: number, maxColors: number): { palette: [number, number, number][]; indexedPixels: Uint8Array } {
  const colorCounts = new Map<number, number>();

  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const key = (r << 16) | (g << 8) | b;
    colorCounts.set(key, (colorCounts.get(key) ?? 0) + 1);
  }

  const sorted = [...colorCounts.entries()].sort((a, b) => b[1] - a[1]);
  const paletteSize = Math.min(maxColors, sorted.length);
  const palette: [number, number, number][] = [];
  const paletteLookup = new Map<number, number>();

  for (let i = 0; i < paletteSize; i++) {
    const key = sorted[i][0];
    const r = (key >> 16) & 0xff;
    const g = (key >> 8) & 0xff;
    const b = key & 0xff;
    palette.push([r, g, b]);
    paletteLookup.set(key, i);
  }

  // Fill remaining palette slots with black
  while (palette.length < maxColors) {
    palette.push([0, 0, 0]);
  }

  const indexedPixels = new Uint8Array(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const a = data[i * 4 + 3];
    const key = a === 0 ? (0 << 16) | (0 << 8) | 0 : (r << 16) | (g << 8) | b;
    indexedPixels[i] = paletteLookup.get(key) ?? findNearest(r, g, b, palette);
  }

  return { palette, indexedPixels };
}

function findNearest(r: number, g: number, b: number, palette: [number, number, number][]): number {
  let bestDist = Infinity;
  let bestIdx = 0;
  for (let i = 0; i < palette.length; i++) {
    const [pr, pg, pb] = palette[i];
    const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
    if (d < bestDist) { bestDist = d; bestIdx = i; }
  }
  return bestIdx;
}

function lzwEncode(minCodeSize: number, pixels: Uint8Array): Uint8Array {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;

  const codeTable = new Map<string, number>();
  for (let i = 0; i < clearCode; i++) {
    codeTable.set(String.fromCharCode(i), i);
  }

  let nextCode = eoiCode + 1;
  let codeSize = minCodeSize + 1;

  const output: number[] = [];
  let bits = 0;
  let bitsUsed = 0;

  function writeCode(code: number) {
    bits |= code << bitsUsed;
    bitsUsed += codeSize;
    while (bitsUsed >= 8) {
      output.push(bits & 0xff);
      bits >>= 8;
      bitsUsed -= 8;
    }
  }

  writeCode(clearCode);

  let current = String.fromCharCode(pixels[0]);
  for (let i = 1; i < pixels.length; i++) {
    const next = String.fromCharCode(pixels[i]);
    const combined = current + next;
    if (codeTable.has(combined)) {
      current = combined;
    } else {
      writeCode(codeTable.get(current)!);
      if (nextCode < 4096) {
        codeTable.set(combined, nextCode++);
        if (nextCode > (1 << codeSize) && codeSize < 12) {
          codeSize++;
        }
      } else {
        writeCode(clearCode);
        codeTable.clear();
        for (let j = 0; j < clearCode; j++) {
          codeTable.set(String.fromCharCode(j), j);
        }
        nextCode = eoiCode + 1;
        codeSize = minCodeSize + 1;
      }
      current = next;
    }
  }

  writeCode(codeTable.get(current)!);
  writeCode(eoiCode);

  if (bitsUsed > 0) {
    output.push(bits & 0xff);
  }

  return new Uint8Array(output);
}

function writeUint16(arr: number[], value: number) {
  arr.push(value & 0xff, (value >> 8) & 0xff);
}

export function encodeGif(frames: GifFrameInput[], loop = true): Blob {
  const bytes: number[] = [];

  // GIF Header
  bytes.push(0x47, 0x49, 0x46); // GIF
  bytes.push(0x38, 0x39, 0x61); // 89a

  const width = frames[0].imageData.width;
  const height = frames[0].imageData.height;

  // Logical Screen Descriptor
  writeUint16(bytes, width);
  writeUint16(bytes, height);
  bytes.push(0xf7); // GCT flag, 256 colors, 8 bits
  bytes.push(0x00); // bg color index
  bytes.push(0x00); // pixel aspect ratio

  // Build global palette from first frame (256 colors)
  const { palette: globalPalette } = quantize(frames[0].imageData.data, width * height, 256);

  // Global Color Table
  for (const [r, g, b] of globalPalette) {
    bytes.push(r, g, b);
  }

  // Netscape extension for looping
  if (loop) {
    bytes.push(0x21, 0xff, 0x0b);
    const netscape = [0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30]; // NETSCAPE2.0
    bytes.push(...netscape);
    bytes.push(0x03, 0x01);
    writeUint16(bytes, 0); // loop forever
    bytes.push(0x00);
  }

  for (const frame of frames) {
    const frameData = frame.imageData;

    // Find best matching palette index for each pixel using global palette
    const globalIndexed = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const r = frameData.data[i * 4];
      const g = frameData.data[i * 4 + 1];
      const b = frameData.data[i * 4 + 2];
      globalIndexed[i] = findNearest(r, g, b, globalPalette);
    }

    // Graphic Control Extension
    bytes.push(0x21, 0xf9, 0x04);
    bytes.push(0x00); // disposal: none, no transparency
    const delayCentiseconds = Math.max(2, Math.round(frame.delayMs / 10));
    writeUint16(bytes, delayCentiseconds);
    bytes.push(0x00); // transparent color index
    bytes.push(0x00); // block terminator

    // Image Descriptor
    bytes.push(0x2c);
    writeUint16(bytes, 0); // left
    writeUint16(bytes, 0); // top
    writeUint16(bytes, width);
    writeUint16(bytes, height);
    bytes.push(0x00); // no local color table

    // LZW compressed image data
    const minCodeSize = 8;
    bytes.push(minCodeSize);
    const compressed = lzwEncode(minCodeSize, globalIndexed);

    // Write sub-blocks
    let pos = 0;
    while (pos < compressed.length) {
      const blockSize = Math.min(255, compressed.length - pos);
      bytes.push(blockSize);
      for (let i = 0; i < blockSize; i++) {
        bytes.push(compressed[pos++]);
      }
    }
    bytes.push(0x00); // block terminator
  }

  // GIF Trailer
  bytes.push(0x3b);

  return new Blob([new Uint8Array(bytes)], { type: "image/gif" });
}
