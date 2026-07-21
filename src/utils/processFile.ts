import type { Action } from "../context/appReducer";
import { loadImageToCanvas, downscaleImage, downscaleForDisplay, analyzeImage } from "./image";
import { decodeGif } from "./gifDecoder";
import { isAnimatedWebP, decodeAnimatedWebP } from "./webpDecoder";
import { logProfile, type PipelineProfile } from "./gifProfile";

const TARGET_FPS = 12;

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const _sampledFrameMeta = new Map<number, { originalFrame: number, rgbaHash: string }>();

export interface ProcessFileCallbacks {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export async function processUploadedFile(
  file: File,
  dispatch: React.Dispatch<Action>,
  targetWidth: number,
  callbacks?: ProcessFileCallbacks,
): Promise<void> {
  if (
    !ACCEPTED_TYPES.includes(file.type) &&
    !file.name.endsWith(".gif") &&
    !file.name.endsWith(".webp")
  ) {
    callbacks?.onError?.("Please upload a JPG, PNG, WEBP, or GIF image.");
    return;
  }

  const isGif =
    file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");
  const isWebP =
    file.type === "image/webp" || file.name.toLowerCase().endsWith(".webp");

  if (isGif) {
    dispatch({ type: "SET_LOADING", loading: true });
    const pipelineStart = performance.now();

    try {
      const buffer = await file.arrayBuffer();
      const decodeStart = performance.now();
      const gif = decodeGif(buffer, targetWidth);
      const decodeTime = performance.now() - decodeStart;

      const fpsStart = performance.now();
      const avgDelay =
        gif.frames.reduce((sum, f) => sum + f.delayMs, 0) / gif.frames.length;
      const sourceFps = Math.round(1000 / avgDelay);
      const sourceInterval = 1000 / sourceFps;
      const targetInterval = 1000 / TARGET_FPS;
      const frameStep = Math.max(1, Math.round(targetInterval / sourceInterval));
      const sampledIndices: number[] = [];
      for (let i = 0; i < gif.frames.length; i += frameStep) {
        sampledIndices.push(i);
      }
      const fpsTime = performance.now() - fpsStart;

      const downsampleStart = performance.now();
      const rawFrames: ImageData[] = [];
      const timings: number[] = [];
      const rgbaHashes = new Set<string>();
      _sampledFrameMeta.clear();
      for (let i = 0; i < sampledIndices.length; i++) {
        const idx = sampledIndices[i];
        const f = gif.frames[idx].imageData;
        let h = 0x811c9dc5;
        const d = f.data;
        for (let i = 0; i < d.length; i++) { h ^= d[i]; h = Math.imul(h, 0x01000193); }
        const hashStr = "0x" + (h >>> 0).toString(16).padStart(8, "0");
        _sampledFrameMeta.set(i, { originalFrame: idx, rgbaHash: hashStr });
        rgbaHashes.add(hashStr);
        rawFrames.push(f);
        timings.push(gif.frames[idx].delayMs);
      }
      const downsampleTime = performance.now() - downsampleStart;

      const firstScaled = gif.frames[0].imageData;
      const small = downscaleForDisplay(firstScaled, 400);
      const analysis = analyzeImage(firstScaled);

      const canvas = document.createElement("canvas");
      canvas.width = firstScaled.width;
      canvas.height = firstScaled.height;
      const ctx = canvas.getContext("2d")!;
      ctx.putImageData(firstScaled, 0, 0);
      const thumbUrl = canvas.toDataURL("image/png");

      dispatch({ type: "INIT_ANIMATION", rawFrames, timings, sourceFps });
      dispatch({
        type: "SET_IMAGE",
        url: thumbUrl,
        imageData: firstScaled,
        smallImageData: small,
        analysis,
      });
      dispatch({ type: "SET_LOADING", loading: false });

      logProfile({
        gifParse: gif.profile?.gifParse ?? 0,
        lzwDecode: gif.profile?.lzwDecode ?? 0,
        frameComposite: gif.profile?.frameComposite ?? 0,
        frameSnapshot: gif.profile?.frameSnapshot ?? 0,
        fpsAnalysis: fpsTime,
        frameDownsample: downsampleTime,
        workerTransfer: 0,
        workerConvert: 0,
        workerTransferBack: 0,
        totalGifDecode: decodeTime,
        totalPipeline: performance.now() - pipelineStart,
        frameCount: gif.frames.length,
        sampledFrameCount: rawFrames.length,
        sourceWidth: gif.width,
        sourceHeight: gif.height,
      });

      callbacks?.onSuccess?.();
    } catch {
      dispatch({ type: "SET_LOADING", loading: false });
      callbacks?.onError?.("Failed to process GIF.");
    }
  } else if (isWebP) {
    dispatch({ type: "SET_LOADING", loading: true });
    const pipelineStart = performance.now();

    try {
      const buffer = await file.arrayBuffer();

      if (isAnimatedWebP(buffer)) {
        const decodeStart = performance.now();
        const webp = await decodeAnimatedWebP(buffer, targetWidth);
        const decodeTime = performance.now() - decodeStart;

        if (webp.frames.length < 2) {
          const url = URL.createObjectURL(file);
          const cvs = document.createElement("canvas");
          const imageData = await loadImageToCanvas(url, cvs);
          const scaled = downscaleImage(imageData, 2048);
          const small = downscaleForDisplay(scaled, 400);
          const analysis = analyzeImage(scaled);
          dispatch({ type: "SET_IMAGE", url, imageData: scaled, smallImageData: small, analysis });
        } else {
          const fpsStart = performance.now();
          const durations = webp.frames.map((f) => f.delayMs);
          const avgDelay = durations.reduce((sum, d) => sum + d, 0) / durations.length;
          const sourceFps = Math.round(1000 / avgDelay);
          const sourceInterval = 1000 / sourceFps;
          const targetInterval = 1000 / TARGET_FPS;
          const frameStep = Math.max(1, Math.round(targetInterval / sourceInterval));
          const sampledIndices: number[] = [];
          for (let i = 0; i < webp.frames.length; i += frameStep) {
            sampledIndices.push(i);
          }
          const fpsTime = performance.now() - fpsStart;

          const downsampleStart = performance.now();
          const rawFrames: ImageData[] = [];
          const timings: number[] = [];
          for (const idx of sampledIndices) {
            rawFrames.push(webp.frames[idx].imageData);
            timings.push(webp.frames[idx].delayMs);
          }
          const downsampleTime = performance.now() - downsampleStart;

          const firstScaled = webp.frames[0].imageData;
          const small = downscaleForDisplay(firstScaled, 400);
          const analysis = analyzeImage(firstScaled);
          const cvs = document.createElement("canvas");
          cvs.width = firstScaled.width;
          cvs.height = firstScaled.height;
          const ctx = cvs.getContext("2d")!;
          ctx.putImageData(firstScaled, 0, 0);
          const thumbUrl = cvs.toDataURL("image/png");

          dispatch({ type: "INIT_ANIMATION", rawFrames, timings, sourceFps });
          dispatch({ type: "SET_IMAGE", url: thumbUrl, imageData: firstScaled, smallImageData: small, analysis });

          logProfile({
            gifParse: webp.profile?.headerParse ?? 0,
            lzwDecode: webp.profile?.frameDecode ?? 0,
            frameComposite: 0,
            frameSnapshot: webp.profile?.frameConvert ?? 0,
            fpsAnalysis: fpsTime,
            frameDownsample: downsampleTime,
            workerTransfer: 0,
            workerConvert: 0,
            workerTransferBack: 0,
            totalGifDecode: decodeTime,
            totalPipeline: performance.now() - pipelineStart,
            frameCount: webp.frames.length,
            sampledFrameCount: rawFrames.length,
            sourceWidth: webp.width,
            sourceHeight: webp.height,
          });
        }
      } else {
        const url = URL.createObjectURL(file);
        const cvs = document.createElement("canvas");
        const imageData = await loadImageToCanvas(url, cvs);
        const scaled = downscaleImage(imageData, 2048);
        const small = downscaleForDisplay(scaled, 400);
        const analysis = analyzeImage(scaled);
        dispatch({ type: "SET_IMAGE", url, imageData: scaled, smallImageData: small, analysis });
      }

      dispatch({ type: "SET_LOADING", loading: false });
      callbacks?.onSuccess?.();
    } catch {
      dispatch({ type: "SET_LOADING", loading: false });
      callbacks?.onError?.("Failed to process WebP image.");
    }
  } else {
    dispatch({ type: "SET_LOADING", loading: true });
    try {
      const url = URL.createObjectURL(file);
      const cvs = document.createElement("canvas");
      const imageData = await loadImageToCanvas(url, cvs);
      const scaled = downscaleImage(imageData, 2048);
      const small = downscaleForDisplay(scaled, 400);
      const analysis = analyzeImage(scaled);
      dispatch({ type: "SET_IMAGE", url, imageData: scaled, smallImageData: small, analysis });
      dispatch({ type: "SET_LOADING", loading: false });
      callbacks?.onSuccess?.();
    } catch {
      dispatch({ type: "SET_LOADING", loading: false });
      callbacks?.onError?.("Failed to process image.");
    }
  }
}
