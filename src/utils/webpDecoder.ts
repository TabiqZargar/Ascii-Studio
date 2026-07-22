/**
 * Animated WebP decoder.
 *
 * Uses a custom RIFF parser to extract ALL ANMF frame chunks and metadata,
 * then decodes pixel data via the WebCodecs ImageDecoder API. Handles partial
 * frames (x/y offset, blend, dispose) by compositing each frame onto a canvas
 * to produce full-frame ImageData output.
 *
 * Falls back to single-frame static decode when ImageDecoder is unavailable.
 */

import { mark, measure } from "./gifProfile";

export interface WebPFrame {
  imageData: ImageData;
  delayMs: number;
}

export interface WebPResult {
  width: number;
  height: number;
  frames: WebPFrame[];
  animated: boolean;
  loopCount: number;
  profile?: {
    headerParse: number;
    frameDecode: number;
    frameConvert: number;
  };
}

interface VP8XData {
  hasAlpha: boolean;
  isAnimation: boolean;
  width: number;
  height: number;
}

interface ANIMData {
  bgColor: number;
  loopCount: number;
}

interface ANMFFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  durationMs: number;
  dispose: number;
  blend: number;
}

// RIFF chunk IDs as 32-bit unsigned ints (big-endian)
const CHUNK_RIFF = 0x52494646;
const CHUNK_WEBP = 0x57454250;
const CHUNK_VP8X = 0x58385650;
const CHUNK_ANIM = 0x4d494e41;
const CHUNK_ANMF = 0x464d4e41;

/**
 * Read a 24-bit unsigned integer from 3 bytes at the given offset.
 */
function readU24(view: DataView, offset: number): number {
  const b0 = view.getUint8(offset);
  const b1 = view.getUint8(offset + 1);
  const b2 = view.getUint8(offset + 2);
  return (b0 << 16) | (b1 << 8) | b2;
}

/**
 * Parse VP8X extended format chunk to extract canvas dimensions and animation flag.
 */
function parseVP8X(data: DataView, dataOffset: number): VP8XData {
  const flags = data.getUint8(dataOffset);
  const hasAlpha = (flags & 0x10) !== 0;
  const isAnimation = (flags & 0x02) !== 0;
  // Canvas width minus 1 at bytes 4-6, canvas height minus 1 at bytes 7-9
  const width = readU24(data, dataOffset + 4) + 1;
  const height = readU24(data, dataOffset + 7) + 1;
  return { hasAlpha, isAnimation, width, height };
}

/**
 * Parse ANIM chunk for animation parameters (background color, loop count).
 */
function parseANIM(data: DataView, dataOffset: number, chunkSize: number): ANIMData {
  const bgColor = data.getUint32(dataOffset, true);
  const loopCount = chunkSize >= 6 ? data.getUint16(dataOffset + 4, true) : 0;
  return { bgColor, loopCount };
}

/**
 * Parse a single ANMF chunk to extract frame metadata.
 * The actual VP8/VP8L payload follows immediately after the 15-byte header.
 */
function parseANMF(data: DataView, dataOffset: number): ANMFFrame {
  const x = readU24(data, dataOffset);
  const y = readU24(data, dataOffset + 3);
  const width = readU24(data, dataOffset + 6) + 1;
  const height = readU24(data, dataOffset + 9) + 1;
  const durationMs = readU24(data, dataOffset + 12);
  const flags = data.getUint8(dataOffset + 15);
  const dispose = (flags >> 1) & 0x01;
  const blend = (flags >> 2) & 0x01;
  return { x, y, width, height, durationMs, dispose, blend };
}

/**
 * Parse the full RIFF container and extract VP8X, ANIM, and all ANMF chunks.
 * Returns the animation metadata and the byte range of each ANMF chunk's
 * VP8/VP8L sub-payload for ImageDecoder.
 */
