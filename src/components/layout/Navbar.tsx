import { useApp, useDispatch } from "../../context/AppContext";
import { STYLE_PRESETS } from "../../data/presets";

export default function Navbar() {
  const state = useApp();
  const dispatch = useDispatch();

  return (
    <nav className="flex items-center justify-between border-b border-zinc-800/50 bg-zinc-900/50 px-4 py-2 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
          A
        </div>
        <div>
          <span className="text-sm font-semibold text-zinc-100">ASCII Studio</span>
          <p className="text-[10px] text-zinc-500 hidden sm:block">Turn images into beautiful ASCII art</p>
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto max-w-[60%]">
        <span className="mr-1 text-[10px] text-zinc-600 hidden md:inline">Styles:</span>
        {STYLE_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => dispatch({ type: "SET_STYLE_PRESET", presetId: p.id })}
            className={`whitespace-nowrap rounded-lg px-2 py-1 text-[11px] transition-all ${
              state.charPresetId === p.charPresetId && state.colorMode === p.colorMode
                ? "bg-emerald-600 text-white"
                : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200"
            }`}
            title={p.name}
          >
            <span className="mr-1">{p.icon}</span>
            <span className="hidden lg:inline">{p.name}</span>
          </button>
        ))}
        <button
          onClick={() => dispatch({ type: "SURPRISE_ME" })}
          className="whitespace-nowrap rounded-lg bg-zinc-800/50 px-2 py-1 text-[11px] text-zinc-400 hover:bg-emerald-600/20 hover:text-emerald-400 transition-all"
          title="Surprise Me"
        >
          🎲
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => dispatch({ type: "TOGGLE_COMPARISON" })}
          className={`rounded-lg px-2 py-1 text-xs transition-all ${state.comparisonMode ? "bg-emerald-600 text-white" : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50"}`}
          title="Compare"
        >
          ⟺
        </button>
        <button
          onClick={() => dispatch({ type: "TOGGLE_FULLSCREEN" })}
          className="rounded-lg bg-zinc-800/50 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-700/50 transition-all"
          title="Fullscreen"
        >
          ⛶
        </button>
      </div>
    </nav>
  );
}
