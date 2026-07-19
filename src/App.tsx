import { useReducer, useEffect, useCallback, useRef } from "react";
import { AppContext, DispatchContext } from "./context/AppContext";
import { appReducer, initialState } from "./context/appReducer";
import { useAsciiWorker } from "./hooks/useAsciiWorker";
import type { ConvertParams } from "./hooks/useAsciiWorker";
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

const INITIAL_FAST_COUNT = 3;
const PREBUFFER_COUNT = 5;

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState, (init) => ({
    ...init,
    projects: loadProjects(),
  }));
  const { convert, convertFrame } = useAsciiWorker();
  const animTimerRef = useRef<number | null>(null);
  const animFrameRef = useRef(state.animation.currentFrame);
  animFrameRef.current = state.animation.currentFrame;
  const queueRef = useRef<number[]>([]);
  const processingRef = useRef(false);
  const generationRef = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const getConvertParams = useCallback((): ConvertParams => {
    const charset = state.charPresetId === "custom"
      ? state.customChars
      : CHAR_PRESETS.find((p) => p.id === state.charPresetId)?.chars ?? "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,^`' .";
    return {
      charset,
      asciiWidth: state.canvas.asciiWidth,
      adjustments: {
        brightness: state.adjustments.brightness,
        contrast: state.adjustments.contrast,
        gamma: state.adjustments.gamma,
        invert: state.adjustments.invert,
      },
    };
  }, [state.charPresetId, state.customChars, state.canvas.asciiWidth, state.adjustments]);

  const processQueue = useCallback(() => {
    if (processingRef.current || queueRef.current.length === 0) return;
    const idx = queueRef.current.shift();
    if (idx === undefined) return;

    const anim = stateRef.current.animation;
    if (idx < 0 || idx >= anim.rawFrames.length) return;
    if (anim.frameCache[idx] !== undefined) { processQueue(); return; }

    processingRef.current = true;
    const rawFrame = anim.rawFrames[idx];
    const hasTransform = stateRef.current.transform.rotation !== 0 || stateRef.current.transform.flipH || stateRef.current.transform.flipV;
    const frame = hasTransform ? applyTransform(rawFrame, stateRef.current.transform) : rawFrame;
    const params = getConvertParams();
    const gen = generationRef.current;

    console.log("[processQueue] converting frame", idx, "queue remaining:", queueRef.current.length);
    convertFrame(frame, params, (output, colorGrid) => {
      if (generationRef.current !== gen) { processingRef.current = false; return; }
      console.log("[processQueue] CACHE_FRAME dispatched for frame", idx, "output length:", output.length);
      dispatch({ type: "CACHE_FRAME", index: idx, frame: { output, colorGrid } });
      processingRef.current = false;
      processQueue();
    });
  }, [convertFrame, getConvertParams, dispatch]);

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

  // Fast initial conversion: convert first N frames immediately
  useEffect(() => {
    if (state.animation.rawFrames.length === 0 || state.animation.cachedCount > 0) return;
    generationRef.current++;
    queueRef.current = [];
    processingRef.current = false;

    const initialCount = Math.min(INITIAL_FAST_COUNT, state.animation.rawFrames.length);
    queueRef.current = Array.from({ length: initialCount }, (_, i) => i);
    processQueue();
  }, [state.animation.rawFrames, state.animation.cachedCount, processQueue]);

  // Background pre-buffer: when playing, keep next N frames queued
  useEffect(() => {
    if (!state.animation.playing || state.animation.rawFrames.length === 0) return;
    const cur = state.animation.currentFrame;
    const total = state.animation.rawFrames.length;
    const needed: number[] = [];
    for (let i = 1; i <= PREBUFFER_COUNT; i++) {
      const idx = (cur + i) % total;
      if (state.animation.frameCache[idx] === undefined && !queueRef.current.includes(idx)) {
        needed.push(idx);
      }
    }
    if (needed.length > 0) {
      queueRef.current.push(...needed);
      processQueue();
    }
  }, [state.animation.currentFrame, state.animation.playing, state.animation.rawFrames.length, state.animation.frameCache, processQueue]);

  // Re-convert all when settings change (invalidates cache)
  const prevSettingsRef = useRef(`${state.charPresetId}|${state.canvas.asciiWidth}|${state.adjustments.brightness}|${state.adjustments.contrast}|${state.adjustments.gamma}|${state.adjustments.invert}`);
  useEffect(() => {
    const key = `${state.charPresetId}|${state.canvas.asciiWidth}|${state.adjustments.brightness}|${state.adjustments.contrast}|${state.adjustments.gamma}|${state.adjustments.invert}`;
    if (prevSettingsRef.current !== key && state.animation.rawFrames.length > 0) {
      prevSettingsRef.current = key;
      generationRef.current++;
      queueRef.current = [];
      processingRef.current = false;

      // Invalidate cache
      dispatch({ type: "SET_PENDING", indices: [] });
      dispatch({ type: "INIT_ANIMATION", rawFrames: state.animation.rawFrames, timings: state.animation.frameTimings, sourceFps: state.animation.sourceFps });

      // Re-queue current frame + buffer
      const needed = [state.animation.currentFrame];
      for (let i = 1; i <= PREBUFFER_COUNT; i++) {
        needed.push((state.animation.currentFrame + i) % state.animation.rawFrames.length);
      }
      queueRef.current = [...new Set(needed)];
      processQueue();
    }
  }, [state.charPresetId, state.canvas.asciiWidth, state.adjustments, state.animation.rawFrames, state.animation.frameTimings, state.animation.sourceFps, state.animation.currentFrame, processQueue, dispatch]);

  // Animation playback timer
  useEffect(() => {
    if (state.animation.playing && state.animation.rawFrames.length > 0) {
      const interval = 1000 / state.animation.fps;
      console.log("[Timer] starting with interval:", interval, "ms, fps:", state.animation.fps);
      animTimerRef.current = window.setInterval(() => {
        const total = stateRef.current.animation.rawFrames.length;
        const cur = animFrameRef.current;
        const nextIdx = cur + 1;

        if (nextIdx >= total) {
          if (stateRef.current.animation.loop) {
            console.log("[Timer] wrapping to frame 0");
            dispatch({ type: "SET_CURRENT_FRAME", index: 0 });
          } else {
            dispatch({ type: "TOGGLE_PLAY" });
          }
        } else {
          // If next frame is cached, advance; otherwise skip ahead to next cached
          const nextCached = !!stateRef.current.animation.frameCache[nextIdx];
          if (nextCached) {
            console.log("[Timer] advancing to frame", nextIdx, "(cached)");
            dispatch({ type: "SET_CURRENT_FRAME", index: nextIdx });
          } else {
            // Find next cached frame forward
            let found = -1;
            for (let i = nextIdx; i < total; i++) {
              if (stateRef.current.animation.frameCache[i]) { found = i; break; }
            }
            if (found >= 0) {
              console.log("[Timer] skipping from", cur, "to frame", found, "(next cached)");
              dispatch({ type: "SET_CURRENT_FRAME", index: found });
            } else {
              console.log("[Timer] NO cached frame ahead of", cur, "- cache filled:", stateRef.current.animation.cachedCount, "/", total);
            }
          }
        }
      }, interval);
    }

    return () => {
      if (animTimerRef.current) {
        clearInterval(animTimerRef.current);
        animTimerRef.current = null;
      }
    };
  }, [state.animation.playing, state.animation.fps, state.animation.rawFrames.length, state.animation.loop]);

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
          if (state.animation.cachedCount > 1) {
            const cachedFrames = state.animation.frameCache.filter((f): f is import("./types").AsciiFrame => f !== undefined);
            const cachedTimings = state.animation.frameTimings.filter((_, i) => state.animation.frameCache[i] !== undefined);
            const blob = exportGif(cachedFrames, cachedTimings, state.colorMode, state.canvas.fontSize, state.canvas.lineHeight, state.canvas.letterSpacing, state.monoColor, bg);
            downloadBlob(blob, "ascii-animation.gif");
          }
          break;
        }
      }
    };
    document.addEventListener("ascii-studio-export", handler);
    return () => document.removeEventListener("ascii-studio-export", handler);
  }, [state]);

  const isAnimating = state.animation.rawFrames.length > 0;

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
