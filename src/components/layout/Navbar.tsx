import { useApp, useDispatch } from "../../context/AppContext";

export default function Navbar() {
  const state = useApp();
  const dispatch = useDispatch();

  return (
    <header
      className="fixed top-4 left-4 right-4 rounded-lg bg-surface flex justify-between items-center px-4 py-2 z-50 border border-primary"
      style={{ paddingTop: "calc(0.5rem + env(safe-area-inset-top, 0px))" }}
    >
      <div className="flex items-center gap-6">
        <h1 className="font-headline text-lg sm:text-xl text-primary uppercase tracking-tighter">
          ASCII.STUDIO
        </h1>
        <nav className="hidden md:flex items-center gap-4">
          {[
            { id: "upload", label: "Gallery" },
            { id: "characters", label: "Presets" },
            { id: "layers", label: "Layers" },
            { id: "export", label: "Export" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                dispatch({ type: "SET_COLOR_MODE", mode: state.colorMode });
              }}
              className="font-label-caps text-[11px] text-on-surface-variant hover:text-primary transition-all tracking-wider"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch({ type: "TOGGLE_COMPARISON" })}
          className={`bg-primary-container text-on-primary-container px-4 py-1.5 rounded-sm font-label-caps text-[11px] uppercase tracking-widest active:translate-y-0.5 transition-all button-riso-offset ${
            state.comparisonMode ? "ring-1 ring-primary" : ""
          }`}
        >
          Mint Art
        </button>
        <div className="flex items-center gap-2">
          <button
            className="text-primary cursor-pointer hover:opacity-80 transition-opacity"
            title="Settings"
          >
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>
          <button
            className="text-primary cursor-pointer hover:opacity-80 transition-opacity"
            title="Fullscreen"
            onClick={() => dispatch({ type: "TOGGLE_FULLSCREEN" })}
          >
            <span className="material-symbols-outlined text-xl">fullscreen</span>
          </button>
        </div>
      </div>
    </header>
  );
}
