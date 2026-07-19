/**
 * Pure-JS GIF decoder.
 * Parses GIF87a/GIF89a and extracts frames as ImageData.
 */

export interface GifFrame {
  imageData: ImageData;
  delayMs: number;
  disposalMethod: number;
}

export interface GifResult {
  width: number;
  height: number;
  frames: GifFrame[];
}

export function decodeGif(buffer: ArrayBuffer): GifResult {
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

  // Header
  const signature = String.fromCharCode(view.getUint8(pos), view.getUint8(pos + 1), view.getUint8(pos + 2));
  pos += 3;
  if (signature !== "GIF") throw new Error("Not a GIF file");

  const version = String.fromCharCode(view.getUint8(pos), view.getUint8(pos + 1), view.getUint8(pos + 2));
  pos += 3;
  if (version !== "87a" && version !== "89a") throw new Error("Unsupported GIF version");

  // Logical Screen Descriptor
  const width = readUint16();
  const height = readUint16();
  const packed = readByte();
  const bgColorIndex = readByte();
  const pixelAspectRatio = readByte();
  void pixelAspectRatio;

  const hasGCT = (packed & 0x80) !== 0;
  const gctSize = hasGCT ? 2 ** ((packed & 0x07) + 1) : 0;

  // Global Color Table
  const globalColorTable: [number, number, number][] = [];
  if (hasGCT) {
    for (let i = 0; i < gctSize; i++) {
      globalColorTable.push([view.getUint8(pos), view.getUint8(pos + 1), view.getUint8(pos + 2)]);
      pos += 3;
    }
  }

  // Canvas for compositing
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const compositeBuffer = ctx.createImageData(width, height);

  // Initialize with background color
  if (hasGCT && bgColorIndex < globalColorTable.length) {
    const [r, g, b] = globalColorTable[bgColorIndex];
    for (let i = 0; i < compositeBuffer.data.length; i += 4) {
      compositeBuffer.data[i] = r;
      compositeBuffer.data[i + 1] = g;
      compositeBuffer.data[i + 2] = b;
      compositeBuffer.data[i + 3] = 255;
    }
  }

  const frames: GifFrame[] = [];
  let localColorTable: [number, number, number][] = [];
  let frameX = 0, frameY = 0, frameW = width, frameH = height;
  let transparentIndex = -1;
  let delayMs = 100;
  let disposalMethod = 0;

  // Parse blocks
  while (pos < view.byteLength) {
    const blockType = readByte();

    if (blockType === 0x2C) {
      // Image Descriptor
      frameX = readUint16();
      frameY = readUint16();
      frameW = readUint16();
      frameH = readUint16();
      const framePacked = readByte();

      const hasLCT = (framePacked & 0x80) !== 0;
      const lctSize = hasLCT ? 2 ** ((framePacked & 0x07) + 1) : 0;

      // Local Color Table
      localColorTable = [];
      if (hasLCT) {
        for (let i = 0; i < lctSize; i++) {
          localColorTable.push([view.getUint8(pos), view.getUint8(pos + 1), view.getUint8(pos + 2)]);
          pos += 3;
        }
      }

      const colorTable = localColorTable.length > 0 ? localColorTable : globalColorTable;

      // Apply disposal method to current composite
      if (disposalMethod === 2) {
        // Restore to background
        for (let y = frameY; y < frameY + frameH && y < height; y++) {
          for (let x = frameX; x < frameX + frameW && x < width; x++) {
            const idx = (y * width + x) * 4;
            compositeBuffer.data[idx] = 0;
            compositeBuffer.data[idx + 1] = 0;
            compositeBuffer.data[idx + 2] = 0;
            compositeBuffer.data[idx + 3] = 0;
          }
        }
      }

      // LZW Minimum Code Size
      const minCodeSize = readByte();

      // Sub-blocks - LZW compressed data
      const lzwData: number[] = [];
      let subBlockLen = readByte();
      while (subBlockLen > 0) {
        for (let i = 0; i < subBlockLen; i++) {
          lzwData.push(view.getUint8(pos++));
        }
        subBlockLen = readByte();
      }

      // Decode LZW
      const pixels = lzwDecode(minCodeSize, lzwData);

      // Render pixels onto composite
      let pixelIdx = 0;
      for (let y = frameY; y < frameY + frameH && y < height; y++) {
        for (let x = frameX; x < frameX + frameW && x < width; x++) {
          if (pixelIdx >= pixels.length) break;
          const paletteIdx = pixels[pixelIdx++];
          if (paletteIdx === transparentIndex) continue;
          if (paletteIdx >= colorTable.length) continue;
          const [r, g, b] = colorTable[paletteIdx];
          const idx = (y * width + x) * 4;
          compositeBuffer.data[idx] = r;
          compositeBuffer.data[idx + 1] = g;
          compositeBuffer.data[idx + 2] = b;
          compositeBuffer.data[idx + 3] = 255;
        }
      }

      // Snapshot the composite as a frame
      const frameData = new ImageData(
        new Uint8ClampedArray(compositeBuffer.data),
        width,
        height
      );

      frames.push({
        imageData: frameData,
        delayMs,
        disposalMethod,
      });

    } else if (blockType === 0x21) {
      // Extension
      const extLabel = readByte();

      if (extLabel === 0xF9) {
        // Graphic Control Extension
        pos++; // block size (always 4)
        const gcePacked = readByte();
        disposalMethod = (gcePacked >> 2) & 0x07;
        const hasTransparency = (gcePacked & 0x01) !== 0;
        delayMs = readUint16() * 10; // Convert centiseconds to ms
        if (delayMs === 0) delayMs = 100; // Minimum delay
        transparentIndex = hasTransparency ? readByte() : -1;
        if (!hasTransparency) pos++; // skip transparency index byte
        pos++; // block terminator
      } else if (extLabel === 0xFF) {
        // Application Extension
        pos++; // skip block size byte (always 11)
        pos += 11; // skip app identifier + auth code
        // Skip sub-blocks
        let subLen = readByte();
        while (subLen > 0) { pos += subLen; subLen = readByte(); }
      } else if (extLabel === 0xFE) {
        // Comment Extension - skip
        let subLen = readByte();
        while (subLen > 0) { pos += subLen; subLen = readByte(); }
      } else {
        // Unknown extension - skip sub-blocks
        const blockSize = readByte();
        pos += blockSize;
        let subLen = readByte();
        while (subLen > 0) { pos += subLen; subLen = readByte(); }
      }
    } else if (blockType === 0x3B) {
      // Trailer
      break;
    } else if (blockType === 0x00) {
      // Padding byte, skip
    } else {
      // Unknown block, try to skip
      break;
    }
  }

  if (frames.length === 0) throw new Error("No frames found in GIF");

  return { width, height, frames };
}

