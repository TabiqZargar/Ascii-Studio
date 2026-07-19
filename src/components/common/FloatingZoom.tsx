import { useApp, useDispatch } from "../../context/AppContext";

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function FloatingZoom({ containerRef }: Props) {
  const state = useApp();
  const dispatch = useDispatch();

  const zoomIn = () => dispatch({ type: "SET_ZOOM", zoom: Math.min(state.zoom + 0.25, 4) });
  const zoomOut = () => dispatch({ type: "SET_ZOOM", zoom: Math.max(state.zoom - 0.25, 0.25) });
  const reset = () => {
    dispatch({ type: "SET_ZOOM", zoom: 1 });
    dispatch({ type: "SET_PAN", x: 0, y: 0 });
  };
  const fit = () => {
    if (!containerRef.current || !state.asciiOutput) return;
    const rect = containerRef.current.getBoundingClientRect();
    const lines = state.asciiOutput.split("\n").length;
    const maxCols = Math.max(...state.asciiOutput.split("\n").map((l) => l.length), 1);
    const scaleX = rect.width / (maxCols * (state.canvas.fontSize * 0.6));
    const scaleY = rect.height / (lines * state.canvas.fontSize * state.canvas.lineHeight);
    dispatch({ type: "SET_ZOOM", zoom: Math.max(0.25, Math.min(Math.min(scaleX, scaleY, 4), 4)) });
    dispatch({ type: "SET_PAN", x: 0, y: 0 });
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1 glass-panel rounded-full shadow-2xl z-30">
      <button onClick={zoomIn} className="p-2 hover:bg-white/5 rounded-full text-on-surface-variant transition-colors">
        <span className="material-symbols-outlined">zoom_in</span>
      </button>
      <button onClick={zoomOut} className="p-2 hover:bg-white/5 rounded-full text-on-surface-variant transition-colors">
        <span className="material-symbols-outlined">zoom_out</span>
      </button>
      <div className="w-px h-4 bg-outline-variant/30 mx-1" />
      <button className="px-4 py-1.5 text-xs font-mono text-on-surface-variant hover:text-on-surface transition-colors">
        {Math.round(state.zoom * 100)}%
      </button>
      <div className="w-px h-4 bg-outline-variant/30 mx-1" />
      <button onClick={fit} className="p-2 hover:bg-white/5 rounded-full text-on-surface-variant transition-colors" title="Fit to view">
        <span className="material-symbols-outlined">fit_screen</span>
      </button>
      <button onClick={reset} className="p-2 hover:bg-white/5 rounded-full text-on-surface-variant transition-colors" title="Reset view">
        <span className="material-symbols-outlined">refresh</span>
      </button>
    </div>
  );
}
