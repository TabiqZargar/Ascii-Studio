import { useApp, useDispatch } from "../../context/AppContext";

export default function AnimationControls() {
  const state = useApp();
  const dispatch = useDispatch();
  const { animation } = state;

  if (animation.frames.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 border-t border-zinc-800/50 bg-zinc-900/80 px-4 py-2 backdrop-blur-sm">
      {animation.converting && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${animation.convertTotal > 0 ? (animation.convertProgress / animation.convertTotal) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-500 tabular-nums">
            {animation.convertProgress}/{animation.convertTotal}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => dispatch({ type: "STOP_ANIMATION" })}
          className="rounded-md bg-zinc-800/50 px-2 py-1 text-[10px] text-zinc-400 hover:bg-red-600/20 hover:text-red-400 transition-colors"
          title="Stop animation"
        >
          ✕
        </button>

        <button
          onClick={() => dispatch({ type: "SET_CURRENT_FRAME", index: 0 })}
          className="rounded-md bg-zinc-800/50 px-2 py-1 text-[10px] text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200 transition-colors"
          title="First frame"
        >
          ⏮
        </button>

        <button
          onClick={() => dispatch({ type: "SET_CURRENT_FRAME", index: animation.currentFrame - 1 })}
          disabled={animation.currentFrame === 0}
          className="rounded-md bg-zinc-800/50 px-2 py-1 text-[10px] text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200 transition-colors disabled:opacity-30"
          title="Previous frame"
        >
          ◀
        </button>

        <button
          onClick={() => dispatch({ type: "TOGGLE_PLAY" })}
          className="rounded-md bg-emerald-600/20 px-3 py-1 text-[11px] font-medium text-emerald-400 hover:bg-emerald-600/30 transition-colors"
        >
          {animation.playing ? "⏸ Pause" : "▶ Play"}
        </button>

        <button
          onClick={() => dispatch({ type: "SET_CURRENT_FRAME", index: animation.currentFrame + 1 })}
          disabled={animation.currentFrame >= animation.frames.length - 1}
          className="rounded-md bg-zinc-800/50 px-2 py-1 text-[10px] text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200 transition-colors disabled:opacity-30"
          title="Next frame"
        >
          ▶
        </button>

        <button
          onClick={() => dispatch({ type: "SET_CURRENT_FRAME", index: animation.frames.length - 1 })}
          className="rounded-md bg-zinc-800/50 px-2 py-1 text-[10px] text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200 transition-colors"
          title="Last frame"
        >
          ⏭
        </button>

        <div className="mx-1 h-4 w-px bg-zinc-700" />

        <span className="text-[10px] text-zinc-500 tabular-nums">
          {animation.currentFrame + 1}/{animation.frames.length}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <label className="text-[10px] text-zinc-500">FPS</label>
          <input
            type="range"
            min={1}
            max={30}
            value={animation.fps}
            onChange={(e) => dispatch({ type: "SET_ANIMATION_FPS", fps: Number(e.target.value) })}
            className="w-16 accent-emerald-500"
          />
          <span className="text-[10px] text-zinc-400 tabular-nums w-5 text-right">{animation.fps}</span>

          <button
            onClick={() => dispatch({ type: "TOGGLE_ANIM_LOOP" })}
            className={`rounded-md px-2 py-1 text-[10px] transition-colors ${animation.loop ? "bg-emerald-600/20 text-emerald-400" : "bg-zinc-800/50 text-zinc-500"}`}
          >
            {animation.loop ? "🔁" : "➡"} Loop
          </button>
        </div>
      </div>
    </div>
  );
}
