/**
 * Animated WebP decoder using the WebCodecs ImageDecoder API.
 *
 * Falls back to single-frame static decode when ImageDecoder is unavailable.
 * Animated WebP requires ImageDecoder — no JS fallback is practical for full
 * frame-by-frame extraction since WebP frame coding is not trivially decodable
 * outside the browser's native codec.
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
  profile?: {
    headerParse: number;
    frameDecode: number;
    frameConvert: number;
  };
}

/**
 * Detect animated WebP by parsing the RIFF header.
 * Checks for the VP8X extended-format chunk with the animation flag set.
 */
export function isAnimatedWebP(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 12) return false;
  const view = new DataView(buffer);

  // RIFF....WEBP
  if (view.getUint32(0, false) !== 0x52494646) return false;
  if (view.getUint32(8, false) !== 0x57454250) return false;

  let offset = 12;
  while (offset + 8 <= buffer.byteLength) {
    const chunkId = view.getUint32(offset, false);
    const chunkSize = view.getUint32(offset + 4, true);
    const dataOffset = offset + 8;

    if (dataOffset + chunkSize > buffer.byteLength) break;

    if (chunkId === 0x58385650) {
      // VP8X
      if (chunkSize < 4) return false;
      // Byte 0 of VP8X data: flags
      // Bit 1 (from LSB) = Animation
      const flags = view.getUint8(dataOffset);
      return (flags & 0x02) !== 0;
    }

    offset = dataOffset + chunkSize + (chunkSize & 1);
  }

  return false;
}

/**
 * Decode all frames of an animated WebP using ImageDecoder.
 *
 * When targetWidth is provided and smaller than the source, each frame is
 * downscaled during extraction via canvas drawImage (same approach as GIF).
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

  const decoder = new ImageDecoder({
    type: "image/webp",
    data: new Uint8Array(buffer),
  });

  // TypeScript types use `completed` (not `ready`)
  await decoder.completed;

  const trackList = decoder.tracks;
  const track = trackList.selectedTrack ?? trackList[0];

  if (!track || track.frameCount < 2) {
    const headerTime = measure("headerParse");
    const staticFrame = await decodeSingleWebPFrame(buffer);
    return {
      width: staticFrame.width,
      height: staticFrame.height,
      frames: [{ imageData: staticFrame, delayMs: 100 }],
      animated: false,
      profile: { headerParse: headerTime, frameDecode: 0, frameConvert: 0 },
    };
  }

  const frameCount = track.frameCount;

  // Decode first frame to get dimensions (ImageTrack doesn't expose codedWidth)
  const firstResult = await decoder.decode({ frameIndex: 0 });
  const width = firstResult.image.displayWidth;
  const height = firstResult.image.displayHeight;
  firstResult.image.close();

  const headerTime = measure("headerParse");

  // Pre-compute downscale dimensions
  const needsDownscale = targetWidth > 0 && targetWidth < width;
  const outW = needsDownscale ? targetWidth : width;
  const outH = needsDownscale ? Math.round(height * (targetWidth / width)) : height;

  // Reusable canvas pair for downscaling
  let dstCanvas: HTMLCanvasElement | undefined;
  let dstCtx: CanvasRenderingContext2D | undefined;
  if (needsDownscale) {
    dstCanvas = document.createElement("canvas");
    dstCanvas.width = outW;
    dstCanvas.height = outH;
    dstCtx = dstCanvas.getContext("2d")!;
  }

  const frames: WebPFrame[] = [];
  let totalDecodeTime = 0;
  let totalConvertTime = 0;

  for (let i = 0; i < frameCount; i++) {
    mark("frameDecode");
    const result = await decoder.decode({ frameIndex: i });
    const videoFrame = result.image;
    totalDecodeTime += measure("frameDecode");

    mark("frameConvert");

    let imageData: ImageData;

    if (needsDownscale && dstCanvas && dstCtx) {
      dstCtx.clearRect(0, 0, outW, outH);
      dstCtx.drawImage(videoFrame, 0, 0, outW, outH);
      imageData = dstCtx.getImageData(0, 0, outW, outH);
    } else {
      const fw = videoFrame.displayWidth;
      const fh = videoFrame.displayHeight;
      const tmpCanvas = document.createElement("canvas");
      tmpCanvas.width = fw;
      tmpCanvas.height = fh;
      const tmpCtx = tmpCanvas.getContext("2d")!;
      tmpCtx.drawImage(videoFrame, 0, 0);
      imageData = tmpCtx.getImageData(0, 0, fw, fh);
    }

    totalConvertTime += measure("frameConvert");

    // Derive frame delay — duration may be null per TS types
    const durUs = videoFrame.duration;
    const tsUs = videoFrame.timestamp;

    let delayMs: number;
    if (durUs != null && durUs > 0) {
      delayMs = Math.max(10, Math.round(durUs / 1000));
    } else if (i < frameCount - 1) {
      // Peek at next frame's timestamp to compute gap
      const nextResult = await decoder.decode({ frameIndex: i + 1 });
      const gapUs = nextResult.image.timestamp - tsUs;
      nextResult.image.close();
      delayMs = gapUs > 0 ? Math.max(10, Math.round(gapUs / 1000)) : 100;
    } else {
      delayMs = 100;
    }

    videoFrame.close();
    frames.push({ imageData, delayMs });
  }

  return {
    width: outW,
    height: outH,
    frames,
    animated: true,
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
