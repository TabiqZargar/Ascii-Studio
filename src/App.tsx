import { useState, useRef, useCallback, useEffect } from "react";
import Navbar from "./components/Navbar";
import Upload from "./components/Upload";
import Controls from "./components/Controls";
import ImagePreview from "./components/ImagePreview";
import AsciiPreview from "./components/AsciiPreview";
import Toolbar from "./components/Toolbar";
import { imageDataToAscii } from "./utils/ascii";
import { loadImageToCanvas } from "./utils/image";
import type { AsciiSettings } from "./types";

const DEFAULT_SETTINGS: AsciiSettings = {
  density: 5,
  brightness: 0,
  contrast: 1,
};

export default function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ascii, setAscii] = useState("");
  const [settings, setSettings] = useState<AsciiSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevImageUrl = useRef<string | null>(null);

  const regenerate = useCallback(
    async (url: string, s: AsciiSettings) => {
      if (!canvasRef.current) return;
      setLoading(true);
      try {
        const imageData = await loadImageToCanvas(url, canvasRef.current);
        const output = imageDataToAscii(
          imageData,
          s.density,
          s.brightness,
          s.contrast
        );
        setAscii(output);
      } catch {
        setAscii("");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (imageUrl) {
      regenerate(imageUrl, settings);
    }
  }, [imageUrl, settings, regenerate]);

  const handleUpload = (url: string) => {
    if (prevImageUrl.current) {
      URL.revokeObjectURL(prevImageUrl.current);
    }
    prevImageUrl.current = url;
    setImageUrl(url);
  };

  const handleChangeImage = () => {
    if (prevImageUrl.current) {
      URL.revokeObjectURL(prevImageUrl.current);
      prevImageUrl.current = null;
    }
    setImageUrl(null);
    setAscii("");
  };

  useEffect(() => {
    return () => {
      if (prevImageUrl.current) {
        URL.revokeObjectURL(prevImageUrl.current);
      }
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-200">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            {!imageUrl ? (
              <Upload onUpload={handleUpload} />
            ) : (
              <ImagePreview
                imageUrl={imageUrl}
                onChangeImage={handleChangeImage}
              />
            )}
          </div>

          <AsciiPreview ascii={ascii} loading={loading} />
        </div>

        <div className="mb-4">
          <Controls settings={settings} onChange={setSettings} />
        </div>

        <div className="flex justify-center">
          <Toolbar ascii={ascii} disabled={!ascii} />
        </div>
      </main>

      <footer className="border-t border-zinc-800 py-4 text-center text-xs text-zinc-600">
        GlyphLab — All processing happens locally in your browser
      </footer>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
