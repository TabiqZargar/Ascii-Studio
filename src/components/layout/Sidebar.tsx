import { useApp, useDispatch } from "../../context/AppContext";
import { Collapsible } from "../common/Collapsible";
import { Slider, Toggle, ColorPicker } from "../common/Controls";
import { CHAR_PRESETS } from "../../data/presets";
import { ResizablePanel } from "../common/ResizablePanel";

export default function Sidebar() {
  return (
    <ResizablePanel defaultWidth={256} minWidth={200} maxWidth={400}>
      <aside className="flex h-full flex-col overflow-y-auto">
        <Collapsible title="Quick Controls" defaultOpen>
          <QuickControls />
        </Collapsible>
        <Collapsible title="Characters" defaultOpen>
          <CharactersPanel />
        </Collapsible>
        <Collapsible title="Image">
          <ImagePanel />
        </Collapsible>
        <Collapsible title="Colors">
          <ColorsPanel />
        </Collapsible>
        <Collapsible title="Canvas">
          <CanvasPanel />
        </Collapsible>
        <Collapsible title="Brushes">
          <BrushPanel />
        </Collapsible>
        <Collapsible title="Layers">
          <LayersPanel />
        </Collapsible>
        <Collapsible title="Advanced">
          <AdvancedPanel />
        </Collapsible>
        <Collapsible title="Export">
          <ExportPanel />
        </Collapsible>
        <Collapsible title="Projects">
          <ProjectPanel />
        </Collapsible>
      </aside>
    </ResizablePanel>
  );
}

function QuickControls() {
  const state = useApp();
  const dispatch = useDispatch();
  const presets = [
    { id: "clean", icon: "\u2728", name: "Clean" },
    { id: "portrait", icon: "\uD83D\uDC64", name: "Portrait" },
    { id: "landscape", icon: "\uD83C\uDFDE", name: "Landscape" },
    { id: "terminal", icon: "\uD83D\uDCBB", name: "Terminal" },
    { id: "matrix", icon: "\uD83D\uDFE9", name: "Matrix" },
    { id: "crt", icon: "\uD83D\uDCFA", name: "CRT" },
    { id: "pixel-art", icon: "\uD83C\uDFAE", name: "Pixel" },
    { id: "comic", icon: "\uD83C\uDFAD", name: "Comic" },
    { id: "noir", icon: "\uD83C\uDF19", name: "Noir" },
    { id: "high-contrast", icon: "\u2728", name: "Hi-Con" },
  ];
  return (
    <div>
      <div className="grid grid-cols-5 gap-1">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => dispatch({ type: "SET_STYLE_PRESET", presetId: p.id })}
            className="flex flex-col items-center rounded-lg bg-zinc-800/50 p-1.5 text-[10px] text-zinc-400 hover:bg-emerald-600/20 hover:text-emerald-400 transition-all"
          >
            <span className="text-sm">{p.icon}</span>
            <span className="mt-0.5 leading-tight text-center">{p.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-1">
        {state.imageData && (
          <button
            onClick={() => dispatch({ type: "AUTO_OPTIMIZE" })}
            className="flex-1 rounded-lg bg-emerald-600/20 px-2 py-1.5 text-[11px] text-emerald-400 hover:bg-emerald-600/30 transition-all font-medium"
          >
            Auto Optimize
          </button>
        )}
        <button onClick={() => dispatch({ type: "SURPRISE_ME" })} className={`${state.imageData ? "flex-1" : "flex-1"} rounded-lg bg-zinc-800/50 px-2 py-1.5 text-[11px] text-zinc-400 hover:bg-emerald-600/20 hover:text-emerald-400 transition-all`}>
          Surprise Me
        </button>
        <button onClick={() => dispatch({ type: "RESET_ADJUSTMENTS" })} className="flex-1 rounded-lg bg-zinc-800/50 px-2 py-1.5 text-[11px] text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200 transition-all">
          Reset
        </button>
      </div>
      <Slider label="Detail Level" value={state.canvas.asciiWidth} min={30} max={250} step={5} onChange={(v) => dispatch({ type: "SET_CANVAS", canvas: { asciiWidth: v, asciiHeight: Math.round(v * 0.5) } })} />
      {state.asciiOutput && (
        <div className="mt-2 flex items-center justify-between rounded-lg bg-zinc-800/30 px-2 py-1.5 text-[10px] text-zinc-500">
          <span>{state.canvas.asciiWidth} x {Math.round(state.canvas.asciiWidth * 0.5)}</span>
          <span>{state.conversionTime}ms</span>
          <span>{state.colorMode}</span>
        </div>
      )}
    </div>
  );
}

