import { useState } from "react";
import { useApp, useDispatch } from "../../context/AppContext";
import type { Action } from "../../context/appReducer";
import { CHAR_PRESETS } from "../../data/presets";
import type { DockSection } from "./Dock";
import ExportDialog from "../common/ExportDialog";

interface Props {
  section: DockSection;
}

export default function Inspector({ section }: Props) {
  const state = useApp();
  const dispatch = useDispatch();

  const sectionTitle = {
    upload: "Upload",
    brush: "Brush",
    characters: "Characters",
    colors: "Colors",
    layers: "Layers",
    export: "Export",
  }[section];

  return (
    <aside className="fixed right-3 top-[100px] z-40 flex flex-col p-4 rounded-xl w-80 max-h-[calc(100vh-200px)] bg-surface/60 backdrop-blur-xl border border-outline-variant/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-secondary">{sectionTitle}</h3>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Properties</p>
        </div>
        <div className="flex gap-2">
          <button className="text-secondary p-1 rounded">
            <span className="material-symbols-outlined text-sm">tune</span>
          </button>
          <button className="text-on-surface-variant hover:bg-secondary/10 p-1 rounded">
            <span className="material-symbols-outlined text-sm">settings</span>
          </button>
        </div>
      </div>

      <div className="space-y-6 overflow-y-auto pr-2 flex-1 min-h-0">
        {section === "characters" && <CharactersSection state={state} dispatch={dispatch} />}
        {section === "brush" && <BrushSection state={state} dispatch={dispatch} />}
        {section === "colors" && <ColorsSection state={state} dispatch={dispatch} />}
        {section === "layers" && <LayersSection state={state} dispatch={dispatch} />}
        {section === "export" && <ExportSection />}
        {section === "upload" && <UploadSection state={state} dispatch={dispatch} />}
      </div>
    </aside>
  );
}

function CharactersSection({ state, dispatch }: { state: ReturnType<typeof useApp>; dispatch: React.Dispatch<Action> }) {
  return (
    <>
      <div className="space-y-2">
        <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">Character Set</label>
        <div className="grid grid-cols-2 gap-2">
          {CHAR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => dispatch({ type: "SET_CHAR_PRESET", id: preset.id })}
              className={`p-2 rounded-lg flex flex-col items-center transition-all ${
                state.charPresetId === preset.id
                  ? "bg-primary/10 border border-primary/40 text-primary"
                  : "glass-panel border-outline-variant/20 hover:border-secondary/50"
              }`}
            >
              <span className="font-mono text-xl">{preset.preview}</span>
              <span className="text-[10px] mt-1">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">Custom</label>
        <input
          type="text"
          value={state.customChars}
          onChange={(e) => {
            dispatch({ type: "SET_CUSTOM_CHARS", chars: e.target.value });
            dispatch({ type: "SET_CHAR_PRESET", id: "custom" });
          }}
          placeholder="Type characters..."
          className="w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm font-mono text-on-surface outline-none focus:border-primary/50 transition-colors"
        />
      </div>
    </>
  );
}

