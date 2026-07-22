import { useApp, useDispatch } from "../../context/AppContext";
import { STYLE_PRESETS } from "../../data/presets";

export default function Navbar() {
  const state = useApp();
  const dispatch = useDispatch();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 sm:px-6 h-14 sm:h-16 rounded-xl mt-2 sm:mt-4 mx-2 sm:mx-12 bg-surface-container/60 backdrop-blur-xl border border-primary/15 shadow-2xl animate-float">
      <div className="flex items-center gap-3">
        <div className="font-headline text-lg sm:text-2xl font-extrabold text-primary tracking-tighter">ASCII Studio</div>
      </div>

      <div className="hidden lg:flex items-center gap-8">
        {STYLE_PRESETS.slice(0, 6).map((p) => (
          <button
            key={p.id}
            onClick={() => dispatch({ type: "SET_STYLE_PRESET", presetId: p.id })}
            className={`text-sm font-medium transition-colors ${
              state.charPresetId === p.charPresetId && state.colorMode === p.colorMode
                ? "text-primary border-b-2 border-primary pb-1"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => dispatch({ type: "TOGGLE_COMPARISON" })}
          className={`p-2 rounded-full transition-all duration-300 neon-glow ${
            state.comparisonMode ? "bg-primary/20 text-primary" : "text-on-surface-variant hover:bg-primary/10"
          }`}
          title="Compare"
        >
          <span className="material-symbols-outlined text-[20px] sm:text-[24px]">compare</span>
        </button>
        <button
          onClick={() => dispatch({ type: "TOGGLE_FULLSCREEN" })}
          className="p-2 text-on-surface-variant hover:bg-primary/10 rounded-full transition-all duration-300 neon-glow"
          title="Fullscreen"
        >
          <span className="material-symbols-outlined text-[20px] sm:text-[24px]">fullscreen</span>
        </button>
        <button
          className="p-2 text-on-surface-variant hover:bg-primary/10 rounded-full transition-all duration-300 neon-glow hidden sm:block"
          title="Settings"
        >
          <span className="material-symbols-outlined text-[20px] sm:text-[24px]">settings</span>
        </button>
      </div>
    </nav>
  );
}
