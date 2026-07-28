import { useApp, useDispatch } from "../../context/AppContext";

export default function Timeline() {
  const state = useApp();
  const dispatch = useDispatch();
  const { animation } = state;

  if (animation.rawFrames.length === 0) return null;

  const total = animation.rawFrames.length;
  const current = animation.currentFrame;
  const progress = total > 0 ? (current / (total - 1)) * 100 : 0;

  const formatTime = (frame: number) => {
    const ms = frame * (1000 / animation.fps);
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <footer
      className="fixed bottom-4 left-4 right-4 h-12 rounded-lg bg-surface border border-outline-variant flex justify-between items-center px-4 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch({ type: "TOGGLE_PLAY" })}
            className="text-primary cursor-pointer active:opacity-80"
          >
            <span className="material-symbols-outlined text-xl">
              {animation.playing ? "pause" : "play_arrow"}
            </span>
          </button>
          <button
            onClick={() => dispatch({ type: "SET_CURRENT_FRAME", index: Math.max(0, current - 1) })}
            className="text-on-surface-variant cursor-pointer active:opacity-80"
          >
            <span className="material-symbols-outlined text-xl">skip_previous</span>
          </button>
          <button
            onClick={() => dispatch({ type: "SET_CURRENT_FRAME", index: Math.min(total - 1, current + 1) })}
            className="text-on-surface-variant cursor-pointer active:opacity-80"
          >
            <span className="material-symbols-outlined text-xl">skip_next</span>
          </button>
        </div>

        <div className="flex-1 w-48 h-1 bg-surface-container-highest relative rounded-full overflow-hidden hidden sm:block">
          <div className="absolute left-0 top-0 bottom-0 bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-lg transition-all"
            style={{ left: `${progress}%` }}
          />
        </div>

        <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider hidden sm:inline">
          {formatTime(current)} / {formatTime(total)}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch({ type: "TOGGLE_ANIM_LOOP" })}
          className={`flex items-center gap-1 rounded-sm px-2 py-1 transition-all ${
            animation.loop ? "bg-tertiary/20 text-tertiary" : "text-on-surface-variant hover:text-tertiary"
          }`}
        >
          <span className="material-symbols-outlined text-base">repeat</span>
          <span className="font-label-caps text-[9px] tracking-wider hidden sm:inline">LOOP</span>
        </button>
        <div className="hidden sm:flex items-center gap-1">
          <input
            type="range"
            min={1}
            max={30}
            value={animation.fps}
            onChange={(e) => dispatch({ type: "SET_ANIMATION_FPS", fps: Number(e.target.value) })}
            className="w-14 accent-tertiary"
          />
          <span className="font-label-caps text-[9px] text-on-surface-variant tracking-wider">{animation.fps}fps</span>
        </div>
      </div>
    </footer>
  );
}
