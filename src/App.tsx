import { useReducer, useEffect, useCallback } from "react";
import { AppContext, DispatchContext } from "./context/AppContext";
import { appReducer, initialState } from "./context/appReducer";
import { useAsciiWorker } from "./hooks/useAsciiWorker";
import { useDebounce } from "./hooks/useDebounce";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { applyTransform } from "./utils/image";
import { exportTxt, exportSvg, exportHtml, exportPng, exportProjectJson, downloadBlob } from "./utils/export";
import { saveProject, loadProjects } from "./utils/storage";
import { GRADIENT_PRESETS } from "./data/presets";

import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import Toolbar from "./components/layout/Toolbar";
import AsciiCanvas from "./components/canvas/AsciiCanvas";
import ComparisonSlider from "./components/canvas/ComparisonSlider";
import Upload from "./components/panels/Upload";
import Histogram from "./components/panels/Histogram";

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState, (init) => ({
    ...init,
    projects: loadProjects(),
  }));
  const { convert } = useAsciiWorker();

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
    if (state.imageData) debouncedConvert();
  }, [state.imageData, state.charPresetId, state.customChars, state.canvas.asciiWidth, state.canvas.asciiHeight, state.adjustments, state.transform, debouncedConvert]);

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
      const gradient = GRADIENT_PRESETS.find((g) => g.id === state.gradientId);
      const bg = state.background.type === "black" ? "#000" : state.background.type === "white" ? "#fff" : "#000";
      switch (format) {
        case "txt": downloadBlob(exportTxt(state.asciiOutput), "ascii-art.txt"); break;
        case "png": exportPng(state.asciiOutput, state.colorGrid, state.colorMode, state.canvas.fontSize, state.canvas.lineHeight, state.canvas.letterSpacing, state.monoColor, bg).then((b) => downloadBlob(b, "ascii-art.png")); break;
        case "svg": { const g = state.asciiOutput.split("\n").map((l) => l.split("")); downloadBlob(exportSvg(g, state.colorGrid, state.colorMode, state.canvas.fontSize, state.canvas.lineHeight, state.canvas.letterSpacing, state.monoColor, gradient?.colors ?? [], bg), "ascii-art.svg"); break; }
        case "html": { const g = state.asciiOutput.split("\n").map((l) => l.split("")); downloadBlob(exportHtml(g, state.colorGrid, state.colorMode, state.canvas.fontSize, state.canvas.lineHeight, state.canvas.letterSpacing, state.monoColor, bg), "ascii-art.html"); break; }
        case "json": downloadBlob(exportProjectJson(state), "ascii-studio-project.json"); break;
        case "clipboard": navigator.clipboard.writeText(state.asciiOutput); break;
      }
    };
    document.addEventListener("ascii-studio-export", handler);
    return () => document.removeEventListener("ascii-studio-export", handler);
  }, [state]);

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