function CharactersPanel() {
  const state = useApp();
  const dispatch = useDispatch();
  return (
    <div>
      <div className="grid grid-cols-2 gap-1.5">
        {CHAR_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => dispatch({ type: "SET_CHAR_PRESET", id: p.id })}
            className={`rounded-lg p-2 text-left transition-all ${
              state.charPresetId === p.id
                ? "bg-emerald-600/20 ring-1 ring-emerald-500 text-emerald-300"
                : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50"
            }`}
          >
            <div className="font-mono text-sm leading-none mb-1 truncate">{p.preview}</div>
            <div className="text-[10px] font-medium opacity-70">{p.name}</div>
          </button>
        ))}
      </div>
      <div className="mt-3">
        <label className="mb-1 block text-[10px] text-zinc-500 uppercase tracking-wider">Custom</label>
        <input
          type="text"
          value={state.customChars}
          onChange={(e) => { dispatch({ type: "SET_CUSTOM_CHARS", chars: e.target.value }); dispatch({ type: "SET_CHAR_PRESET", id: "custom" }); }}
          placeholder="Type characters..."
          className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-2 py-1.5 font-mono text-xs text-zinc-300 outline-none focus:border-emerald-500/50 transition-colors"
        />
        {(() => {
          const saved = JSON.parse(localStorage.getItem("ascii_studio_custom_chars") ?? "[]") as string[];
          if (saved.length === 0) return null;
          return (
            <div className="mt-2 flex flex-wrap gap-1">
              {saved.map((chars, i) => (
                <button key={i} onClick={() => { dispatch({ type: "SET_CUSTOM_CHARS", chars }); dispatch({ type: "SET_CHAR_PRESET", id: "custom" }); }}
                  className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] transition-all ${state.customChars === chars && state.charPresetId === "custom" ? "bg-emerald-600/20 text-emerald-300" : "bg-zinc-800/50 text-zinc-500 hover:bg-zinc-700/50"}`}>
                  {chars.length > 8 ? chars.slice(0, 8) + "\u2026" : chars}
                </button>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function ImagePanel() {
  const state = useApp();
  const dispatch = useDispatch();
  const a = state.adjustments;
  return (
    <div>
      <Slider label="Brightness" value={a.brightness} min={-100} max={100} step={1} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { brightness: v } })} />
      <Slider label="Contrast" value={a.contrast} min={0.5} max={2} step={0.05} format={(v) => v.toFixed(2)} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { contrast: v } })} />
      <div className="mt-2 flex gap-1">
        <button onClick={() => dispatch({ type: "SET_TRANSFORM", t: { rotation: (state.transform.rotation + 90) % 360 } })} className="flex-1 rounded-lg bg-zinc-800/50 px-2 py-1.5 text-[11px] text-zinc-400 hover:bg-zinc-700/50 transition-all">↻ Rotate</button>
        <button onClick={() => dispatch({ type: "SET_TRANSFORM", t: { flipH: !state.transform.flipH } })} className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] transition-all ${state.transform.flipH ? "bg-emerald-600/20 text-emerald-400" : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50"}`}>↔ Flip</button>
      </div>
      {state.imageAnalysis && (
        <div className={`mt-3 rounded-lg p-2 text-xs ${state.imageAnalysis.score === "excellent" ? "bg-emerald-500/10 text-emerald-400" : state.imageAnalysis.score === "good" ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"}`}>
          <div className="font-medium">{state.imageAnalysis.label}</div>
          <div className="mt-0.5 text-[10px] opacity-70">{state.imageAnalysis.detail}</div>
          {state.imageAnalysis.suggestedPreset && (
            <button onClick={() => dispatch({ type: "SET_STYLE_PRESET", presetId: state.imageAnalysis!.suggestedPreset! })} className="mt-1 rounded bg-zinc-800/50 px-2 py-0.5 text-[10px] hover:bg-zinc-700/50 transition-all">
              Try {state.imageAnalysis.suggestedPreset} preset
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ColorsPanel() {
  const state = useApp();
  const dispatch = useDispatch();
  const modes = [
    { id: "mono" as const, name: "Mono", color: state.monoColor },
    { id: "original" as const, name: "Color", color: "#ffffff" },
    { id: "matrix" as const, name: "Matrix", color: "#00ff00" },
    { id: "amber" as const, name: "Amber", color: "#ffaa00" },
    { id: "cyberpunk" as const, name: "Cyber", color: "#a600ff" },
    { id: "fire" as const, name: "Fire", color: "#ff6600" },
  ];
  return (
    <div>
      <div className="grid grid-cols-3 gap-1">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => dispatch({ type: "SET_COLOR_MODE", mode: m.id })}
            className={`flex flex-col items-center rounded-lg p-2 transition-all ${
              state.colorMode === m.id
                ? "ring-1 ring-emerald-500 bg-zinc-700/50 text-emerald-300"
                : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50"
            }`}
          >
            <div className="mb-1 h-3 w-full rounded-full" style={{ backgroundColor: m.color, opacity: 0.8 }} />
            <span className="text-[10px]">{m.name}</span>
          </button>
        ))}
      </div>
      {state.colorMode === "mono" && (
        <div className="mt-3">
          <ColorPicker label="Color" value={state.monoColor} onChange={(c) => dispatch({ type: "SET_MONO_COLOR", color: c })} />
        </div>
      )}
    </div>
  );
}

function CanvasPanel() {
  const state = useApp();
  const dispatch = useDispatch();
  const fonts = [
    { id: "'Fira Code', monospace", name: "Fira Code" },
    { id: "'JetBrains Mono', monospace", name: "JetBrains" },
    { id: "'IBM Plex Mono', monospace", name: "IBM Plex" },
    { id: "'Cascadia Code', monospace", name: "Cascadia" },
    { id: "'Source Code Pro', monospace", name: "Source Code" },
    { id: "ui-monospace, Consolas, monospace", name: "System" },
  ];
  return (
    <div>
      <Slider label="Font Size" value={state.canvas.fontSize} min={2} max={20} step={1} format={(v) => `${v}px`} onChange={(v) => dispatch({ type: "SET_CANVAS", canvas: { fontSize: v } })} />
      <Slider label="Line Height" value={state.canvas.lineHeight} min={0.5} max={2.5} step={0.1} onChange={(v) => dispatch({ type: "SET_CANVAS", canvas: { lineHeight: v } })} />
      <Slider label="Letter Spacing" value={state.canvas.letterSpacing} min={-2} max={8} step={0.5} format={(v) => `${v}px`} onChange={(v) => dispatch({ type: "SET_CANVAS", canvas: { letterSpacing: v } })} />
      <div className="mt-2">
        <label className="mb-1 block text-[10px] text-zinc-500 uppercase tracking-wider">Font</label>
        <div className="grid grid-cols-2 gap-1">
          {fonts.map((f) => (
            <button key={f.id} onClick={() => dispatch({ type: "SET_CANVAS", canvas: { fontFamily: f.id } })} className={`rounded-lg px-1.5 py-1 text-[10px] transition-all ${state.canvas.fontFamily === f.id ? "bg-emerald-600/20 text-emerald-300" : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50"}`}>{f.name}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BrushPanel() {
  const state = useApp();
  const dispatch = useDispatch();
  const brushes: Array<{ type: typeof state.brushType; icon: string; label: string }> = [
    { type: "brush", icon: "✏", label: "Brush" },
    { type: "rectangle", icon: "▭", label: "Rect" },
    { type: "circle", icon: "○", label: "Circle" },
    { type: "line", icon: "╱", label: "Line" },
    { type: "fill", icon: "◆", label: "Fill" },
    { type: "text", icon: "T", label: "Text" },
    { type: "eraser", icon: "⌫", label: "Erase" },
  ];
  return (
    <div>
      <div className="grid grid-cols-4 gap-1">
        {brushes.map((b) => (
          <button key={b.type} onClick={() => dispatch({ type: "SET_BRUSH_TYPE", brush: b.type })} className={`flex flex-col items-center rounded-lg p-1.5 text-lg transition-all ${state.brushType === b.type ? "bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-500" : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50"}`}>
            <span>{b.icon}</span>
            <span className="mt-0.5 text-[8px]">{b.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-2">
        <label className="mb-1 block text-[10px] text-zinc-500 uppercase tracking-wider">Character</label>
        <input type="text" value={state.brushChar} onChange={(e) => dispatch({ type: "SET_BRUSH_CHAR", char: e.target.value.slice(-1) || "@" })} maxLength={2} className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-2 py-1 text-center font-mono text-sm text-zinc-300 outline-none focus:border-emerald-500/50 transition-colors" />
      </div>
      <Slider label="Size" value={state.brushSize} min={1} max={10} step={1} onChange={(v) => dispatch({ type: "SET_BRUSH_SIZE", size: v })} />
    </div>
  );
}

function LayersPanel() {
  const state = useApp();
  const dispatch = useDispatch();
  return (
    <div>
      {state.layers.map((layer) => (
        <div key={layer.id} className={`mb-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition-all ${state.activeLayerId === layer.id ? "bg-zinc-700/50" : "bg-zinc-800/30"}`}>
          <button onClick={() => dispatch({ type: "SET_ACTIVE_LAYER", id: layer.id })} className="flex-1 text-left text-zinc-300 text-[11px]">{layer.name}</button>
          <button onClick={() => dispatch({ type: "TOGGLE_LAYER", id: layer.id })} className={`text-[10px] ${layer.visible ? "text-zinc-400" : "text-zinc-700"}`}>{layer.visible ? "👁" : "\u2014"}</button>
          <button onClick={() => dispatch({ type: "LOCK_LAYER", id: layer.id })} className={`text-[10px] ${layer.locked ? "text-red-400" : "text-zinc-600"}`}>{layer.locked ? "\uD83D\uDD12" : "\uD83D\uDD13"}</button>
          <button onClick={() => dispatch({ type: "MOVE_LAYER", id: layer.id, direction: "up" })} className="text-zinc-600 text-[10px] hover:text-zinc-300">\u2191</button>
          <button onClick={() => dispatch({ type: "MOVE_LAYER", id: layer.id, direction: "down" })} className="text-zinc-600 text-[10px] hover:text-zinc-300">\u2193</button>
        </div>
      ))}
      <button onClick={() => dispatch({ type: "ADD_LAYER", layer: { id: `layer-${Date.now()}`, type: "text", name: `Layer ${state.layers.length + 1}`, visible: true, locked: false, opacity: 1 } })} className="mt-2 w-full rounded-lg border border-dashed border-zinc-700/50 px-2 py-1.5 text-[11px] text-zinc-500 hover:border-emerald-500/50 hover:text-emerald-400 transition-all">+ Add Layer</button>
    </div>
  );
}

function AdvancedPanel() {
  const state = useApp();
  const dispatch = useDispatch();
  const a = state.adjustments;
  return (
    <div>
      <Slider label="Gamma" value={a.gamma} min={0.1} max={3} step={0.1} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { gamma: v } })} />
      <Slider label="Saturation" value={a.saturation} min={0} max={3} step={0.1} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { saturation: v } })} />
      <Slider label="Exposure" value={a.exposure} min={0.1} max={3} step={0.1} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { exposure: v } })} />
      <Slider label="Blur" value={a.blur} min={0} max={10} step={0.5} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { blur: v } })} />
      <Slider label="Sharpness" value={a.sharpness} min={0} max={10} step={0.5} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { sharpness: v } })} />
      <Toggle label="Invert" checked={a.invert} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { invert: v } })} />
      <Toggle label="Grayscale" checked={a.grayscale} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { grayscale: v } })} />
      <Toggle label="Edge Detection" checked={a.edgeDetection} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { edgeDetection: v } })} />
    </div>
  );
}

