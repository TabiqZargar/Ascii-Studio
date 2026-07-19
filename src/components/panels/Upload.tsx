import { useRef, useState, useEffect } from "react";
import { useApp, useDispatch } from "../../context/AppContext";
import { loadImageToCanvas, downscaleImage, downscaleForDisplay, analyzeImage } from "../../utils/image";
import { SAMPLE_IMAGES } from "../../data/presets";
import { decodeGif } from "../../utils/gifDecoder";
import { isAnimatedWebP, decodeAnimatedWebP } from "../../utils/webpDecoder";
import { logProfile, type PipelineProfile } from "../../utils/gifProfile";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.gif";
const TARGET_FPS = 12;

export default function Upload() {
  const state = useApp();
  const dispatch = useDispatch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const handler = () => inputRef.current?.click();
    document.addEventListener("ascii-studio-upload", handler);
    return () => document.removeEventListener("ascii-studio-upload", handler);
  }, []);

  const handleFile = async (file: File) => {
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.endsWith(".gif") && !file.name.endsWith(".webp")) {
      setError("Please upload a JPG, PNG, WEBP, or GIF image.");
      return;
    }

    const isGif = file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");
    const isWebP = file.type === "image/webp" || file.name.toLowerCase().endsWith(".webp");

    if (isGif) {
      dispatch({ type: "SET_LOADING", loading: true });
      const pipelineStart = performance.now();

      try {
        const buffer = await file.arrayBuffer();

        // Stage 1: GIF Decode (frames downscaled to asciiWidth during decode)
        const decodeStart = performance.now();
        const targetWidth = state.canvas.asciiWidth;
        const gif = decodeGif(buffer, targetWidth);
        const decodeTime = performance.now() - decodeStart;

        // Stage 2: FPS Analysis
        const fpsStart = performance.now();
        const avgDelay = gif.frames.reduce((sum, f) => sum + f.delayMs, 0) / gif.frames.length;
        const sourceFps = Math.round(1000 / avgDelay);
        const sourceInterval = 1000 / sourceFps;
        const targetInterval = 1000 / TARGET_FPS;
        const frameStep = Math.max(1, Math.round(targetInterval / sourceInterval));
        const sampledIndices: number[] = [];
        for (let i = 0; i < gif.frames.length; i += frameStep) {
          sampledIndices.push(i);
        }
        const fpsTime = performance.now() - fpsStart;

        // Stage 3: Collect sampled frames (already downscaled in decoder)
        const downsampleStart = performance.now();
        const rawFrames: ImageData[] = [];
        const timings: number[] = [];
        for (const idx of sampledIndices) {
          rawFrames.push(gif.frames[idx].imageData);
          timings.push(gif.frames[idx].delayMs);
        }
        const downsampleTime = performance.now() - downsampleStart;

        // Stage 4: First frame setup (already downscaled)
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
        dispatch({ type: "SET_IMAGE", url: thumbUrl, imageData: firstScaled, smallImageData: small, analysis });
        dispatch({ type: "SET_LOADING", loading: false });

        // Log profile
        const totalTime = performance.now() - pipelineStart;
        const profile: PipelineProfile = {
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
          totalPipeline: totalTime,
          frameCount: gif.frames.length,
          sampledFrameCount: rawFrames.length,
          sourceWidth: gif.width,
          sourceHeight: gif.height,
        };
        logProfile(profile);

      } catch {
        setError("Failed to process GIF. It may be corrupted.");
        dispatch({ type: "SET_LOADING", loading: false });
      }
    } else if (isWebP) {
      // Animated WebP → read buffer to check for animation frames
      dispatch({ type: "SET_LOADING", loading: true });
      const pipelineStart = performance.now();

      try {
        const buffer = await file.arrayBuffer();

        if (isAnimatedWebP(buffer)) {
          // Stage 1: Decode all WebP frames via ImageDecoder
          const decodeStart = performance.now();
          const targetWidth = state.canvas.asciiWidth;
          const webp = await decodeAnimatedWebP(buffer, targetWidth);
          const decodeTime = performance.now() - decodeStart;

          if (!webp.animated || webp.frames.length < 2) {
            throw new Error("Not an animated WebP");
          }

          // Stage 2: FPS Analysis
          const fpsStart = performance.now();
          const avgDelay = webp.frames.reduce((sum, f) => sum + f.delayMs, 0) / webp.frames.length;
          const sourceFps = Math.round(1000 / avgDelay);
          const sourceInterval = 1000 / sourceFps;
          const targetInterval = 1000 / TARGET_FPS;
          const frameStep = Math.max(1, Math.round(targetInterval / sourceInterval));
          const sampledIndices: number[] = [];
          for (let i = 0; i < webp.frames.length; i += frameStep) {
            sampledIndices.push(i);
          }
          const fpsTime = performance.now() - fpsStart;

          // Stage 3: Collect sampled frames
          const downsampleStart = performance.now();
          const rawFrames: ImageData[] = [];
          const timings: number[] = [];
          for (const idx of sampledIndices) {
            rawFrames.push(webp.frames[idx].imageData);
            timings.push(webp.frames[idx].delayMs);
          }
          const downsampleTime = performance.now() - downsampleStart;

          // Stage 4: First frame setup
          const firstScaled = webp.frames[0].imageData;
          const small = downscaleForDisplay(firstScaled, 400);
          const analysis = analyzeImage(firstScaled);

          const canvas = document.createElement("canvas");
          canvas.width = firstScaled.width;
          canvas.height = firstScaled.height;
          const ctx = canvas.getContext("2d")!;
          ctx.putImageData(firstScaled, 0, 0);
          const thumbUrl = canvas.toDataURL("image/png");

          dispatch({ type: "INIT_ANIMATION", rawFrames, timings, sourceFps });
          dispatch({ type: "SET_IMAGE", url: thumbUrl, imageData: firstScaled, smallImageData: small, analysis });

          const totalTime = performance.now() - pipelineStart;
          const profile: PipelineProfile = {
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
            totalPipeline: totalTime,
            frameCount: webp.frames.length,
            sampledFrameCount: rawFrames.length,
            sourceWidth: webp.width,
            sourceHeight: webp.height,
          };
          logProfile(profile);
        } else {
          // Static WebP — fall through to standard image path
          const url = URL.createObjectURL(file);
          const canvas = document.createElement("canvas");
          const imageData = await loadImageToCanvas(url, canvas);
          const scaled = downscaleImage(imageData, 2048);
          const small = downscaleForDisplay(scaled, 400);
          const analysis = analyzeImage(scaled);
          dispatch({ type: "SET_IMAGE", url, imageData: scaled, smallImageData: small, analysis });
        }

        dispatch({ type: "SET_LOADING", loading: false });
      } catch {
        setError("Failed to process WebP image.");
        dispatch({ type: "SET_LOADING", loading: false });
      }
    } else {
      const url = URL.createObjectURL(file);
      dispatch({ type: "SET_LOADING", loading: true });
      try {
        const canvas = document.createElement("canvas");
        const imageData = await loadImageToCanvas(url, canvas);
        const scaled = downscaleImage(imageData, 2048);
        const small = downscaleForDisplay(scaled, 400);
        const analysis = analyzeImage(scaled);
        dispatch({ type: "SET_IMAGE", url, imageData: scaled, smallImageData: small, analysis });
      } catch {
        setError("Failed to process image.");
        dispatch({ type: "SET_LOADING", loading: false });
      }
    }
  };

  const handleSample = (sample: typeof SAMPLE_IMAGES[number]) => {
    dispatch({ type: "SET_LOADING", loading: true });
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) { dispatch({ type: "SET_LOADING", loading: false }); return; }
    sample.generate(ctx, 800, 600);
    const imageData = ctx.getImageData(0, 0, 800, 600);
    const scaled = downscaleImage(imageData, 2048);
    const small = downscaleForDisplay(scaled, 400);
    const analysis = analyzeImage(scaled);
    const url = canvas.toDataURL("image/png");
    dispatch({ type: "SET_IMAGE", url, imageData: scaled, smallImageData: small, analysis });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`flex min-h-[300px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
          dragging
            ? "border-emerald-500 bg-emerald-500/10"
            : "border-zinc-700 bg-zinc-900/50 hover:border-emerald-500/50 hover:bg-zinc-800/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleChange}
          className="hidden"
        />
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/80 text-zinc-400">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-sm text-zinc-300">
          Drop an image to begin
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          or <span className="text-emerald-400 underline">browse</span> your files
        </p>
        <p className="mt-2 text-[10px] text-zinc-600">JPG, PNG, WEBP, or GIF</p>
        {error && (
          <p className="mt-3 rounded-md bg-red-500/10 px-3 py-1.5 text-xs text-red-400">{error}</p>
        )}
      </div>

      <div className="mt-6 w-full">
        <p className="mb-3 text-center text-xs text-zinc-500">Or try a sample</p>
        <div className="grid grid-cols-5 gap-2">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSample(sample)}
              className="group flex flex-col items-center rounded-lg bg-zinc-900/50 p-2 transition-all hover:bg-zinc-800/80"
            >
              <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-800/80 text-xl">
                {sample.icon}
              </div>
              <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300">{sample.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
