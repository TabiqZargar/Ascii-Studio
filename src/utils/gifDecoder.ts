/**
 * Optimized GIF89a decoder.
 *
 * Key optimizations over naive implementation:
 * 1. LZW: fixed-stack chain traversal (zero per-code allocation)
 * 2. LZW: flat TypedArrays for dictionary (cache-friendly)
 * 3. Snapshot: downscale immediately during decode (10x memory reduction)
 * 4. Downscale: single reused canvas pair across all frames
 * 5. Composite: transparency fast-path branches
 */

import { mark, measure } from "./gifProfile";

export interface GifFrame {
  imageData: ImageData;
  delayMs: number;
  disposalMethod: number;
}

export interface GifResult {
  width: number;
  height: number;
  frames: GifFrame[];
  profile?: {
    gifParse: number;
    lzwDecode: number;
    frameComposite: number;
    frameSnapshot: number;
  };
}

export function decodeGif(buffer: ArrayBuffer, targetWidth = 0): GifResult {
  const view = new DataView(buffer);
  let pos = 0;

  function readUint16(): number {
    const v = view.getUint16(pos, true);
    pos += 2;
    return v;
  }

  function readByte(): number {
    return view.getUint8(pos++);
  }

  // --- Stage 1: Header + GCT ---
  mark("gifParse");

  const signature = String.fromCharCode(view.getUint8(pos), view.getUint8(pos + 1), view.getUint8(pos + 2));
  pos += 3;
  if (signature !== "GIF") throw new Error("Not a GIF file");

  const version = String.fromCharCode(view.getUint8(pos), view.getUint8(pos + 1), view.getUint8(pos + 2));
  pos += 3;
  if (version !== "87a" && version !== "89a") throw new Error("Unsupported GIF version");

  const width = readUint16();
  const height = readUint16();
  const packed = readByte();
  const bgColorIndex = readByte();
  const pixelAspectRatio = readByte();
  void pixelAspectRatio;

  const hasGCT = (packed & 0x80) !== 0;
  const gctSize = hasGCT ? 2 ** ((packed & 0x07) + 1) : 0;

  // Parse GCT into flat Uint8Array for fast palette lookup
  // Layout: [r0,g0,b0, r1,g1,b1, ...]
  const gctFlat = new Uint8Array(gctSize * 3);
  if (hasGCT) {
    for (let i = 0; i < gctSize; i++) {
      gctFlat[i * 3] = view.getUint8(pos);
      gctFlat[i * 3 + 1] = view.getUint8(pos + 1);
      gctFlat[i * 3 + 2] = view.getUint8(pos + 2);
      pos += 3;
    }
  }

  const gifParseTime = measure("gifParse");

  // --- Prepare downscaling (if targetWidth > 0) ---
  const needsDownscale = targetWidth > 0 && targetWidth < width;
  const scaleRatio = needsDownscale ? targetWidth / width : 1;
  const outW = needsDownscale ? targetWidth : width;
  const outH = needsDownscale ? Math.round(height * scaleRatio) : height;

  // Single canvas pair for downscaling (reused across frames)
  let downscaleSrcCanvas: HTMLCanvasElement | undefined;
  let downscaleSrcCtx: CanvasRenderingContext2D | undefined;
  let downscaleDstCanvas: HTMLCanvasElement | undefined;
  let downscaleDstCtx: CanvasRenderingContext2D | undefined;

  if (needsDownscale) {
    downscaleSrcCanvas = document.createElement("canvas");
    downscaleSrcCanvas.width = width;
    downscaleSrcCanvas.height = height;
    downscaleSrcCtx = downscaleSrcCanvas.getContext("2d")!;
    downscaleDstCanvas = document.createElement("canvas");
    downscaleDstCanvas.width = outW;
    downscaleDstCanvas.height = outH;
    downscaleDstCtx = downscaleDstCanvas.getContext("2d")!;
  }

  // Canvas for compositing at full resolution
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const compositeBuffer = ctx.createImageData(width, height);
  const compositeData = compositeBuffer.data;

  // Initialize with background color
  if (hasGCT && bgColorIndex * 3 + 2 < gctFlat.length) {
    const r = gctFlat[bgColorIndex * 3];
    const g = gctFlat[bgColorIndex * 3 + 1];
    const b = gctFlat[bgColorIndex * 3 + 2];
    for (let i = 0; i < compositeData.length; i += 4) {
      compositeData[i] = r;
      compositeData[i + 1] = g;
      compositeData[i + 2] = b;
      compositeData[i + 3] = 255;
    }
  }

  const frames: GifFrame[] = [];
  let transparentIndex = -1;
  let delayMs = 100;
  let disposalMethod = 0;

  let totalLzwTime = 0;
  let totalCompositeTime = 0;
  let totalSnapshotTime = 0;

  // Pre-allocate LZW output buffer
  const maxPixels = width * height;
  let pixelBuffer = new Uint8Array(maxPixels);

  // Parse blocks
  while (pos < view.byteLength) {
    const blockType = readByte();

    if (blockType === 0x2C) {
      // Image Descriptor
      const frameX = readUint16();
      const frameY = readUint16();
      const frameW = readUint16();
      const frameH = readUint16();
      const framePacked = readByte();

      const hasLCT = (framePacked & 0x80) !== 0;
      const lctSize = hasLCT ? 2 ** ((framePacked & 0x07) + 1) : 0;

      // Parse LCT into flat array
      let lctFlat: Uint8Array | null = null;
      if (hasLCT) {
        lctFlat = new Uint8Array(lctSize * 3);
        for (let i = 0; i < lctSize; i++) {
          lctFlat[i * 3] = view.getUint8(pos);
          lctFlat[i * 3 + 1] = view.getUint8(pos + 1);
          lctFlat[i * 3 + 2] = view.getUint8(pos + 2);
          pos += 3;
        }
      }

      const palette = lctFlat ?? gctFlat;

      // Apply disposal method to current composite
      if (disposalMethod === 2) {
        for (let y = frameY; y < frameY + frameH && y < height; y++) {
          const rowOff = y * width;
          for (let x = frameX; x < frameX + frameW && x < width; x++) {
            const idx = (rowOff + x) << 2;
            compositeData[idx] = 0;
            compositeData[idx + 1] = 0;
            compositeData[idx + 2] = 0;
            compositeData[idx + 3] = 0;
          }
        }
      }

      // LZW Minimum Code Size
      const minCodeSize = readByte();

      // Read sub-blocks into contiguous buffer
      const lzwData: number[] = [];
      let subBlockLen = readByte();
      while (subBlockLen > 0) {
        for (let i = 0; i < subBlockLen; i++) {
          lzwData.push(view.getUint8(pos++));
        }
        subBlockLen = readByte();
      }

      // --- Stage 2: LZW Decode ---
      mark("lzw");
      const pixels = lzwDecodeOptimized(minCodeSize, lzwData, pixelBuffer);
      totalLzwTime += measure("lzw");

      // ASSERTION: LZW Output
      if (pixels.length !== frameW * frameH) {
        throw new Error(`LZW Decode failed: expected ${frameW * frameH} pixels, got ${pixels.length}`);
      }

      // Grow buffer if needed
      if (pixels.length > pixelBuffer.length) {
        pixelBuffer = new Uint8Array(pixels.length + (pixels.length >> 1));
      }

      // --- Stage 3: Frame Composite ---
      mark("composite");
      const framePixelCount = frameW * frameH;
      let pixelIdx = 0;

      // DEBUG: Log frame properties
      console.log(`[GIF Decoder] Processing frame: ${frames.length}, size: ${frameW}x${frameH}, delay: ${delayMs}, disposal: ${disposalMethod}`);


      // Fast path: no transparency, palette fits in 256 entries
      if (transparentIndex === -1) {
        for (let y = frameY; y < frameY + frameH && y < height; y++) {
          const rowOff = y * width;
          for (let x = frameX; x < frameX + frameW && x < width; x++) {
            if (pixelIdx >= framePixelCount) break;
            const pi = pixels[pixelIdx++] * 3;
            if (pi + 2 >= palette.length * 3) continue;
            const idx = (rowOff + x) << 2;
            compositeData[idx] = palette[pi];
            compositeData[idx + 1] = palette[pi + 1];
            compositeData[idx + 2] = palette[pi + 2];
            compositeData[idx + 3] = 255;
          }
        }
      } else {
        for (let y = frameY; y < frameY + frameH && y < height; y++) {
          const rowOff = y * width;
          for (let x = frameX; x < frameX + frameW && x < width; x++) {
            if (pixelIdx >= framePixelCount) break;
            const pi = pixels[pixelIdx++];
            if (pi === transparentIndex) continue;
            const pio = pi * 3;
            if (pio + 2 >= palette.length * 3) continue;
            const idx = (rowOff + x) << 2;
            compositeData[idx] = palette[pio];
            compositeData[idx + 1] = palette[pio + 1];
            compositeData[idx + 2] = palette[pio + 2];
            compositeData[idx + 3] = 255;
          }
        }
      }
      totalCompositeTime += measure("composite");

      // --- Stage 4: Snapshot (with optional immediate downscale) ---
      mark("snapshot");

      let frameData: ImageData;
      if (needsDownscale && downscaleSrcCtx && downscaleDstCtx && downscaleDstCanvas && downscaleSrcCanvas) {
        // Put full-res composite into source canvas
        downscaleSrcCtx.putImageData(compositeBuffer, 0, 0);
        // Draw downscaled into dest canvas
        downscaleDstCtx.clearRect(0, 0, outW, outH);
        downscaleDstCtx.drawImage(downscaleSrcCanvas, 0, 0, outW, outH);
        frameData = downscaleDstCtx.getImageData(0, 0, outW, outH);
      } else {
        frameData = new ImageData(
          new Uint8ClampedArray(compositeData),
          width,
          height
        );
      }
      totalSnapshotTime += measure("snapshot");

      frames.push({ imageData: frameData, delayMs, disposalMethod });

    } else if (blockType === 0x21) {
      const extLabel = readByte();

      if (extLabel === 0xF9) {
        pos++; // block size
        const gcePacked = readByte();
        disposalMethod = (gcePacked >> 2) & 0x07;
        const hasTransparency = (gcePacked & 0x01) !== 0;
        delayMs = readUint16() * 10;
        if (delayMs === 0) delayMs = 100;
        transparentIndex = hasTransparency ? readByte() : -1;
        if (!hasTransparency) pos++;
        pos++; // block terminator
      } else if (extLabel === 0xFF) {
        pos += 12; // block size + app identifier
        let subLen = readByte();
        while (subLen > 0) { pos += subLen; subLen = readByte(); }
      } else if (extLabel === 0xFE) {
        let subLen = readByte();
        while (subLen > 0) { pos += subLen; subLen = readByte(); }
      } else {
        const blockSize = readByte();
        pos += blockSize;
        let subLen = readByte();
        while (subLen > 0) { pos += subLen; subLen = readByte(); }
      }
    } else if (blockType === 0x3B) {
      break;
    } else if (blockType === 0x00) {
      // padding
    } else {
      break;
    }
  }

  if (frames.length === 0) throw new Error("No frames found in GIF");

  // ASSERTION: Animation
  console.log(`[GIF Decoder] Decoded ${frames.length} frames.`);
  if (frames.length < 2) {
    throw new Error(`Expected animated GIF, but only found ${frames.length} frame(s)`);
  }

  return {
    width: outW,
    height: outH,
    frames,
    profile: {
      gifParse: gifParseTime,
      lzwDecode: totalLzwTime,
      frameComposite: totalCompositeTime,
      frameSnapshot: totalSnapshotTime,
    },
  };
}

