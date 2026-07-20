import { useReducer, useEffect, useCallback, useRef, useState } from "react";
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

import ShaderBackground from "./components/common/ShaderBackground";
import LandingPage from "./components/layout/LandingPage";
import Navbar from "./components/layout/Navbar";
import Dock from "./components/layout/Dock";
import type { DockSection } from "./components/layout/Dock";
import Inspector from "./components/layout/Inspector";
import AsciiCanvas from "./components/canvas/AsciiCanvas";
import ComparisonSlider from "./components/canvas/ComparisonSlider";
import FloatingZoom from "./components/common/FloatingZoom";
import Timeline from "./components/panels/Timeline";
import Upload from "./components/panels/Upload";
import Histogram from "./components/panels/Histogram";

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
  const processQueueRef = useRef<() => void>(() => {});

  const [screen, setScreen] = useState<"landing" | "workspace">(
    state.imageUrl ? "workspace" : "landing"
  );
  const [activeDockSection, setActiveDockSection] = useState<DockSection>("characters");
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.imageUrl && screen === "landing") {
      setScreen("workspace");
    }
  }, [state.imageUrl, screen]);

  const enterWorkspace = useCallback(() => {
    setScreen("workspace");
  }, []);

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
    if (anim.frameCache[idx] !== undefined) { processQueueRef.current(); return; }

    processingRef.current = true;
    const rawFrame = anim.rawFrames[idx];
    const hasTransform = stateRef.current.transform.rotation !== 0 || stateRef.current.transform.flipH || stateRef.current.transform.flipV;
    const frame = hasTransform ? applyTransform(rawFrame, stateRef.current.transform) : rawFrame;
    const params = getConvertParams();
    const gen = generationRef.current;

    console.log(`[App] Queuing frame ${idx}, queue remaining: ${queueRef.current.length}, gen: ${gen}`);

    convertFrame(frame, params, (output, colorGrid) => {
      console.log(`[App] Frame ${idx} processed, output length: ${output.length}, gen check: ${generationRef.current === gen ? "OK" : "STALE (skipped)"}`);
      if (generationRef.current !== gen) { processingRef.current = false; return; }
      dispatch({ type: "CACHE_FRAME", index: idx, frame: { output, colorGrid } });
      processingRef.current = false;
      processQueueRef.current();
    });
  }, [convertFrame, getConvertParams]);

  processQueueRef.current = processQueue;

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

  useEffect(() => {
    if (state.imageData && state.animation.rawFrames.length === 0) debouncedConvert();
  }, [state.imageData, state.charPresetId, state.customChars, state.canvas.asciiWidth, state.canvas.asciiHeight, state.adjustments, state.transform, debouncedConvert, state.animation.rawFrames.length]);

  useEffect(() => {
    if (state.animation.rawFrames.length > 0) {
      debouncedConvert.cancel();
    }
  }, [state.animation.rawFrames.length, debouncedConvert]);

  useEffect(() => {
    if (state.animation.rawFrames.length === 0 || state.animation.cachedCount > 0) return;
    generationRef.current++;
    queueRef.current = [];
    processingRef.current = false;
    const initialCount = Math.min(INITIAL_FAST_COUNT, state.animation.rawFrames.length);
    queueRef.current = Array.from({ length: initialCount }, (_, i) => i);
    console.log(`[App] INIT: queuing frames [${queueRef.current.join(", ")}] of ${state.animation.rawFrames.length} total`);
    processQueueRef.current();
  }, [state.animation.rawFrames, state.animation.cachedCount, processQueue]);

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
      console.log(`[App] PREBUFFER: queuing frames [${needed.join(", ")}] from current ${cur}`);
      queueRef.current.push(...needed);
      processQueueRef.current();
    }
  }, [state.animation.currentFrame, state.animation.playing, state.animation.rawFrames.length, state.animation.frameCache, processQueue]);

  const prevSettingsRef = useRef(`${state.charPresetId}|${state.canvas.asciiWidth}|${state.adjustments.brightness}|${state.adjustments.contrast}|${state.adjustments.gamma}|${state.adjustments.invert}`);
  useEffect(() => {
    const key = `${state.charPresetId}|${state.canvas.asciiWidth}|${state.adjustments.brightness}|${state.adjustments.contrast}|${state.adjustments.gamma}|${state.adjustments.invert}`;
    if (prevSettingsRef.current !== key && state.animation.rawFrames.length > 0) {
      prevSettingsRef.current = key;
      generationRef.current++;
      queueRef.current = [];
      processingRef.current = false;
      console.log(`[App] SETTINGS CHANGED: re-caching all frames`);
      dispatch({ type: "SET_PENDING", indices: [] });
      dispatch({ type: "INIT_ANIMATION", rawFrames: state.animation.rawFrames, timings: state.animation.frameTimings, sourceFps: state.animation.sourceFps });
      const needed = [state.animation.currentFrame];
      for (let i = 1; i <= PREBUFFER_COUNT; i++) {
        needed.push((state.animation.currentFrame + i) % state.animation.rawFrames.length);
      }
      queueRef.current = [...new Set(needed)];
      processQueueRef.current();
    }
  }, [state.charPresetId, state.canvas.asciiWidth, state.adjustments, state.animation.rawFrames, state.animation.frameTimings, state.animation.sourceFps, state.animation.currentFrame, processQueue, dispatch]);

  useEffect(() => {
    if (state.animation.playing && state.animation.rawFrames.length > 0) {
      console.log(`[App] PLAYBACK STARTED at ${state.animation.fps}fps`);
      const interval = 1000 / state.animation.fps;
      animTimerRef.current = window.setInterval(() => {
        const total = stateRef.current.animation.rawFrames.length;
        const cur = animFrameRef.current;
        const nextIdx = cur + 1;

        if (nextIdx >= total) {
          if (stateRef.current.animation.loop) {
            dispatch({ type: "SET_CURRENT_FRAME", index: 0 });
          } else {
            dispatch({ type: "TOGGLE_PLAY" });
          }
        } else {
          if (stateRef.current.animation.frameCache[nextIdx]) {
            dispatch({ type: "SET_CURRENT_FRAME", index: nextIdx });
          } else {
            let found = -1;
            for (let i = nextIdx; i < total; i++) {
              if (stateRef.current.animation.frameCache[i]) { found = i; break; }
            }
            if (found >= 0) {
              console.log(`[App] TICK: frame ${nextIdx} not cached, skipping to ${found}`);
              dispatch({ type: "SET_CURRENT_FRAME", index: found });
            } else {
              console.log(`[App] TICK: no cached frames ahead of ${cur}, waiting`);
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
        <div className="h-screen w-screen overflow-hidden bg-background text-on-background">
          <ShaderBackground />

          {screen === "landing" ? (
            <LandingPage onEnterWorkspace={enterWorkspace} />
          ) : (
            <>
              {!state.fullscreen && <Navbar />}
              {!state.fullscreen && <Dock activeSection={activeDockSection} onSectionChange={setActiveDockSection} />}
              {!state.fullscreen && <Inspector section={activeDockSection} />}

              <main className="absolute inset-0 z-20" style={{ paddingLeft: 80, paddingRight: 332, paddingTop: 80, paddingBottom: isAnimating ? 120 : 52 }}>
                <div
                  ref={canvasContainerRef}
                  className="relative w-full h-full glass-panel rounded-2xl checkerboard shadow-inner"
                >
                  {state.comparisonMode ? (
                    <ComparisonSlider asciiOutput={state.asciiOutput} colorGrid={state.colorGrid} />
                  ) : state.imageUrl ? (
                    <AsciiCanvas asciiOutput={state.asciiOutput} colorGrid={state.colorGrid} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                      <Upload />
                    </div>
                  )}

                  {state.imageUrl && <FloatingZoom containerRef={canvasContainerRef} />}

                  {state.loading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-2xl">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
                        <span className="text-sm text-on-surface-variant">Processing...</span>
                      </div>
                    </div>
                  )}
                </div>
              </main>

              {isAnimating && <Timeline />}

              {!state.fullscreen && state.imageUrl && !isAnimating && (
                <div className="fixed bottom-3 left-20 right-3 z-30 flex items-center gap-3 rounded-xl bg-surface/60 backdrop-blur-xl border border-outline-variant/20 px-4 py-2">
                  <Histogram imageData={state.imageData} />
                </div>
              )}
            </>
          )}
        </div>
      </DispatchContext.Provider>
    </AppContext.Provider>
  );
}