function BrushSection({ state, dispatch }: { state: ReturnType<typeof useApp>; dispatch: React.Dispatch<Action> }) {
  const brushes: Array<{ type: string; icon: string; label: string }> = [
    { type: "brush", icon: "brush", label: "Brush" },
    { type: "rectangle", icon: "rectangle", label: "Rect" },
    { type: "circle", icon: "circle", label: "Circle" },
    { type: "line", icon: "pen_size_1", label: "Line" },
    { type: "fill", icon: "format_color_fill", label: "Fill" },
    { type: "text", icon: "text_fields", label: "Text" },
    { type: "eraser", icon: "backspace", label: "Erase" },
  ];

  return (
    <>
      <div className="space-y-2">
        <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">Brush Type</label>
        <div className="grid grid-cols-4 gap-2">
          {brushes.map((b) => (
            <button
              key={b.type}
              onClick={() => dispatch({ type: "SET_BRUSH_TYPE", brush: b.type as import("../../types").BrushType })}
              className={`flex flex-col items-center rounded-lg p-2 transition-all ${
                state.brushType === b.type
                  ? "bg-primary/20 text-primary ring-1 ring-primary/50"
                  : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-lg">{b.icon}</span>
              <span className="text-[8px] mt-0.5">{b.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">Character</label>
        <input
          type="text"
          value={state.brushChar}
          onChange={(e) => dispatch({ type: "SET_BRUSH_CHAR", char: e.target.value.slice(-1) || "@" })}
          maxLength={2}
          className="w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-center text-sm font-mono text-on-surface outline-none focus:border-primary/50 transition-colors"
        />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-[11px] text-on-surface-variant font-medium">
          <span>Size</span>
          <span>{state.brushSize}</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={state.brushSize}
          onChange={(e) => dispatch({ type: "SET_BRUSH_SIZE", size: Number(e.target.value) })}
          className="w-full accent-primary"
        />
      </div>
    </>
  );
}

function ColorsSection({ state, dispatch }: { state: ReturnType<typeof useApp>; dispatch: React.Dispatch<Action> }) {
  const modes = [
    { id: "mono" as const, name: "Mono", color: state.monoColor },
    { id: "original" as const, name: "Color", color: "#ffffff" },
    { id: "matrix" as const, name: "Matrix", color: "#00ff00" },
    { id: "amber" as const, name: "Amber", color: "#ffaa00" },
    { id: "cyberpunk" as const, name: "Cyber", color: "#a600ff" },
    { id: "fire" as const, name: "Fire", color: "#ff6600" },
  ];

  return (
    <>
      <div className="space-y-2">
        <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">Color Mode</label>
        <div className="grid grid-cols-3 gap-2">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => dispatch({ type: "SET_COLOR_MODE", mode: m.id })}
              className={`flex flex-col items-center rounded-lg p-2 transition-all ${
                state.colorMode === m.id
                  ? "ring-1 ring-primary bg-surface-container-high text-primary"
                  : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
              }`}
            >
              <div className="mb-1 h-3 w-full rounded-full" style={{ backgroundColor: m.color, opacity: 0.8 }} />
              <span className="text-[10px]">{m.name}</span>
            </button>
          ))}
        </div>
      </div>
      {state.colorMode === "mono" && (
        <div className="space-y-2">
          <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={state.monoColor}
              onChange={(e) => dispatch({ type: "SET_MONO_COLOR", color: e.target.value })}
              className="h-8 w-8 cursor-pointer border-0 bg-transparent"
            />
            <span className="text-sm font-mono text-on-surface-variant">{state.monoColor}</span>
          </div>
        </div>
      )}
    </>
  );
}

function LayersSection({ state, dispatch }: { state: ReturnType<typeof useApp>; dispatch: React.Dispatch<Action> }) {
  return (
    <>
      <div className="space-y-2">
        <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">Layers</label>
        {state.layers.map((layer) => (
          <div key={layer.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-all ${state.activeLayerId === layer.id ? "bg-surface-container-high" : "bg-surface-container"}`}>
            <button onClick={() => dispatch({ type: "SET_ACTIVE_LAYER", id: layer.id })} className="flex-1 text-left text-sm text-on-surface">{layer.name}</button>
            <button onClick={() => dispatch({ type: "TOGGLE_LAYER", id: layer.id })} className={`material-symbols-outlined text-base ${layer.visible ? "text-on-surface-variant" : "text-surface-variant"}`}>
              {layer.visible ? "visibility" : "visibility_off"}
            </button>
            <button onClick={() => dispatch({ type: "LOCK_LAYER", id: layer.id })} className={`material-symbols-outlined text-base ${layer.locked ? "text-error" : "text-on-surface-variant"}`}>
              {layer.locked ? "lock" : "lock_open"}
            </button>
            <button onClick={() => dispatch({ type: "MOVE_LAYER", id: layer.id, direction: "up" })} className="material-symbols-outlined text-base text-on-surface-variant hover:text-on-surface">arrow_upward</button>
            <button onClick={() => dispatch({ type: "MOVE_LAYER", id: layer.id, direction: "down" })} className="material-symbols-outlined text-base text-on-surface-variant hover:text-on-surface">arrow_downward</button>
          </div>
        ))}
        <button
          onClick={() => dispatch({ type: "ADD_LAYER", layer: { id: `layer-${Date.now()}`, type: "text", name: `Layer ${state.layers.length + 1}`, visible: true, locked: false, opacity: 1 } })}
          className="w-full rounded-lg border border-dashed border-outline-variant/20 px-3 py-2 text-sm text-on-surface-variant hover:border-primary/50 hover:text-primary transition-all"
        >
          + Add Layer
        </button>
      </div>
    </>
  );
}

