import { useRef, useCallback } from "react";
import { useDispatch } from "../../context/AppContext";
import { loadImageToCanvas, downscaleImage, downscaleForDisplay, analyzeImage } from "../../utils/image";

interface Props {
  onEnterWorkspace: () => void;
}

const ACCEPTED = ".jpg,.jpeg,.png,.webp,.gif";

export default function LandingPage({ onEnterWorkspace }: Props) {
  const dispatch = useDispatch();
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    dispatch({ type: "SET_LOADING", loading: true });
    try {
      const url = URL.createObjectURL(file);
      const canvas = document.createElement("canvas");
      const imageData = await loadImageToCanvas(url, canvas);
      const scaled = downscaleImage(imageData, 2048);
      const small = downscaleForDisplay(scaled, 400);
      const analysis = analyzeImage(scaled);
      dispatch({ type: "SET_IMAGE", url, imageData: scaled, smallImageData: small, analysis });
      onEnterWorkspace();
    } catch {
      dispatch({ type: "SET_LOADING", loading: false });
    }
  }, [dispatch, onEnterWorkspace]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }, [processFile]);

  return (
    <section className="relative z-10 w-full h-screen overflow-y-auto flex flex-col items-center py-24 min-h-screen transition-all duration-700">
      <div className="flex flex-col items-center text-center max-w-4xl px-6 mt-24">
        <div className="ascii-logo mb-6 select-none font-mono text-[4rem] md:text-[6rem] leading-none text-primary">
          <pre className="text-center">{`  ____  ____  ____
 /  _/ /  _/ /  _/
_/ /  _/ /  _/ /  
/___/ /___/ /___/ `}</pre>
        </div>
        <h1 className="font-headline text-[48px] md:text-[32px] leading-tight font-semibold tracking-tight mb-4 text-on-surface">
          Turn Anything Into ASCII Art
        </h1>
        <p className="text-base leading-relaxed text-on-surface-variant mb-12 max-w-2xl">
          Create stunning monochrome and color ASCII art from images, GIFs, videos, and live camera input with professional-grade fidelity.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={onChange}
        />
        <div
          className="group relative w-full max-w-xl h-64 glass-panel rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-500 hover:shadow-[0_0_80px_rgba(16,185,129,0.15)]"
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="absolute inset-0 running-ants opacity-20 group-hover:opacity-60 transition-opacity" />
          <div className="z-20 flex flex-col items-center">
            <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mb-4 shadow-lg group-active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-on-primary-container text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                upload_file
              </span>
            </div>
            <span className="text-lg font-semibold text-on-surface">Upload Your Media</span>
            <span className="text-base text-on-surface-variant">Drag and drop or click to browse</span>
          </div>
        </div>
      </div>

      <div className="relative px-6 mt-24 w-full max-w-4xl">
        <div className="flex justify-center gap-6 overflow-x-auto pb-4">
          {[
            { name: "Portrait", icon: "👤" },
            { name: "Landscape", icon: "🏔️" },
            { name: "Cyberpunk", icon: "🌃" },
            { name: "Anime", icon: "🎨" },
          ].map((item) => (
            <div key={item.name} className="min-w-[200px] h-32 glass-panel rounded-xl flex flex-col p-4 hover:-translate-y-2 transition-all duration-300 cursor-pointer">
              <div className="flex-grow rounded-lg mb-2 overflow-hidden bg-surface-container-highest flex items-center justify-center">
                <span className="text-3xl opacity-60">{item.icon}</span>
              </div>
              <span className="text-xs font-mono text-on-surface-variant">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