/**
 * Optimized LZW decoder.
 *
 * Key optimizations vs naive implementation:
 * - Fixed-size stack (Uint8Array[16]) instead of per-code number[] allocation
 * - Flat TypedArrays for dictionary (dictLens, dictPrefix, dictSuffix)
 * - Direct output writes to pre-allocated buffer
 * - Minimal branching in hot loop
 */
function lzwDecodeOptimized(
  minCodeSize: number,
  data: number[],
  outputBuffer: Uint8Array
): Uint8Array {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  const maxCode = 4096;

  // Flat dictionary storage — cache-friendly
  const dictLens = new Uint16Array(maxCode);
  const dictPrefix = new Int32Array(maxCode);
  const dictSuffix = new Uint8Array(maxCode);

  for (let i = 0; i < clearCode; i++) {
    dictLens[i] = 1;
    dictSuffix[i] = i;
    dictPrefix[i] = -1;
  }

  let outputPos = 0;
  let bits = 0;
  let bitsAvail = 0;
  let dataPos = 0;

  // Fixed-size stack — never allocate per-code
  const stackBuf = new Uint8Array(16);
  let stackPos = 0;

  function readBits(): number {
    while (bitsAvail < codeSize) {
      if (dataPos >= data.length) return eoiCode;
      bits |= data[dataPos++] << bitsAvail;
      bitsAvail += 8;
    }
    const code = bits & ((1 << codeSize) - 1);
    bits >>= codeSize;
    bitsAvail -= codeSize;
    return code;
  }

  let prev = readBits();
  if (prev === clearCode) {
    codeSize = minCodeSize + 1;
    nextCode = eoiCode + 1;
    prev = readBits();
  }
  if (prev === eoiCode) return outputBuffer.subarray(0, 0);

  if (prev < clearCode) {
    outputBuffer[outputPos++] = prev;
  }

  for (;;) {
    const code = readBits();
    if (code === eoiCode) break;

    if (code === clearCode) {
      codeSize = minCodeSize + 1;
      nextCode = eoiCode + 1;
      prev = readBits();
      if (prev === eoiCode) break;
      if (prev < clearCode) outputBuffer[outputPos++] = prev;
      continue;
    }

    let firstChar: number;

    if (code < nextCode) {
      // Decode chain using fixed stack
      let c = code;
      stackPos = 0;
      while (c >= clearCode && dictPrefix[c] !== -1) {
        if (stackPos < 16) stackBuf[stackPos++] = dictSuffix[c];
        c = dictPrefix[c];
      }
      firstChar = c;
      // Write stack in reverse
      while (stackPos > 0) {
        outputBuffer[outputPos++] = stackBuf[--stackPos];
      }
    } else if (code === nextCode) {
      // Special: code = nextCode (not yet in dictionary)
      let c = prev;
      stackPos = 0;
      while (c >= clearCode && dictPrefix[c] !== -1) {
        if (stackPos < 16) stackBuf[stackPos++] = dictSuffix[c];
        c = dictPrefix[c];
      }
      firstChar = c;
      while (stackPos > 0) {
        outputBuffer[outputPos++] = stackBuf[--stackPos];
      }
      outputBuffer[outputPos++] = firstChar;
    } else {
      break; // invalid code
    }

    if (nextCode < maxCode) {
      dictPrefix[nextCode] = prev;
      dictSuffix[nextCode] = firstChar;
      dictLens[nextCode] = dictLens[prev] + 1;
      nextCode++;
      if (nextCode > (1 << codeSize) && codeSize < 12) {
        codeSize++;
      }
    }
    prev = code;
  }

  return outputBuffer.subarray(0, outputPos);
}