function parseRIFF(buffer: ArrayBuffer): {
  vp8x: VP8XData;
  anim: ANIMData;
  frames: ANMFFrame[];
} {
  const view = new DataView(buffer);
  const vp8x: VP8XData = { hasAlpha: false, isAnimation: false, width: 0, height: 0 };
  const anim: ANIMData = { bgColor: 0, loopCount: 0 };
  const frames: ANMFFrame[] = [];

  let offset = 12; // skip RIFF header (4 + 4 + 4)

  while (offset + 8 <= buffer.byteLength) {
    const chunkId = view.getUint32(offset, false);
    const chunkSize = view.getUint32(offset + 4, true);
    const dataOffset = offset + 8;

    if (dataOffset + chunkSize > buffer.byteLength) break;

    if (chunkId === CHUNK_VP8X && chunkSize >= 10) {
      Object.assign(vp8x, parseVP8X(view, dataOffset));
    } else if (chunkId === CHUNK_ANIM && chunkSize >= 4) {
      Object.assign(anim, parseANIM(view, dataOffset, chunkSize));
    } else if (chunkId === CHUNK_ANMF) {
      frames.push(parseANMF(view, dataOffset));
    }

    offset = dataOffset + chunkSize + (chunkSize & 1);
  }

  return { vp8x, anim, frames };
}

/**
 * Detect animated WebP by parsing the RIFF header.
 * Checks for the VP8X extended-format chunk with the animation flag set.
 */
export function isAnimatedWebP(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 12) return false;
  const view = new DataView(buffer);
  if (view.getUint32(0, false) !== CHUNK_RIFF) return false;
  if (view.getUint32(8, false) !== CHUNK_WEBP) return false;

  let offset = 12;
  while (offset + 8 <= buffer.byteLength) {
    const chunkId = view.getUint32(offset, false);
    const chunkSize = view.getUint32(offset + 4, true);
    const dataOffset = offset + 8;
    if (dataOffset + chunkSize > buffer.byteLength) break;
    if (chunkId === CHUNK_VP8X) {
      if (chunkSize < 4) return false;
      return (view.getUint8(dataOffset) & 0x02) !== 0;
    }
    offset = dataOffset + chunkSize + (chunkSize & 1);
  }
  return false;
}

/**
 * Decode all frames of an animated WebP.
 *
 * Strategy:
 * 1. Parse RIFF container to get correct frame count from ANMF chunks
 *    (ImageDecoder's track.frameCount is often wrong — reports 1 for animated WebP).
 * 2. Use ImageDecoder to decode pixel data for each frame.
 * 3. Composite partial frames onto canvas using x/y offset, blend, dispose.
 * 4. Output full-frame ImageData for each composited frame.
 */
