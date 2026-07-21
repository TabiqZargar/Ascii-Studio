/**
 * Optimized GIF89a decoder.
 *
 * Key optimizations over naive implementation:
 * 1. LZW: fixed-stack chain traversal (zero per-code allocation)
 * 2. LZW: flat TypedArrays for dictionary (cache-friendly)
 * 3. Snapshot: downscale immediately during decode (10x memory reduction)
 * 4. Downscale: single reused canvas pair across all frames
 * 5. Composite: transparency fast-path branches
 *
 * Disposal methods per GIF89a spec:
 *   0 / 1 — Do not dispose (leave canvas as-is)
 *   2 — Restore to background color
 *   3 — Restore to previous (canvas state before this frame was drawn)
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
  console.log("[GIF] decodeGif ENTER", { byteLength: buffer.byteLength, targetWidth });

  try {
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

  const signature = String.fromCharCode(
    view.getUint8(pos),
    view.getUint8(pos + 1),
    view.getUint8(pos + 2),
  );
  pos += 3;
  if (signature !== "GIF") {
    console.error("[GIF] THROW: Not a GIF file (signature=" + signature + ")");
    throw new Error("Not a GIF file");
  }

  console.log("[GIF] Header parsed", { signature, version: String.fromCharCode(view.getUint8(pos), view.getUint8(pos+1), view.getUint8(pos+2)) });
  const version = String.fromCharCode(
    view.getUint8(pos),
    view.getUint8(pos + 1),
    view.getUint8(pos + 2),
  );
  pos += 3;
  if (version !== "87a" && version !== "89a") {
    console.error("[GIF] THROW: Unsupported GIF version", version);
    throw new Error("Unsupported GIF version");
  }

  const width = readUint16();
  const height = readUint16();
  const packed = readByte();
  const bgColorIndex = readByte();
  const pixelAspectRatio = readByte();
  void pixelAspectRatio;

  const hasGCT = (packed & 0x80) !== 0;
  const gctSize = hasGCT ? 2 ** ((packed & 0x07) + 1) : 0;

  // Parse GCT into flat Uint8Array for fast palette lookup
  const gctFlat = new Uint8Array(gctSize * 3);
  if (hasGCT) {
    for (let i = 0; i < gctSize; i++) {
      gctFlat[i * 3] = view.getUint8(pos);
      gctFlat[i * 3 + 1] = view.getUint8(pos + 1);
      gctFlat[i * 3 + 2] = view.getUint8(pos + 2);
      pos += 3;
    }
  }

  console.log("[GIF] Logical Screen Descriptor parsed", { width, height, hasGCT, gctSize });
  console.log("[GIF] Global Color Table parsed", { gctSize });

  const gifParseTime = measure("gifParse");

  // --- Prepare downscaling (if targetWidth > 0) ---
  const needsDownscale = targetWidth > 0 && targetWidth < width;
  const scaleRatio = needsDownscale ? targetWidth / width : 1;
  const outW = needsDownscale ? targetWidth : width;
  const outH = needsDownscale ? Math.round(height * scaleRatio) : height;

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

  // Background color for disposal method 2
  let bgR = 0,
    bgG = 0,
    bgB = 0;
  if (hasGCT && bgColorIndex * 3 + 2 < gctFlat.length) {
    bgR = gctFlat[bgColorIndex * 3];
    bgG = gctFlat[bgColorIndex * 3 + 1];
    bgB = gctFlat[bgColorIndex * 3 + 2];
  }
  for (let i = 0; i < compositeData.length; i += 4) {
    compositeData[i] = bgR;
    compositeData[i + 1] = bgG;
    compositeData[i + 2] = bgB;
    compositeData[i + 3] = 255;
  }

  const frames: GifFrame[] = [];
  let transparentIndex = -1;
  let delayMs = 100;
  let disposalMethod = 0;

  // Track previous frame's disposal info (applied BEFORE current frame is drawn)
  let prevDisposal = 0;
  let prevFrameX = 0,
    prevFrameY = 0,
    prevFrameW = 0,
    prevFrameH = 0;
  let savedComposite: Uint8ClampedArray | null = null;

  let totalLzwTime = 0;
  let totalCompositeTime = 0;
  let totalSnapshotTime = 0;

  // Pre-allocate LZW output buffer
  const maxPixels = width * height;
  let pixelBuffer = new Uint8Array(maxPixels);

  // Parse blocks
  while (pos < view.byteLength) {
    const blockType = readByte();

    if (blockType === 0x2c) {
      console.log("[GIF] Frame " + frames.length + " start");
      // Image Descriptor
      const frameX = readUint16();
      const frameY = readUint16();
      const frameW = readUint16();
      const frameH = readUint16();
      const framePacked = readByte();

      const hasLCT = (framePacked & 0x80) !== 0;
      const interlaced = (framePacked & 0x40) !== 0;
      const lctSize = hasLCT ? 2 ** ((framePacked & 0x07) + 1) : 0;
      console.log("[GIF FRAME]", {
        frame: frames.length,
        left: frameX,
        top: frameY,
        width: frameW,
        height: frameH,
        expectedPixels: frameW * frameH,
        interlaced,
        hasLocalColorTable: hasLCT,
        disposalMethod,
        transparentIndex,
      });

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

      // --- Apply PREVIOUS frame's disposal method ---
      if (prevDisposal === 2) {
        // Restore to background color
        for (
          let y = prevFrameY;
          y < prevFrameY + prevFrameH && y < height;
          y++
        ) {
          const rowOff = y * width;
          for (
            let x = prevFrameX;
            x < prevFrameX + prevFrameW && x < width;
            x++
          ) {
            const idx = (rowOff + x) << 2;
            compositeData[idx] = bgR;
            compositeData[idx + 1] = bgG;
            compositeData[idx + 2] = bgB;
            compositeData[idx + 3] = 255;
          }
        }
      } else if (prevDisposal === 3 && savedComposite) {
        // Restore to previous canvas state
        compositeData.set(savedComposite);
      }

      // Save canvas state if CURRENT frame requests disposal=3
      if (disposalMethod === 3) {
        savedComposite = new Uint8ClampedArray(compositeData);
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
      const pixels = lzwDecodeOptimized(minCodeSize, lzwData, pixelBuffer, frames.length);
      totalLzwTime += measure("lzw");

      console.log("[GIF LZW RESULT]", {
        frame: frames.length,
        decodedPixels: pixels.length,
        expectedPixels: frameW * frameH,
      });

      // ASSERTION: LZW Output
      if (pixels.length !== frameW * frameH) {
        const lzwMsg = `LZW Decode failed: expected ${frameW * frameH} pixels, got ${pixels.length}`;
        console.error("[GIF] THROW:", lzwMsg);
        throw new Error(lzwMsg);
      }

      // Grow buffer if needed
      if (pixels.length > pixelBuffer.length) {
        pixelBuffer = new Uint8Array(pixels.length + (pixels.length >> 1));
      }

      // --- Stage 3: Frame Composite ---
      mark("composite");
      const framePixelCount = frameW * frameH;
      let pixelIdx = 0;

      console.log(
        `[GIF Decoder] Frame ${frames.length}: ${frameW}x${frameH} at (${frameX},${frameY}), delay=${delayMs}ms, disposal=${disposalMethod}, prevDisposal=${prevDisposal}`,
      );

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
      if (
        needsDownscale &&
        downscaleSrcCtx &&
        downscaleDstCtx &&
        downscaleDstCanvas &&
        downscaleSrcCanvas
      ) {
        downscaleSrcCtx.putImageData(compositeBuffer, 0, 0);
        downscaleDstCtx.clearRect(0, 0, outW, outH);
        downscaleDstCtx.drawImage(downscaleSrcCanvas, 0, 0, outW, outH);
        frameData = downscaleDstCtx.getImageData(0, 0, outW, outH);
      } else {
        frameData = new ImageData(
          new Uint8ClampedArray(compositeData),
          width,
          height,
        );
      }
      totalSnapshotTime += measure("snapshot");

      // --- DIAGNOSTIC: Checksum frame imageData ---
      let checksum = 0;
      for (let i = 0; i < frameData.data.length; i += 17) {
        checksum = ((checksum << 5) - checksum + frameData.data[i]) | 0;
      }
      const bufAddr = (frameData.data as unknown as { buffer: ArrayBuffer })
        .buffer.byteLength;
      console.log(
        `[GIF Diag] Frame ${frames.length} checksum=0x${(checksum >>> 0).toString(16).padStart(8, "0")} ` +
          `bufLen=${frameData.data.length} bufAddr=${bufAddr} ` +
          `w=${frameData.width} h=${frameData.height}`,
      );

      let hash = 0x811c9dc5;
      const d = frameData.data;
      for (let i = 0; i < d.length; i++) {
        hash ^= d[i];
        hash = Math.imul(hash, 0x01000193);
      }
      console.log("[GIF CHECK] frame=" + frames.length + " checksum=0x" + (hash >>> 0).toString(16).padStart(8, "0") + " pixels=" + frameData.width * frameData.height);

      frames.push({ imageData: frameData, delayMs, disposalMethod });
      console.log("[GIF] Frame pushed, total:", frames.length);

      // Save current frame's info for the NEXT frame's disposal
      prevDisposal = disposalMethod;
      prevFrameX = frameX;
      prevFrameY = frameY;
      prevFrameW = frameW;
      prevFrameH = frameH;
    } else if (blockType === 0x21) {
      const extLabel = readByte();

      if (extLabel === 0xf9) {
        pos++; // block size
        const gcePacked = readByte();
        disposalMethod = (gcePacked >> 2) & 0x07;
        const hasTransparency = (gcePacked & 0x01) !== 0;
        delayMs = readUint16() * 10;
        if (delayMs === 0) delayMs = 100;
        transparentIndex = hasTransparency ? readByte() : -1;
        if (!hasTransparency) pos++;
        pos++; // block terminator
      } else if (extLabel === 0xff) {
        pos += 12; // block size + app identifier
        let subLen = readByte();
        while (subLen > 0) {
          pos += subLen;
          subLen = readByte();
        }
      } else if (extLabel === 0xfe) {
        let subLen = readByte();
        while (subLen > 0) {
          pos += subLen;
          subLen = readByte();
        }
      } else {
        const blockSize = readByte();
        pos += blockSize;
        let subLen = readByte();
        while (subLen > 0) {
          pos += subLen;
          subLen = readByte();
        }
      }
    } else if (blockType === 0x3b) {
      console.log("[GIF] Trailer reached");
      break;
    } else if (blockType === 0x00) {
      // padding
    } else {
      break;
    }
  }

  if (frames.length === 0) {
    console.error("[GIF] THROW: No frames found in GIF");
    throw new Error("No frames found in GIF");
  }

  console.log(`[GIF Decoder] Decoded ${frames.length} frames.`);
  if (frames.length < 2) {
    const msg = `Expected animated GIF, but only found ${frames.length} frame(s)`;
    console.error("[GIF] THROW:", msg);
    throw new Error(msg);
  }

  console.log("[GIF] returning", {
    width: outW,
    height: outH,
    frameCount: frames.length,
  });
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
  } catch (err) {
    console.error("[GIF] decodeGif FAILED", err);
    throw err;
  }
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
  outputBuffer: Uint8Array,
  frameIndex?: number,
): Uint8Array {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  const maxCode = 4096;

  console.log("[LZW] clearCode =", clearCode);
  console.log("[LZW] minCodeSize =", minCodeSize);
  console.log("[LZW] initial codeSize =", codeSize);
  console.log("[LZW] data length =", data.length);

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

  // Fixed-size stack for chain reversal (max dictionary size = 4096)
  const stackBuf = new Uint8Array(4096);
  let stackPos = 0;

  let decodedCodes = 0;

  function readBits(): number {
    while (bitsAvail < codeSize) {
      if (dataPos >= data.length) {
        console.error("[LZW EXIT]", { frame: frameIndex, reason: "truncated bitstream", decodedCodes, outputPos, nextCode, codeSize, code: -1, prev });
        return eoiCode;
      }
      bits |= data[dataPos++] << bitsAvail;
      bitsAvail += 8;
    }
    const result = bits & ((1 << codeSize) - 1);
    bits >>= codeSize;
    bitsAvail -= codeSize;
    return result;
  }

  let prev = readBits();
  decodedCodes++;
  if (prev === clearCode) {
    codeSize = minCodeSize + 1;
    nextCode = eoiCode + 1;
    console.log("[LZW] initial clear code, reset, reading next code...");
    prev = readBits();
    decodedCodes++;
  }
  if (prev === eoiCode) {
    console.error("[LZW EXIT]", { frame: frameIndex, reason: "first code was EOI", decodedCodes, outputPos, nextCode, codeSize, code: prev, prev });
    return outputBuffer.subarray(0, 0);
  }

  if (prev < clearCode) {
    outputBuffer[outputPos++] = prev;
  }
  console.log("[LZW] First decoded code", { decodedCodes, code: prev, nextCode, codeSize, outputPos });

  for (;;) {
    const code = readBits();
    decodedCodes++;

    if (code === eoiCode) {
      console.error("[LZW EXIT]", { frame: frameIndex, reason: "EOI", decodedCodes, outputPos, nextCode, codeSize, code, prev });
      break;
    }

    if (code === clearCode) {
      codeSize = minCodeSize + 1;
      nextCode = eoiCode + 1;
      console.log("[LZW] clear code", { decodedCodes, nextCode, codeSize, outputPos });
      prev = readBits();
      decodedCodes++;
      if (prev === eoiCode) { console.error("[LZW EXIT]", { frame: frameIndex, reason: "EOI after clear", decodedCodes, outputPos, nextCode, codeSize, code: prev, prev }); break; }
      if (prev < clearCode) outputBuffer[outputPos++] = prev;
      continue;
    }

    let firstChar: number;

    if (code < nextCode) {
      let c = code;
      stackPos = 0;
      while (c >= clearCode && dictPrefix[c] !== -1) {
        stackBuf[stackPos++] = dictSuffix[c];
        c = dictPrefix[c];
      }
      firstChar = c;
      outputBuffer[outputPos++] = firstChar;
      while (stackPos > 0) {
        outputBuffer[outputPos++] = stackBuf[--stackPos];
      }
    } else if (code === nextCode) {
      let c = prev;
      stackPos = 0;
      while (c >= clearCode && dictPrefix[c] !== -1) {
        stackBuf[stackPos++] = dictSuffix[c];
        c = dictPrefix[c];
      }
      firstChar = c;
      outputBuffer[outputPos++] = firstChar;
      while (stackPos > 0) {
        outputBuffer[outputPos++] = stackBuf[--stackPos];
      }
      outputBuffer[outputPos++] = firstChar;
    } else {
      console.error("[LZW EXIT]", {
        frame: frameIndex,
        reason: "invalid code",
        code,
        nextCode,
        prev,
        outputPos,
        decodedCodes,
        codeSize,
        bitsAvail,
        bits,
        dataPos
      });
      break;
    }

    if (nextCode < maxCode) {
      dictPrefix[nextCode] = prev;
      dictSuffix[nextCode] = firstChar;
      dictLens[nextCode] = dictLens[prev] + 1;
      nextCode++;
      if (nextCode >= 1 << codeSize && codeSize < 12) {
        codeSize++;
        console.log("[LZW] codeSize ->", codeSize, "nextCode =", nextCode);
      }
    }
    prev = code;

    if (nextCode >= 480) {
      console.log({
        decodedCodes,
        code,
        prev,
        nextCode,
        codeSize,
        outputPos
      });
    }
  }

  console.log("[LZW FINAL]", {
    frame: frameIndex,
    outputPos,
    nextCode,
    codeSize,
    decodedCodes
  });

  return outputBuffer.subarray(0, outputPos);
}