function lzwDecode(minCodeSize: number, data: number[]): number[] {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  const maxCode = 4096;

  // Initialize dictionary
  const dictionary: number[][] = [];
  for (let i = 0; i < clearCode; i++) {
    dictionary.push([i]);
  }

  const output: number[] = [];
  let bits = 0;
  let bitsAvail = 0;
  let dataPos = 0;

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
    // Reset
    dictionary.length = clearCode + 2;
    codeSize = minCodeSize + 1;
    nextCode = eoiCode + 1;
    prev = readBits();
  }
  if (prev === eoiCode) return output;
  output.push(...dictionary[prev]);

  for (;;) {
    const code = readBits();
    if (code === eoiCode) break;
    if (code === clearCode) {
      dictionary.length = clearCode + 2;
      codeSize = minCodeSize + 1;
      nextCode = eoiCode + 1;
      prev = readBits();
      if (prev === eoiCode) break;
      output.push(...dictionary[prev]);
      continue;
    }

    let entry: number[];
    if (code < dictionary.length) {
      entry = dictionary[code];
    } else if (code === nextCode) {
      const prevEntry = dictionary[prev];
      entry = [...prevEntry, prevEntry[0]];
    } else {
      break; // invalid code
    }

    output.push(...entry);

    if (nextCode < maxCode) {
      const prevEntry = dictionary[prev];
      dictionary.push([...prevEntry, entry[0]]);
      nextCode++;
      if (nextCode > (1 << codeSize) && codeSize < 12) {
        codeSize++;
      }
    }
    prev = code;
  }

  return output;
}
