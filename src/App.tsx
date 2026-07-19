import { useReducer, useEffect, useCallback, useRef } from "react";
import { AppContext, DispatchContext } from "./context/AppContext";
import { appReducer, initialState } from "./context/appReducer";
import { useAsciiWorker } from "./hooks/useAsciiWorker";
import { useDebounce } from "./hooks/useDebounce";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { applyTransform } from "./utils/image";
import { exportTxt, exportSvg, exportHtml, exportPng, exportProjectJson, exportGif, downloadBlob } from "./utils/export";
import { saveProject, loadProjects } from "./utils/storage";
import { CHAR_PRESETS } from "./data/presets";

import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import Toolbar from "./components/layout/Toolbar";
import AsciiCanvas from "./components/canvas/AsciiCanvas";
import ComparisonSlider from "./components/canvas/ComparisonSlider";
import Upload from "./components/panels/Upload";
import Histogram from "./components/panels/Histogram";
import AnimationControls from "./components/panels/AnimationControls";

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState, (init) => ({
    ...init,
    projects: loadProjects(),
  }));
  const { convert, convertBatch } = useAsciiWorker();
  const animTimerRef = useRef<number | null>(null);
  const animFrameRef = useRef(state.animation.currentFrame);
  animFrameRef.current = state.animation.currentFrame;

  const runConversion = useCallback(() => {
    if (!state.imageData) return;
    dispatch({ type: "SET_LOADING", loading: true });
    const hasTransform = state.transform.rotation !== 0 || state.transform.flipH || state.transform.flipV;
    const processed = hasTransform ? applyTransform(state.imageData, state.transform) : state.imageData;
    const start = performance.now();
    convert({ ...state, imageData: processed }, (output, colorGrid) => {
      dispatch({ type: "SET_ASCII", output, colorGrid, time: Math.round(performance.now() - start) });
    });
  }, [state, convert, dispatch]);

  const debouncedConvert = useDebounce(runConversion, 80);

  // Single-image conversion
  useEffect(() => {
    if (state.imageData && state.animation.rawFrames.length === 0) debouncedConvert();
  }, [state.imageData, state.charPresetId, state.customChars, state.canvas.asciiWidth, state.canvas.asciiHeight, state.adjustments, state.transform, debouncedConvert, state.animation.rawFrames.length]);

  // Batch conversion for GIF frames
  useEffect(() => {
    if (state.animation.rawFrames.length === 0 || state.animation.converting) return;

    const charSet = state.charPresetId === "custom"
      ? state.customChars
      : CHAR_PRESETS.find((p) => p.id === state.charPresetId)?.chars ?? "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,^`' .";

    dispatch({ type: "SET_CONVERTING", converting: true });
    dispatch({ type: "SET_CONVERT_PROGRESS", current: 0, total: state.animation.rawFrames.length });

    const hasTransform = state.transform.rotation !== 0 || state.transform.flipH || state.transform.flipV;
    const frames = hasTransform
      ? state.animation.rawFrames.map((f) => applyTransform(f, state.transform))
      : state.animation.rawFrames;

    convertBatch(
      frames,
      charSet,
      state.canvas.asciiWidth,
      {
        brightness: state.adjustments.brightness,
        contrast: state.adjustments.contrast,
        gamma: state.adjustments.gamma,
        invert: state.adjustments.invert,
      },
      (current, total) => {
        dispatch({ type: "SET_CONVERT_PROGRESS", current, total });
      },
      (results) => {
        const timings = state.animation.frameTimings;
        dispatch({ type: "SET_ANIMATION_FRAMES", frames: results, rawFrames: state.animation.rawFrames, timings });
        dispatch({ type: "SET_CONVERTING", converting: false });
      }
    );
  }, [state.animation.rawFrames, state.charPresetId, state.customChars, state.canvas.asciiWidth, state.adjustments, state.transform, convertBatch, dispatch, state.animation.converting, state.animation.frameTimings]);

  // Animation playback timer
  useEffect(() => {
    if (state.animation.playing && state.animation.frames.length > 0) {
      const interval = 1000 / state.animation.fps;
      animTimerRef.current = window.setInterval(() => {
        const nextIdx = animFrameRef.current + 1;
        if (nextIdx >= state.animation.frames.length) {
          if (state.animation.loop) {
            dispatch({ type: "SET_CURRENT_FRAME", index: 0 });
          } else {
            dispatch({ type: "TOGGLE_PLAY" });
          }
        } else {
          dispatch({ type: "SET_CURRENT_FRAME", index: nextIdx });
        }
      }, interval);
    }

    return () => {
      if (animTimerRef.current) {
        clearInterval(animTimerRef.current);
        animTimerRef.current = null;
      }
    };
  }, [state.animation.playing, state.animation.fps, state.animation.frames.length, state.animation.loop]);

  useKeyboardShortcuts();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && state.asciiOutput) {
        const sel = window.getSelection()?.toString();
        if (!sel) { e.preventDefault(); navigator.clipboard.writeText(state.asciiOutput); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.asciiOutput]);

  useEffect(() => {
    const handler = () => {
      const name = prompt("Project name:", "My Project");
      if (!name) return;
      saveProject(state, name);
      dispatch({ type: "SET_PROJECTS", projects: loadProjects() });
    };
    document.addEventListener("ascii-studio-save", handler);
    return () => document.removeEventListener("ascii-studio-save", handler);
  }, [state]);

  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent).detail as string;
      const projects = loadProjects();
      const project = projects.find((p) => p.id === id);
      if (project) dispatch({ type: "LOAD_PROJECT", state: { ...project, projects, imageUrl: null, imageData: null, asciiOutput: "", colorGrid: [] } });
    };
    document.addEventListener("ascii-studio-load-project", handler);
    return () => document.removeEventListener("ascii-studio-load-project", handler);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const format = (e as CustomEvent).detail as string;
      const bg = state.background.type === "black" ? "#000" : state.background.type === "white" ? "#fff" : "#000";
      switch (format) {
        case "txt": downloadBlob(exportTxt(state.asciiOutput), "ascii-art.txt"); break;
        case "png": exportPng(state.asciiOutput, state.colorGrid, state.colorMode, state.canvas.fontSize, state.canvas.lineHeight, state.canvas.letterSpacing, state.monoColor, bg).then((b) => downloadBlob(b, "ascii-art.png")); break;
        case "svg": { const g = state.asciiOutput.split("\n").map((l) => l.split("")); downloadBlob(exportSvg(g, state.colorGrid, state.colorMode, state.canvas.fontSize, state.canvas.lineHeight, state.canvas.letterSpacing, state.monoColor, bg), "ascii-art.svg"); break; }
        case "html": { const g = state.asciiOutput.split("\n").map((l) => l.split("")); downloadBlob(exportHtml(g, state.colorGrid, state.colorMode, state.canvas.fontSize, state.canvas.lineHeight, state.canvas.letterSpacing, state.monoColor, bg), "ascii-art.html"); break; }
        case "copy-html": { const g = state.asciiOutput.split("\n").map((l) => l.split("")); const htmlBlob = exportHtml(g, state.colorGrid, state.colorMode, state.canvas.fontSize, state.canvas.lineHeight, state.canvas.letterSpacing, state.monoColor, bg); htmlBlob.text().then((t) => navigator.clipboard.writeText(t)); break; }
        case "json": downloadBlob(exportProjectJson(state), "ascii-studio-project.json"); break;
        case "clipboard": navigator.clipboard.writeText(state.asciiOutput); break;
        case "gif": {
          if (state.animation.frames.length > 1) {
            const blob = exportGif(state.animation.frames, state.animation.frameTimings, state.colorMode, state.canvas.fontSize, state.canvas.lineHeight, state.canvas.letterSpacing, state.monoColor, bg);
            downloadBlob(blob, "ascii-animation.gif");
          }
          break;
        }
      }
    };
    document.addEventListener("ascii-studio-export", handler);
    return () => document.removeEventListener("ascii-studio-export", handler);
  }, [state]);

  const isAnimating = state.animation.frames.length > 0;

  return (
    <AppContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        <div className="flex h-screen flex-col bg-[#0c0c0f] text-zinc-200">
          {!state.fullscreen && <Navbar />}
          <div className="flex flex-1 overflow-hidden">
            {!state.fullscreen && (
              <div className="hidden lg:block">
                <Sidebar />
              </div>
            )}
            <div className="flex flex-1 flex-col overflow-hidden">
              {state.comparisonMode ? (
                <ComparisonSlider asciiOutput={state.asciiOutput} colorGrid={state.colorGrid} />
              ) : state.imageUrl ? (
                <AsciiCanvas asciiOutput={state.asciiOutput} colorGrid={state.colorGrid} />
              ) : (
                <div className="flex flex-1 items-center justify-center p-8">
                  <Upload />
                </div>
              )}
              {state.loading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0c0c0f]/80 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-500" />
                    <span className="text-sm text-zinc-400">Processing...</span>
                  </div>
                </div>
              )}
              {isAnimating && <AnimationControls />}
              <div className="flex items-center gap-3 border-t border-zinc-800/50 bg-zinc-900/50 px-4 py-2 backdrop-blur-sm">
                <Toolbar ascii={state.asciiOutput} disabled={!state.asciiOutput} />
                {state.imageData && (
                  <div className="ml-auto">
                    <Histogram imageData={state.imageData} />
                  </div>
                )}
                {state.imageUrl && !state.fullscreen && (
                  <button onClick={() => dispatch({ type: "CLEAR_IMAGE" })} className="ml-2 rounded-lg bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200 transition-colors">
                    New Image
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DispatchContext.Provider>
    </AppContext.Provider>
  );
}
