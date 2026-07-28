import { useRef, useCallback } from "react";
import { useApp, useDispatch } from "../../context/AppContext";
import { processUploadedFile } from "../../utils/processFile";
import type { LuminanceFormula, TransparencyBg } from "../../types";

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
    <section className="relative z-10 w-full h-screen overflow-y-auto riso-grain font-body">
      <nav className="fixed top-4 left-4 right-4 rounded-lg border border-primary bg-surface flex justify-between items-center px-4 py-2 z-50">
        <div className="font-headline text-lg text-primary uppercase tracking-tighter">ASCII.STUDIO</div>
        <div className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">RISO_CORE_V2</div>
      </nav>

      <main className="pt-32 pb-24 px-4 max-w-5xl mx-auto">
        <section className="mb-12 lg:mb-20">
          <h1 className="font-headline text-5xl md:text-7xl lg:text-[100px] leading-[0.9] tracking-tighter mb-4">
            <span className="block">WHERE</span>
            <span className="block italic text-secondary">ANCIENT SCRIPT</span>
            <span className="block text-on-surface">MEETS DIGITAL SOUL</span>
          </h1>
          <p className="font-body text-on-surface-variant text-sm max-w-lg leading-relaxed">
            A Risograph-inspired ASCII engine. Convert images, GIFs, and animated WebPs into high-fidelity ASCII art.
          </p>
        </section>

        <section className="mb-20">
          <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden" onChange={onChange} />
          <div
            className="group relative w-full h-[400px] sm:h-[500px] border border-dashed border-primary bg-surface-container-lowest flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-all hover:bg-surface-container-low"
            onClick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="relative z-10 flex flex-col items-center text-center px-6">
              <div className="w-20 h-20 rounded-full border border-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform bg-surface">
                <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  upload_file
                </span>
              </div>
              <h2 className="font-headline text-3xl sm:text-4xl mb-2 uppercase tracking-widest text-primary">Initiate Transmission</h2>
              <p className="font-label-caps text-on-surface-variant mb-6 text-[11px] tracking-wider">DROP YOUR SOURCE MATERIAL (JPG, PNG, GIF, WEBP)</p>
              <button
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                className="bg-primary text-on-primary px-6 py-2.5 font-label-caps tracking-widest transition-all text-[11px] button-riso-offset uppercase"
              >
                SELECT FILES
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 justify-center">
            <button
              onClick={() => dispatch({ type: "SET_ADJUSTMENTS", adj: { invert: !state.adjustments.invert } })}
              className={`flex items-center gap-2 rounded-sm px-3 py-1.5 text-[10px] font-label-caps border transition-all tracking-wider ${
                state.adjustments.invert
                  ? "bg-secondary/20 text-secondary border-secondary"
                  : "bg-surface-container-high text-on-surface-variant border-outline-variant hover:border-tertiary hover:text-tertiary"
              }`}
            >
              <span className={`material-symbols-outlined text-[14px] ${state.adjustments.invert ? "text-secondary" : ""}`}>
                {state.adjustments.invert ? "toggle_on" : "toggle_off"}
              </span>
              INVERT
            </button>

            <div className="flex items-center gap-2">
              <label className="font-label-caps text-[9px] text-on-surface-variant tracking-wider">LUMINANCE</label>
              <select
                value={state.luminanceFormula}
                onChange={(e) => dispatch({ type: "SET_LUMINANCE_FORMULA", formula: e.target.value as LuminanceFormula })}
                className="rounded-sm border border-outline-variant bg-surface-container px-2 py-1.5 text-[10px] font-label-caps text-on-surface outline-none focus:border-tertiary transition-colors tracking-wider appearance-none cursor-pointer"
              >
                <option value="perceived">Perceived</option>
                <option value="average">Average</option>
                <option value="max">Max</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-label-caps text-[9px] text-on-surface-variant tracking-wider">TRANSP. BG</label>
              <select
                value={state.transparencyBg}
                onChange={(e) => dispatch({ type: "SET_TRANSPARENCY_BG", bg: e.target.value as TransparencyBg })}
                className="rounded-sm border border-outline-variant bg-surface-container px-2 py-1.5 text-[10px] font-label-caps text-on-surface outline-none focus:border-tertiary transition-colors tracking-wider appearance-none cursor-pointer"
              >
                <option value="white">White</option>
                <option value="black">Black</option>
                <option value="checkerboard">Checker</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {state.transparencyBg === "custom" && (
              <input
                type="color"
                value={state.transparencyCustomColor}
                onChange={(e) => dispatch({ type: "SET_TRANSPARENCY_CUSTOM_COLOR", color: e.target.value })}
                className="h-7 w-7 cursor-pointer border-0 bg-transparent"
              />
            )}
          </div>
        </section>
      </main>
    </section>
  );
}
