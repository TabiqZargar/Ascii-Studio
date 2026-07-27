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
    <section className="relative z-10 w-full h-screen overflow-y-auto riso-grain font-body">
      {/* Top Nav */}
      <nav className="fixed top-4 left-4 right-4 rounded-lg border border-primary bg-surface flex justify-between items-center px-4 py-2 z-50">
        <div className="font-headline text-lg text-primary uppercase tracking-tighter">ASCII.STUDIO</div>
        <div className="hidden md:flex gap-6 items-center">
          {["Gallery", "Presets", "Layers", "Export"].map((item) => (
            <a key={item} className="font-label-caps text-[11px] text-on-surface-variant hover:text-primary transition-all tracking-wider cursor-pointer">
              {item}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-primary-container text-on-primary-container px-4 py-1.5 rounded-sm font-label-caps text-[11px] uppercase tracking-widest active:translate-y-0.5 transition-all button-riso-offset">
            Mint Art
          </button>
          <span className="material-symbols-outlined text-primary cursor-pointer">settings</span>
          <span className="material-symbols-outlined text-primary cursor-pointer">account_circle</span>
        </div>
      </nav>

      {/* Left Toolset */}
      <aside className="fixed left-4 top-24 bottom-24 w-20 rounded-lg border border-secondary bg-surface flex flex-col items-center py-4 gap-3 z-40 hidden lg:flex">
        <div className="text-secondary mb-2">
          <div className="font-label-caps text-[10px] opacity-60 text-center tracking-wider">TOOLSET</div>
        </div>
        <div className="flex flex-col gap-2 w-full px-2">
          <button className="bg-secondary text-on-secondary rounded-sm p-2 flex flex-col items-center justify-center transition-transform active:scale-95">
            <span className="material-symbols-outlined">near_me</span>
            <span className="font-label-caps text-[8px] mt-1 tracking-wider">SELECT</span>
          </button>
          <button className="text-secondary p-2 flex flex-col items-center justify-center hover:bg-secondary-container hover:text-on-secondary-container transition-all">
            <span className="material-symbols-outlined">edit</span>
            <span className="font-label-caps text-[8px] mt-1 tracking-wider">DRAW</span>
          </button>
          <button className="text-secondary p-2 flex flex-col items-center justify-center hover:bg-secondary-container hover:text-on-secondary-container transition-all">
            <span className="material-symbols-outlined">format_size</span>
            <span className="font-label-caps text-[8px] mt-1 tracking-wider">TYPE</span>
          </button>
          <button className="text-secondary p-2 flex flex-col items-center justify-center hover:bg-secondary-container hover:text-on-secondary-container transition-all">
            <span className="material-symbols-outlined">movie</span>
            <span className="font-label-caps text-[8px] mt-1 tracking-wider">ANIMATE</span>
          </button>
        </div>
        <div className="mt-auto border-t border-secondary/20 pt-3 w-full flex justify-center">
          <span className="material-symbols-outlined text-secondary cursor-pointer">help_outline</span>
        </div>
      </aside>

      {/* Right Properties Panel */}
      <aside className="fixed right-4 top-24 bottom-24 w-64 rounded-lg border border-tertiary bg-surface flex flex-col p-4 z-40 hidden xl:flex floating-panel">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-tertiary rounded-sm flex items-center justify-center">
            <span className="material-symbols-outlined text-on-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          </div>
          <div>
            <div className="font-label-caps text-[12px] text-tertiary tracking-wider">PROPERTIES</div>
            <div className="font-label-caps text-[8px] opacity-60 tracking-wider">ASCII_LAYER_01</div>
          </div>
        </div>
        <div className="space-y-4 flex-1">
          <div className="p-2 border-l-2 border-tertiary">
            <div className="font-label-caps text-[10px] text-tertiary tracking-wider">ACTIVE TAB</div>
            <div className="font-headline text-lg">Inspector</div>
          </div>
          <div className="pl-2 space-y-4 pt-2">
            <div>
              <label className="font-label-caps text-[10px] block mb-2 tracking-wider">DENSITY</label>
              <div className="h-1 bg-surface-variant relative">
                <div className="absolute left-0 top-0 h-full w-2/3 bg-tertiary" />
                <div className="absolute left-2/3 top-1/2 -translate-y-1/2 w-3 h-3 bg-tertiary rounded-full" />
              </div>
            </div>
            <div>
              <label className="font-label-caps text-[10px] block mb-2 tracking-wider">KERNING</label>
              <div className="grid grid-cols-4 gap-1">
                {["TIGHT", "NORM", "WIDE", "MAX"].map((k, i) => (
                  <div key={k} className={`h-6 flex items-center justify-center text-[10px] font-label-caps tracking-wider ${i === 1 ? "bg-tertiary text-on-tertiary" : "bg-tertiary/20 border border-tertiary/40"}`}>
                    {k}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-auto space-y-2">
          <div className="flex items-center gap-2 text-on-surface-variant hover:text-tertiary transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-sm">slow_motion_video</span>
            <span className="font-label-caps text-[10px] tracking-wider">MOTION</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant hover:text-tertiary transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            <span className="font-label-caps text-[10px] tracking-wider">POST-FX</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant hover:text-tertiary transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-sm">history</span>
            <span className="font-label-caps text-[10px] tracking-wider">HISTORY</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pt-32 pb-24 px-4 lg:pl-32 lg:pr-72 max-w-[1400px] mx-auto">
        {/* Hero Section */}
        <section className="mb-12 lg:mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-8">
              <h1 className="font-headline text-5xl md:text-7xl lg:text-[100px] leading-[0.9] tracking-tighter mb-4">
                <span className="block">WHERE</span>
                <span className="block italic text-secondary">ANCIENT SCRIPT</span>
                <span className="block text-on-surface">MEETS DIGITAL SOUL</span>
              </h1>
            </div>
            <div className="lg:col-span-4 pb-2">
              <p className="font-body text-on-surface-variant text-sm max-w-xs mb-4 border-l border-tertiary pl-4 leading-relaxed">
                Deconstructing the pixels of today through the character-matrix of antiquity. A Risograph-inspired ASCII engine for the modern editorial soul.
              </p>
            </div>
          </div>
        </section>

        {/* Upload Zone */}
        <section className="mb-20">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={onChange}
          />
          <div
            className="group relative w-full h-[400px] sm:h-[500px] border border-dashed border-primary bg-surface-container-lowest flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-all hover:bg-surface-container-low"
            onClick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="absolute top-4 left-4 font-label-caps text-primary text-[10px] tracking-wider">RISO_STREAK_V2.0</div>
            <div className="absolute bottom-4 right-4 font-label-caps text-secondary text-[10px] tracking-wider">TRANSMISSION_READY</div>

            <div className="relative z-10 flex flex-col items-center text-center px-6">
              <div className="w-20 h-20 rounded-full border border-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform bg-surface">
                <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  upload_file
                </span>
              </div>
              <h2 className="font-headline text-3xl sm:text-4xl mb-2 uppercase tracking-widest text-primary">Initiate Transmission</h2>
              <p className="font-label-caps text-on-surface-variant mb-6 text-[11px] tracking-wider">DROP YOUR SOURCE MATERIAL (JPG, PNG, GIF, WEBP)</p>
              <div className="flex gap-4">
                <button
                  onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                  className="bg-primary text-on-primary px-6 py-2.5 font-label-caps tracking-widest hover-misprint transition-all text-[11px] button-riso-offset uppercase"
                >
                  SELECT FILES
                </button>
                <button className="border border-secondary text-secondary px-6 py-2.5 font-label-caps tracking-widest hover:bg-secondary/10 transition-all text-[11px] uppercase">
                  LIVE FEED
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="pt-8 border-t border-outline-variant" id="gallery">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="font-headline text-2xl sm:text-3xl uppercase tracking-tighter">Archives of Expression</h3>
              <p className="font-label-caps text-tertiary mt-1 text-[11px] tracking-wider">CURATED HUMAN-MACHINE DIALOGUES</p>
            </div>
            <div className="hidden md:flex gap-2">
              <span className="material-symbols-outlined p-2 border border-outline-variant hover:border-primary cursor-pointer transition-colors text-sm">grid_view</span>
              <span className="material-symbols-outlined p-2 border border-outline-variant hover:border-primary cursor-pointer transition-colors text-sm">view_agenda</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "Neoclassical Matrix", tag: "VOYAGE_01", tagColor: "bg-tertiary text-on-tertiary", author: "@USER_882", authorColor: "text-tertiary", quote: '"The ghost in the marble is just code waiting to be compiled."' },
              { title: "Cyber-Pulp Sprawl", tag: "KINETIC", tagColor: "bg-secondary text-on-secondary", author: "@RISO_BOT", authorColor: "text-secondary", quote: '"Density is the only truth in a world of variables."' },
              { title: "Textural Synthesis", tag: "MACRO_04", tagColor: "bg-primary text-on-primary", author: "@ANALOG_DNA", authorColor: "text-primary", quote: '"Where the fiber meets the binary."' },
            ].map((card) => (
              <div key={card.title} className="group border border-outline-variant bg-surface-container p-4 transition-all hover:border-tertiary">
                <div className="relative w-full aspect-square mb-3 overflow-hidden bg-black rounded-sm">
                  <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
                    <span className="font-mono text-4xl text-on-surface-variant/30 group-hover:text-on-surface-variant/60 transition-all">ASCII</span>
                  </div>
                  <div className={`absolute top-2 right-2 ${card.tagColor} px-2 py-1 font-label-caps text-[10px] tracking-wider`}>{card.tag}</div>
                </div>
                <h4 className="font-headline text-lg mb-1">{card.title}</h4>
                <p className="text-on-surface-variant text-xs mb-3 italic leading-relaxed">{card.quote}</p>
                <div className="flex justify-between items-center pt-2 border-t border-outline-variant/30">
                  <span className={`font-label-caps text-[10px] ${card.authorColor} tracking-wider`}>{card.author}</span>
                  <span className="material-symbols-outlined text-sm cursor-pointer hover:text-primary">favorite</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button className="font-label-caps text-on-surface-variant border-b border-on-surface-variant pb-1 hover:text-primary hover:border-primary transition-all text-[11px] tracking-wider">
              EXPLORE FULL ARCHIVE (512+)
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-4 left-4 right-4 h-12 rounded-lg border border-outline-variant bg-surface flex justify-between items-center px-4 z-50">
        <div className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">
          ASCII ART STUDIO | <span className="text-primary">RISO_CORE_V2</span>
        </div>
        <div className="flex gap-6">
          {["Docs", "Discord", "GitHub"].map((link) => (
            <a key={link} className="font-label-caps text-[10px] text-on-surface-variant hover:text-primary active:opacity-80 transition-all tracking-wider cursor-pointer">
              {link}
            </a>
          ))}
        </div>
      </footer>
    </section>
  );
}