function ExportSection() {
  const state = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setDialogOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary/15 border border-primary/40 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/25 transition-all active:scale-[0.98]"
      >
        <span className="material-symbols-outlined text-lg">tune</span>
        Full Export Settings
      </button>

      <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">Quick Export</label>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => document.dispatchEvent(new CustomEvent("ascii-studio-export", { detail: "txt" }))}
          className="flex items-center gap-2 rounded-lg bg-surface-container px-3 py-2 text-sm text-on-surface hover:bg-surface-container-high transition-all"
        >
          <span className="material-symbols-outlined text-base">description</span>
          <span>TXT</span>
        </button>
        <button
          onClick={() => document.dispatchEvent(new CustomEvent("ascii-studio-export", { detail: "png" }))}
          className="flex items-center gap-2 rounded-lg bg-surface-container px-3 py-2 text-sm text-on-surface hover:bg-surface-container-high transition-all"
        >
          <span className="material-symbols-outlined text-base">image</span>
          <span>PNG</span>
        </button>
        <button
          onClick={() => document.dispatchEvent(new CustomEvent("ascii-studio-export", { detail: "html" }))}
          className="flex items-center gap-2 rounded-lg bg-surface-container px-3 py-2 text-sm text-on-surface hover:bg-surface-container-high transition-all"
        >
          <span className="material-symbols-outlined text-base">code</span>
          <span>HTML</span>
        </button>
        <button
          onClick={() => document.dispatchEvent(new CustomEvent("ascii-studio-export", { detail: "clipboard" }))}
          className="flex items-center gap-2 rounded-lg bg-surface-container px-3 py-2 text-sm text-on-surface hover:bg-surface-container-high transition-all"
        >
          <span className="material-symbols-outlined text-base">content_copy</span>
          <span>Copy</span>
        </button>
        <button
          onClick={() => document.dispatchEvent(new CustomEvent("ascii-studio-export", { detail: "copy-html" }))}
          className="flex items-center gap-2 rounded-lg bg-surface-container px-3 py-2 text-sm text-on-surface hover:bg-surface-container-high transition-all"
        >
          <span className="material-symbols-outlined text-base">content_paste</span>
          <span>Copy HTML</span>
        </button>
        <button
          onClick={() => document.dispatchEvent(new CustomEvent("ascii-studio-export", { detail: "json" }))}
          className="flex items-center gap-2 rounded-lg bg-surface-container px-3 py-2 text-sm text-on-surface hover:bg-surface-container-high transition-all"
        >
          <span className="material-symbols-outlined text-base">data_object</span>
          <span>JSON</span>
        </button>
      </div>

      {dialogOpen && (
        <ExportDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          asciiData={state.asciiOutput}
          colorGrid={state.colorGrid}
          colorMode={state.colorMode}
          monoColor={state.monoColor}
          lineHeight={state.canvas.lineHeight}
          letterSpacing={state.canvas.letterSpacing}
        />
      )}
    </div>
  );
}

function UploadSection({ state, dispatch }: { state: ReturnType<typeof useApp>; dispatch: React.Dispatch<Action> }) {
  return (
    <div className="space-y-4">
      {state.imageUrl && (
        <div className="rounded-lg overflow-hidden bg-surface-container">
          <img src={state.imageUrl} alt="Current" className="w-full h-40 object-contain" />
        </div>
      )}
      <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/10">
        <p className="text-[13px] text-on-surface-variant leading-tight">
          <span className="text-primary font-bold">Pro Tip:</span> Hold <kbd className="px-1.5 py-0.5 bg-surface-variant rounded text-on-surface">C</kbd> to enter Comparison Mode.
        </p>
      </div>
      <div className="space-y-2">
        <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">Image Adjustments</label>
        <SliderControl label="Brightness" value={state.adjustments.brightness} min={-100} max={100} step={1} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { brightness: v } })} />
        <SliderControl label="Contrast" value={state.adjustments.contrast} min={0.5} max={2} step={0.05} format={(v) => v.toFixed(2)} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { contrast: v } })} />
        <SliderControl label="Detail Level" value={state.canvas.asciiWidth} min={30} max={250} step={5} onChange={(v) => dispatch({ type: "SET_CANVAS", canvas: { asciiWidth: v, asciiHeight: Math.round(v * 0.5) } })} />
      </div>
      <div className="space-y-2">
        <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">Transform</label>
        <div className="flex gap-2">
          <button onClick={() => dispatch({ type: "SET_TRANSFORM", t: { rotation: (state.transform.rotation + 90) % 360 } })} className="flex-1 rounded-lg bg-surface-container px-3 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high transition-all">
            ↻ Rotate
          </button>
          <button onClick={() => dispatch({ type: "SET_TRANSFORM", t: { flipH: !state.transform.flipH } })} className={`flex-1 rounded-lg px-3 py-2 text-sm transition-all ${state.transform.flipH ? "bg-primary/20 text-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}>
            ↔ Flip
          </button>
        </div>
      </div>
    </div>
  );
}

function SliderControl({ label, value, min, max, step, format, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const display = format ? format(value) : value;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] text-on-surface-variant font-medium">
        <span>{label}</span>
        <span>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}
