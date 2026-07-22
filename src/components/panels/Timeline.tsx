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
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}:${String(Math.floor((ms % 1000) / 10)).padStart(2, "0")}`;
  };

  return (
    <nav className="fixed bottom-14 md:bottom-3 left-0 md:left-20 right-0 md:right-3 z-40 flex items-center px-3 md:px-6 rounded-none md:rounded-xl h-16 md:h-24 bg-surface/80 md:bg-surface/60 backdrop-blur-xl border-t md:border border-outline-variant/20 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] md:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-3 md:gap-8 w-full">
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <button
            onClick={() => dispatch({ type: "TOGGLE_PLAY" })}
            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-tertiary-container/30 text-tertiary hover:bg-tertiary-container/50 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] md:text-[24px]">
              {animation.playing ? "pause" : "play_arrow"}
            </span>
          </button>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-mono text-tertiary">{formatTime(current)}</span>
            <span className="text-[10px] text-on-surface-variant uppercase">Frame {current + 1}</span>
          </div>
        </div>

        <div className="flex-grow h-8 md:h-12 relative flex items-center min-w-0">
          <div className="absolute inset-0 bg-surface-container rounded-lg overflow-hidden flex items-center px-1 md:px-2 gap-px md:gap-1">
            {animation.frameCache.map((frame, i) => (
              <div
                key={i}
                className={`h-full border-x ${
                  frame
                    ? "bg-tertiary-container/20 border-tertiary/30"
                    : "bg-surface-container-high border-outline-variant/10"
                }`}
                style={{ width: `${100 / Math.max(total, 1)}%`, minWidth: 1 }}
              />
            ))}
          </div>
          <div
            className="absolute top-[-2px] bottom-[-2px] md:top-[-4px] md:bottom-[-4px] w-0.5 bg-tertiary shadow-[0_0_10px_rgba(255,185,95,0.8)] z-10 transition-all"
            style={{ left: `${progress}%` }}
          >
            <div className="absolute -top-1 -left-[3px] w-2 h-2 rounded-full bg-tertiary" />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-6 shrink-0">
          <button
            onClick={() => dispatch({ type: "SET_CURRENT_FRAME", index: 0 })}
            className="hidden sm:flex flex-col items-center text-on-surface-variant hover:text-tertiary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] md:text-[24px]">skip_previous</span>
            <span className="text-[10px] font-medium">Start</span>
          </button>
          <button
            onClick={() => dispatch({ type: "SET_CURRENT_FRAME", index: total - 1 })}
            className="hidden sm:flex flex-col items-center text-on-surface-variant hover:text-tertiary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] md:text-[24px]">skip_next</span>
            <span className="text-[10px] font-medium">End</span>
          </button>
          <button
            onClick={() => dispatch({ type: "TOGGLE_ANIM_LOOP" })}
            className={`flex flex-col items-center rounded-lg px-2 md:px-3 py-1 transition-all ${
              animation.loop ? "bg-tertiary-container/30 text-tertiary" : "text-on-surface-variant hover:text-tertiary"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] md:text-[24px]">repeat</span>
            <span className="text-[10px] font-medium hidden sm:block">Loop</span>
          </button>
          <div className="hidden sm:flex flex-col items-center">
            <input
              type="range"
              min={1}
              max={30}
              value={animation.fps}
              onChange={(e) => dispatch({ type: "SET_ANIMATION_FPS", fps: Number(e.target.value) })}
              className="w-16 accent-tertiary"
            />
            <span className="text-[10px] text-on-surface-variant font-mono">{animation.fps}fps</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