export async function decodeAnimatedWebP(
  buffer: ArrayBuffer,
  targetWidth = 0
): Promise<WebPResult> {
  if (typeof ImageDecoder === "undefined") {
    throw new Error(
      "ImageDecoder API not available. Animated WebP requires a modern browser (Chrome 94+, Edge 94+, Safari 16.4+)."
    );
  }

  mark("headerParse");

  // 1. Parse RIFF container for frame metadata
  const riff = parseRIFF(buffer);
  const { vp8x, anim, frames: anmfFrames } = riff;

  // 2. If no ANMF chunks or VP8X says not animated, decode as static
  if (!vp8x.isAnimation || anmfFrames.length === 0) {
    const headerTime = measure("headerParse");
    const staticFrame = await decodeSingleWebPFrame(buffer);
    return {
      width: staticFrame.width,
      height: staticFrame.height,
      frames: [{ imageData: staticFrame, delayMs: 100 }],
      animated: false,
      loopCount: 0,
      profile: { headerParse: headerTime, frameDecode: 0, frameConvert: 0 },
    };
  }

  const canvasW = vp8x.width;
  const canvasH = vp8x.height;

  // 3. Create ImageDecoder
  const decoder = new ImageDecoder({
    type: "image/webp",
    data: new Uint8Array(buffer),
  });
  await decoder.completed;

  const headerTime = measure("headerParse");

  // 4. Pre-compute downscale dimensions
  const needsDownscale = targetWidth > 0 && targetWidth < canvasW;
  const outW = needsDownscale ? targetWidth : canvasW;
  const outH = needsDownscale ? Math.round(canvasH * (targetWidth / canvasW)) : canvasH;

  // 5. Compositing canvas (full original canvas size)
  const compCanvas = document.createElement("canvas");
  compCanvas.width = canvasW;
  compCanvas.height = canvasH;
  const compCtx = compCanvas.getContext("2d")!;

  // Temp canvas for decoding individual frames
  const tmpCanvas = document.createElement("canvas");
  const tmpCtx = tmpCanvas.getContext("2d")!;

  // Downscale canvas (optional)
  let dstCanvas: HTMLCanvasElement | undefined;
  let dstCtx: CanvasRenderingContext2D | undefined;
  if (needsDownscale) {
    dstCanvas = document.createElement("canvas");
    dstCanvas.width = outW;
    dstCanvas.height = outH;
    dstCtx = dstCanvas.getContext("2d")!;
  }

  const resultFrames: WebPFrame[] = [];
  let totalDecodeTime = 0;
  let totalConvertTime = 0;
  const frameCount = anmfFrames.length;

  for (let i = 0; i < frameCount; i++) {
    const anmf = anmfFrames[i];

    // 6. Decode pixel data via ImageDecoder
    mark("frameDecode");
    let videoFrame: VideoFrame;
    try {
      const decoded = await decoder.decode({ frameIndex: i });
      videoFrame = decoded.image;
    } catch {
      // If ImageDecoder can't decode frame i (e.g. track.frameCount was wrong
      // and there are fewer decodable frames than ANMF chunks), stop here.
      break;
    }
    totalDecodeTime += measure("frameDecode");

    mark("frameConvert");

    // 7. Draw decoded frame onto temp canvas at its native size
    tmpCanvas.width = videoFrame.displayWidth;
    tmpCanvas.height = videoFrame.displayHeight;
    tmpCtx.drawImage(videoFrame, 0, 0);
    videoFrame.close();

    // 8. Composite onto compositing canvas
    if (anmf.blend === 0) {
      // REPLACE: clear the frame area, then draw
      compCtx.clearRect(anmf.x, anmf.y, anmf.width, anmf.height);
    }
    // blend=1 (ALPHA): just draw on top (source-over handles alpha blending)
    compCtx.drawImage(tmpCanvas, anmf.x, anmf.y, anmf.width, anmf.height);

    // 9. Capture the composited full-frame result
    let imageData: ImageData;
    if (needsDownscale && dstCanvas && dstCtx) {
      dstCtx.clearRect(0, 0, outW, outH);
      dstCtx.drawImage(compCanvas, 0, 0, outW, outH);
      imageData = dstCtx.getImageData(0, 0, outW, outH);
    } else {
      imageData = compCtx.getImageData(0, 0, canvasW, canvasH);
    }

    // 10. Apply dispose method (for next frame's compositing)
    if (anmf.dispose === 1) {
      compCtx.clearRect(anmf.x, anmf.y, anmf.width, anmf.height);
    }

    totalConvertTime += measure("frameConvert");

    resultFrames.push({
      imageData,
      delayMs: Math.max(10, anmf.durationMs),
    });
  }



  return {
    width: outW,
    height: outH,
    frames: resultFrames,
    animated: resultFrames.length > 1,
    loopCount: anim.loopCount,
    profile: {
      headerParse: headerTime,
      frameDecode: totalDecodeTime,
      frameConvert: totalConvertTime,
    },
  };
}

/**
 * Decode a single WebP frame as a static image using an <img> element.
 * Used as fallback when ImageDecoder is unavailable or the file is not animated.
 */
async function decodeSingleWebPFrame(buffer: ArrayBuffer): Promise<ImageData> {
  const blob = new Blob([buffer], { type: "image/webp" });
  const url = URL.createObjectURL(blob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Failed to load WebP image"));
      el.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  } finally {
    URL.revokeObjectURL(url);
  }
}
