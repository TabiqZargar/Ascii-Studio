import { useRef, useCallback } from "react";
import { useApp, useDispatch } from "../../context/AppContext";
import { processUploadedFile } from "../../utils/processFile";

interface Props {
  onEnterWorkspace: () => void;
}

const ACCEPTED = ".jpg,.jpeg,.png,.webp,.gif";

export default function LandingPage({ onEnterWorkspace }: Props) {
  const state = useApp();
  const dispatch = useDispatch();
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    await processUploadedFile(file, dispatch, state.canvas.asciiWidth, {
      onSuccess: onEnterWorkspace,
    });
  }, [dispatch, state.canvas.asciiWidth, onEnterWorkspace]);

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
    <section className="relative z-10 w-full h-screen overflow-y-auto flex flex-col items-center py-16 sm:py-24 min-h-screen transition-all duration-700">
      <div className="flex flex-col items-center text-center max-w-4xl px-4 sm:px-6 mt-12 sm:mt-24">
        <div className="ascii-logo mb-4 sm:mb-6 select-none font-mono text-[2.5rem] sm:text-[4rem] md:text-[6rem] leading-none text-primary">
          <pre className="text-center">{`  ____  ____  ____
 /  _/ /  _/ /  _/
_/ /  _/ /  _/ /
/___/ /___/ /___/ `}</pre>
        </div>
        <h1 className="font-headline text-[28px] sm:text-[36px] md:text-[48px] leading-tight font-semibold tracking-tight mb-3 sm:mb-4 text-on-surface">
          Turn Anything Into ASCII Art
        </h1>
        <p className="text-sm sm:text-base leading-relaxed text-on-surface-variant mb-8 sm:mb-12 max-w-2xl">
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
          className="group relative w-full max-w-xl h-48 sm:h-64 glass-panel rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-500 hover:shadow-[0_0_80px_rgba(16,185,129,0.15)]"
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="absolute inset-0 running-ants opacity-20 group-hover:opacity-60 transition-opacity" />
          <div className="z-20 flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-container rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-on-primary-container text-3xl sm:text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                upload_file
              </span>
            </div>
            <span className="text-base sm:text-lg font-semibold text-on-surface">Upload Your Media</span>
            <span className="text-sm sm:text-base text-on-surface-variant">Drag and drop or click to browse</span>
          </div>
        </div>
      </div>

      <div className="relative px-4 sm:px-6 mt-12 sm:mt-24 w-full max-w-4xl">
        <div className="flex justify-center gap-3 sm:gap-6 overflow-x-auto pb-4">
          {[
            { name: "Portrait", icon: "\u{1F464}" },
            { name: "Landscape", icon: "\u{1F3D4}\u{FE0F}" },
            { name: "Cyberpunk", icon: "\u{1F303}" },
            { name: "Anime", icon: "\u{1F3A8}" },
          ].map((item) => (
            <div key={item.name} className="min-w-[140px] sm:min-w-[200px] h-24 sm:h-32 glass-panel rounded-xl flex flex-col p-3 sm:p-4 hover:-translate-y-2 transition-all duration-300 cursor-pointer">
              <div className="flex-grow rounded-lg mb-2 overflow-hidden bg-surface-container-highest flex items-center justify-center">
                <span className="text-2xl sm:text-3xl opacity-60">{item.icon}</span>
              </div>
              <span className="text-[10px] sm:text-xs font-mono text-on-surface-variant">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
