import { useRef, useState, useEffect } from "react";
import { useApp, useDispatch } from "../../context/AppContext";

import {
  downscaleImage,
  downscaleForDisplay,
  analyzeImage,
} from "../../utils/image";
import { SAMPLE_IMAGES } from "../../data/presets";
import { processUploadedFile } from "../../utils/processFile";

console.log("[PIPELINE] Stage 1: Upload.tsx module evaluated");

const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.gif";

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
    console.log("[PIPELINE] Stage 3: handleFile called");
    setError(null);
    await processUploadedFile(file, dispatch, state.canvas.asciiWidth, {
      onError: setError,
    });
  };

  const handleSample = (sample: (typeof SAMPLE_IMAGES)[number]) => {
    dispatch({ type: "SET_LOADING", loading: true });
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      dispatch({ type: "SET_LOADING", loading: false });
      return;
    }
    sample.generate(ctx, 800, 600);
    const imageData = ctx.getImageData(0, 0, 800, 600);
    const scaled = downscaleImage(imageData, 2048);
    const small = downscaleForDisplay(scaled, 400);
    const analysis = analyzeImage(scaled);
    const url = canvas.toDataURL("image/png");
    dispatch({
      type: "SET_IMAGE",
      url,
      imageData: scaled,
      smallImageData: small,
      analysis,
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    console.log("[PIPELINE] Stage 2: handleDrop called");
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[PIPELINE] Stage 2: handleChange called");
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
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
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-sm text-zinc-300">Drop an image to begin</p>
        <p className="mt-1 text-xs text-zinc-500">
          or <span className="text-emerald-400 underline">browse</span> your
          files
        </p>
        <p className="mt-2 text-[10px] text-zinc-600">JPG, PNG, WEBP, or GIF</p>
        {error && (
          <p className="mt-3 rounded-md bg-red-500/10 px-3 py-1.5 text-xs text-red-400">
            {error}
          </p>
        )}
      </div>

      <div className="mt-6 w-full">
        <p className="mb-3 text-center text-xs text-zinc-500">
          Or try a sample
        </p>
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
              <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300">
                {sample.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