function ExportPanel() {
  const state = useApp();
  const hasAnimation = state.animation.frames.length > 1;
  const formats = [
    { id: "txt", label: "TXT", desc: "Plain text" },
    { id: "png", label: "PNG", desc: "Image" },
    { id: "html", label: "HTML", desc: "Web page" },
    { id: "clipboard", label: "Copy", desc: "ASCII text" },
    { id: "copy-html", label: "Copy HTML", desc: "HTML markup" },
    { id: "json", label: "JSON", desc: "Project" },
    ...(hasAnimation ? [{ id: "gif", label: "GIF", desc: "Animation" }] : []),
  ];
  return (
    <div className="grid grid-cols-2 gap-1">
      {formats.map((f) => (
        <button
          key={f.id}
          onClick={() => document.dispatchEvent(new CustomEvent("ascii-studio-export", { detail: f.id }))}
          className="flex flex-col items-center rounded-lg bg-zinc-800/50 px-2 py-2 text-[11px] text-zinc-300 hover:bg-zinc-700/50 transition-all"
        >
          <span className="font-medium">{f.label}</span>
          <span className="text-[9px] text-zinc-600">{f.desc}</span>
        </button>
      ))}
    </div>
  );
}

function ProjectPanel() {
  const state = useApp();
  const dispatch = useDispatch();
  return (
    <div>
      <button onClick={() => document.dispatchEvent(new CustomEvent("ascii-studio-save"))} className="mb-2 w-full rounded-lg bg-emerald-600 px-2 py-1.5 text-[11px] text-white hover:bg-emerald-500 transition-all">Save Project</button>
      {state.projects.length === 0 && <p className="text-[11px] text-zinc-600">No saved projects</p>}
      {state.projects.map((p) => (
        <div key={p.id} className="mb-1 flex items-center justify-between rounded-lg bg-zinc-800/50 px-2 py-1.5">
          <div className="text-[11px] text-zinc-300">{p.name}</div>
          <div className="flex gap-1">
            <button onClick={() => document.dispatchEvent(new CustomEvent("ascii-studio-load-project", { detail: p.id }))} className="text-[10px] text-emerald-400 hover:text-emerald-300">Load</button>
            <button onClick={() => { dispatch({ type: "SET_PROJECTS", projects: state.projects.filter((pp) => pp.id !== p.id) }); localStorage.setItem("ascii_studio_projects", JSON.stringify(state.projects.filter((pp) => pp.id !== p.id))); }} className="text-[10px] text-red-400 hover:text-red-300">\u00d7</button>
          </div>
        </div>
      ))}
    </div>
  );
}
