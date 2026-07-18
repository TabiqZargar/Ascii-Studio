import { useRef, useState } from "react";
import { useDispatch } from "../../context/AppContext";
import { loadImageToCanvas, downscaleImage } from "../../utils/image";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function Upload() {
  const dispatch = useDispatch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WEBP image.");
      return;
    }
    const url = URL.createObjectURL(file);
    dispatch({ type: "SET_LOADING", loading: true });
    try {
      const canvas = document.createElement("canvas");
      const imageData = await loadImageToCanvas(url, canvas);
      const scaled = downscaleImage(imageData, 2048);
      dispatch({ type: "SET_IMAGE", url, imageData: scaled });
    } catch {
      setError("Failed to process image.");
      dispatch({ type: "SET_LOADING", loading: false });
    }
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
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onClick={() => inputRef.current?.click()}
      className={`flex min-h-[400px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
        dragging
          ? "border-violet-500 bg-violet-500/10"
          : "border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800/50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleChange}
        className="hidden"
      />
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <p className="text-sm text-zinc-400">
        Drop an image here or{" "}
        <span className="text-violet-400 underline">browse</span>
      </p>
      <p className="mt-1 text-xs text-zinc-600">JPG, PNG, or WEBP</p>
      {error && (
        <p className="mt-3 rounded-md bg-red-500/10 px-3 py-1.5 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
