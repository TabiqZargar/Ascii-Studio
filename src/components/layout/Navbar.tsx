import { useApp, useDispatch } from "../../context/AppContext";
import { STYLE_PRESETS } from "../../data/presets";

export default function Navbar() {
  const state = useApp();
  const dispatch = useDispatch();

  return (
    <nav className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-2 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-600 text-xs font-bold text-white">
          G
        </div>
        <span className="text-sm font-semibold text-zinc-100">GlyphLab</span>
      </div>

      {/* Style Presets */}
      <div className="flex items-center gap-1 overflow-x-auto">
        <span className="mr-2 text-xs text-zinc-600">Presets:</span>
        {STYLE_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => dispatch({ type: "SET_STYLE_PRESET", presetId: p.id })}
            className="whitespace-nowrap rounded-md bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => dispatch({ type: "TOGGLE_COMPARISON" })}
          className={`rounded-md px-2 py-1 text-xs transition-colors ${
            state.comparisonMode
              ? "bg-violet-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
          title="Comparison Mode"
        >
          ⟺
        </button>
        <button
          onClick={() => dispatch({ type: "TOGGLE_FULLSCREEN" })}
          className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-700"
          title="Fullscreen"
        >
          {state.fullscreen ? "⛶" : "⛶"}
        </button>
      </div>
    </nav>
  );
}
