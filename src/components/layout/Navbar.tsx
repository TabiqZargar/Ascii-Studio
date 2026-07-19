import { useApp, useDispatch } from "../../context/AppContext";
import { STYLE_PRESETS } from "../../data/presets";

export default function Navbar() {
  const state = useApp();
  const dispatch = useDispatch();

  return (
    <nav className="fixed top-3 left-3 right-3 z-50 flex items-center justify-between px-6 py-2 rounded-xl bg-surface/60 backdrop-blur-xl border border-outline-variant/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      <div className="font-headline text-lg font-black text-primary">ASCII Studio</div>

      <div className="hidden md:flex items-center gap-8">
        {STYLE_PRESETS.slice(0, 6).map((p) => (
          <button
            key={p.id}
            onClick={() => dispatch({ type: "SET_STYLE_PRESET", presetId: p.id })}
            className={`text-sm font-medium transition-colors ${
              state.charPresetId === p.charPresetId && state.colorMode === p.colorMode
                ? "text-primary border-b-2 border-primary pb-1"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => dispatch({ type: "TOGGLE_COMPARISON" })}
          className={`p-2 rounded-full transition-all ${
            state.comparisonMode ? "bg-primary/20 text-primary" : "text-on-surface-variant hover:bg-white/5"
          }`}
          title="Compare"
        >
          <span className="material-symbols-outlined">compare</span>
        </button>
        <button
          onClick={() => dispatch({ type: "TOGGLE_FULLSCREEN" })}
          className="p-2 text-on-surface-variant hover:bg-white/5 rounded-full transition-all"
          title="Fullscreen"
        >
          <span className="material-symbols-outlined">fullscreen</span>
        </button>
        <button
          className="p-2 text-on-surface-variant hover:bg-white/5 rounded-full transition-all"
          title="Settings"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>
    </nav>
  );
}
