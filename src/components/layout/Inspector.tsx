import { useState } from "react";
import { useApp, useDispatch } from "../../context/AppContext";
import type { Action } from "../../context/appReducer";
import { CHAR_PRESETS } from "../../data/presets";
import type { DockSection } from "./Dock";
import ExportDialog from "../common/ExportDialog";

interface Props {
  section: DockSection;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Inspector({ section, mobileOpen, onCloseMobile }: Props) {
  const state = useApp();
  const dispatch = useDispatch();

  const sectionTitle = {
    upload: "Upload",
    brush: "Draw",
    characters: "Type",
    colors: "Palette",
    layers: "Layers",
    export: "Export",
  }[section];

  return (
    <>
      <aside className="hidden xl:flex fixed right-4 top-24 bottom-24 w-64 rounded-lg bg-surface border border-tertiary flex-col p-4 z-40 floating-panel overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-tertiary flex items-center justify-center text-on-tertiary rounded-sm">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          </div>
          <div>
            <p className="font-label-caps text-[12px] text-tertiary tracking-wider">PROPERTIES</p>
            <p className="font-label-caps text-[8px] text-on-surface-variant opacity-60 tracking-wider">{sectionTitle.toUpperCase()}</p>
          </div>
        </div>
        <div className="space-y-4 flex-1">
          {section === "characters" && <CharactersSection state={state} dispatch={dispatch} />}
          {section === "brush" && <BrushSection state={state} dispatch={dispatch} />}
          {section === "colors" && <ColorsSection state={state} dispatch={dispatch} />}
          {section === "layers" && <LayersSection state={state} dispatch={dispatch} />}
          {section === "export" && <ExportSection />}
          {section === "upload" && <UploadSection state={state} dispatch={dispatch} />}
        </div>
      </aside>

      {mobileOpen && (
        <div className="xl:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative z-10 max-h-[70vh] rounded-t-2xl bg-surface border-t border-tertiary flex flex-col overflow-hidden animate-slideUp">
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-outline-variant/30">
              <div className="w-8 h-1 rounded-full bg-on-surface-variant/30 mx-auto" />
              <button onClick={onCloseMobile} className="absolute right-4 p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className="px-4 pt-3 pb-2">
              <h3 className="text-sm font-medium text-secondary font-label-caps tracking-wider">{sectionTitle}</h3>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-label-caps">Properties</p>
            </div>
            <div className="space-y-4 overflow-y-auto px-4 pb-6 flex-1 min-h-0" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
              {section === "characters" && <CharactersSection state={state} dispatch={dispatch} />}
              {section === "brush" && <BrushSection state={state} dispatch={dispatch} />}
              {section === "colors" && <ColorsSection state={state} dispatch={dispatch} />}
              {section === "layers" && <LayersSection state={state} dispatch={dispatch} />}
              {section === "export" && <ExportSection />}
              {section === "upload" && <UploadSection state={state} dispatch={dispatch} />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CharactersSection({ state, dispatch }: { state: ReturnType<typeof useApp>; dispatch: React.Dispatch<Action> }) {
  return (
    <>
      <section>
        <h3 className="text-tertiary font-label-caps text-[10px] uppercase mb-2 border-b border-outline-variant pb-1 tracking-wider">Engine Settings</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-surface-container border border-outline-variant">
            <label className="font-label-caps text-[9px] text-on-surface-variant block mb-1 tracking-wider">
              DENSITY
              <input
                type="range"
                min={30}
                max={250}
                step={5}
                value={state.canvas.asciiWidth}
                onChange={(e) => dispatch({ type: "SET_CANVAS", canvas: { asciiWidth: Number(e.target.value), asciiHeight: Math.round(Number(e.target.value) * 0.5) } })}
                className="w-full accent-tertiary bg-outline-variant h-1 rounded-full appearance-none mt-1"
              />
            </label>
          </div>
          <div className="p-2 bg-surface-container border border-outline-variant">
            <label className="font-label-caps text-[9px] text-on-surface-variant block mb-1 tracking-wider">
              OFFSET
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={state.canvas.letterSpacing}
                onChange={(e) => dispatch({ type: "SET_CANVAS", canvas: { letterSpacing: Number(e.target.value) } })}
                className="w-full accent-tertiary bg-outline-variant h-1 rounded-full appearance-none mt-1"
              />
            </label>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-tertiary font-label-caps text-[10px] uppercase mb-2 border-b border-outline-variant pb-1 tracking-wider">Character Sets</h3>
        <div className="space-y-1">
          {CHAR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => dispatch({ type: "SET_CHAR_PRESET", id: preset.id })}
              className={`w-full flex justify-between items-center pl-3 py-1.5 transition-all cursor-pointer ${
                state.charPresetId === preset.id
                  ? "text-tertiary font-bold border-l-2 border-tertiary bg-tertiary/10"
                  : "text-on-surface-variant hover:text-tertiary border-l-2 border-transparent"
              }`}
            >
              <span className="font-label-caps text-[11px] tracking-wider">{preset.name}</span>
              {state.charPresetId === preset.id && (
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
              )}
            </button>
          ))}
          <div className="mt-2">
            <input
              type="text"
              value={state.customChars}
              onChange={(e) => {
                dispatch({ type: "SET_CUSTOM_CHARS", chars: e.target.value });
                dispatch({ type: "SET_CHAR_PRESET", id: "custom" });
              }}
              placeholder="Custom chars..."
              className="w-full rounded-sm border border-outline-variant bg-surface-container px-2 py-1.5 text-xs font-label-caps text-on-surface outline-none focus:border-tertiary transition-colors tracking-wider"
            />
          </div>
        </div>
      </section>
    </>
  );
}

function BrushSection({ state, dispatch }: { state: ReturnType<typeof useApp>; dispatch: React.Dispatch<Action> }) {
  const brushes: Array<{ type: string; icon: string; label: string }> = [
    { type: "brush", icon: "brush", label: "DRAW" },
    { type: "rectangle", icon: "rectangle", label: "RECT" },
    { type: "circle", icon: "circle", label: "CIRCLE" },
    { type: "line", icon: "pen_size_1", label: "LINE" },
    { type: "fill", icon: "format_color_fill", label: "FILL" },
    { type: "text", icon: "text_fields", label: "TYPE" },
    { type: "eraser", icon: "backspace", label: "ERASE" },
  ];

  return (
    <>
      <section>
        <h3 className="text-tertiary font-label-caps text-[10px] uppercase mb-2 border-b border-outline-variant pb-1 tracking-wider">Brush Tools</h3>
        <div className="grid grid-cols-4 gap-2">
          {brushes.map((b) => (
            <button
              key={b.type}
              onClick={() => dispatch({ type: "SET_BRUSH_TYPE", brush: b.type as import("../../types").BrushType })}
              className={`flex flex-col items-center rounded-sm p-2 transition-all ${
                state.brushType === b.type
                  ? "bg-secondary text-on-secondary"
                  : "bg-surface-container text-secondary hover:bg-secondary-container hover:text-on-secondary-container"
              }`}
            >
              <span className="material-symbols-outlined text-lg">{b.icon}</span>
              <span className="font-label-caps text-[7px] mt-1 tracking-wider">{b.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-tertiary font-label-caps text-[10px] uppercase mb-2 border-b border-outline-variant pb-1 tracking-wider">Brush Character</h3>
        <input
          type="text"
          value={state.brushChar}
          onChange={(e) => dispatch({ type: "SET_BRUSH_CHAR", char: e.target.value.slice(-1) || "@" })}
          maxLength={2}
          className="w-full rounded-sm border border-outline-variant bg-surface-container px-2 py-1.5 text-center text-sm font-label-caps text-on-surface outline-none focus:border-tertiary transition-colors tracking-wider"
        />
      </section>

      <section>
        <h3 className="text-tertiary font-label-caps text-[10px] uppercase mb-2 border-b border-outline-variant pb-1 tracking-wider">Brush Size</h3>
        <div className="flex justify-between text-[11px] text-on-surface-variant font-label-caps mb-1">
          <span className="tracking-wider">SIZE</span>
          <span>{state.brushSize}</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={state.brushSize}
          onChange={(e) => dispatch({ type: "SET_BRUSH_SIZE", size: Number(e.target.value) })}
          className="w-full accent-tertiary"
        />
      </section>
    </>
  );
}

function ColorsSection({ state, dispatch }: { state: ReturnType<typeof useApp>; dispatch: React.Dispatch<Action> }) {
  const modes = [
    { id: "mono" as const, name: "MONO", color: state.monoColor },
    { id: "original" as const, name: "COLOR", color: "#ffffff" },
    { id: "matrix" as const, name: "MATRIX", color: "#00ff00" },
    { id: "amber" as const, name: "AMBER", color: "#ffaa00" },
    { id: "cyberpunk" as const, name: "CYBER", color: "#a600ff" },
    { id: "fire" as const, name: "FIRE", color: "#ff6600" },
  ];

  return (
    <>
      <section>
        <h3 className="text-tertiary font-label-caps text-[10px] uppercase mb-2 border-b border-outline-variant pb-1 tracking-wider">Color Mode</h3>
        <div className="grid grid-cols-3 gap-2">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => dispatch({ type: "SET_COLOR_MODE", mode: m.id })}
              className={`flex flex-col items-center rounded-sm p-2 transition-all ${
                state.colorMode === m.id
                  ? "bg-tertiary/20 border border-tertiary text-tertiary"
                  : "bg-surface-container border border-outline-variant text-on-surface-variant hover:border-tertiary hover:text-tertiary"
              }`}
            >
              <div className="mb-1 h-2 w-full rounded-full" style={{ backgroundColor: m.color, opacity: 0.8 }} />
              <span className="font-label-caps text-[8px] tracking-wider">{m.name}</span>
            </button>
          ))}
        </div>
      </section>

      {state.colorMode === "mono" && (
        <section>
          <h3 className="text-tertiary font-label-caps text-[10px] uppercase mb-2 border-b border-outline-variant pb-1 tracking-wider">Mono Color</h3>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={state.monoColor}
              onChange={(e) => dispatch({ type: "SET_MONO_COLOR", color: e.target.value })}
              className="h-8 w-8 cursor-pointer border-0 bg-transparent"
            />
            <span className="text-sm font-label-caps text-on-surface-variant tracking-wider">{state.monoColor}</span>
          </div>
        </section>
      )}
    </>
  );
}

function LayersSection({ state, dispatch }: { state: ReturnType<typeof useApp>; dispatch: React.Dispatch<Action> }) {
  return (
    <>
      <section>
        <h3 className="text-tertiary font-label-caps text-[10px] uppercase mb-2 border-b border-outline-variant pb-1 tracking-wider">Layers</h3>
        <div className="space-y-1">
          {state.layers.map((layer) => (
            <div
              key={layer.id}
              className={`flex items-center gap-2 rounded-sm px-2 py-1.5 transition-all ${
                state.activeLayerId === layer.id
                  ? "bg-surface-container-high border border-tertiary/30"
                  : "bg-surface-container border border-outline-variant/30"
              }`}
            >
              <button
                onClick={() => dispatch({ type: "SET_ACTIVE_LAYER", id: layer.id })}
                className="flex-1 text-left text-[11px] font-label-caps text-on-surface tracking-wider"
              >
                {layer.name}
              </button>
              <button
                onClick={() => dispatch({ type: "TOGGLE_LAYER", id: layer.id })}
                className={`material-symbols-outlined text-base ${layer.visible ? "text-on-surface-variant" : "text-surface-variant"}`}
              >
                {layer.visible ? "visibility" : "visibility_off"}
              </button>
              <button
                onClick={() => dispatch({ type: "LOCK_LAYER", id: layer.id })}
                className={`material-symbols-outlined text-base ${layer.locked ? "text-error" : "text-on-surface-variant"}`}
              >
                {layer.locked ? "lock" : "lock_open"}
              </button>
            </div>
          ))}
          <button
            onClick={() => dispatch({ type: "ADD_LAYER", layer: { id: `layer-${Date.now()}`, type: "text", name: `Layer ${state.layers.length + 1}`, visible: true, locked: false, opacity: 1 } })}
            className="w-full rounded-sm border border-dashed border-outline-variant px-2 py-1.5 text-[10px] font-label-caps text-on-surface-variant hover:border-tertiary hover:text-tertiary transition-all tracking-wider"
          >
            + ADD LAYER
          </button>
        </div>
      </section>
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
        className="w-full flex items-center justify-center gap-2 rounded-sm bg-primary-container px-4 py-3 text-sm font-label-caps text-on-primary-container hover:bg-primary/80 transition-all active:scale-[0.98] tracking-wider uppercase"
      >
        <span className="material-symbols-outlined text-lg">tune</span>
        FULL EXPORT
      </button>

      <h3 className="text-tertiary font-label-caps text-[10px] uppercase border-b border-outline-variant pb-1 tracking-wider">Quick Export</h3>
      <div className="grid grid-cols-2 gap-2">
        {[
          { format: "txt", icon: "description", label: "TXT" },
          { format: "png", icon: "image", label: "PNG" },
          { format: "html", icon: "code", label: "HTML" },
          { format: "clipboard", icon: "content_copy", label: "COPY" },
          { format: "copy-html", icon: "content_paste", label: "COPY HTML" },
          { format: "json", icon: "data_object", label: "JSON" },
        ].map(({ format, icon, label }) => (
          <button
            key={format}
            onClick={() => document.dispatchEvent(new CustomEvent("ascii-studio-export", { detail: format }))}
            className="flex items-center gap-2 rounded-sm bg-surface-container-high px-3 py-2 text-[10px] font-label-caps text-on-surface-variant border border-outline-variant hover:border-tertiary hover:text-tertiary transition-all tracking-wider"
          >
            <span className="material-symbols-outlined text-base">{icon}</span>
            {label}
          </button>
        ))}
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
        <div className="rounded-sm overflow-hidden bg-surface-container border border-outline-variant">
          <img src={state.imageUrl} alt="Current" className="w-full h-32 object-contain" />
        </div>
      )}

      <section>
        <h3 className="text-tertiary font-label-caps text-[10px] uppercase mb-2 border-b border-outline-variant pb-1 tracking-wider">Image Settings</h3>
        <div className="space-y-2">
          <button
            onClick={() => dispatch({ type: "SET_ADJUSTMENTS", adj: { invert: !state.adjustments.invert } })}
            className={`w-full flex items-center justify-between rounded-sm px-3 py-2 text-[10px] font-label-caps border transition-all tracking-wider ${
              state.adjustments.invert
                ? "bg-secondary/20 text-secondary border-secondary"
                : "bg-surface-container-high text-on-surface-variant border-outline-variant hover:border-tertiary hover:text-tertiary"
            }`}
          >
            <span>INVERT</span>
            <span className={`material-symbols-outlined text-[16px] ${state.adjustments.invert ? "text-secondary" : "text-on-surface-variant"}`}>
              {state.adjustments.invert ? "toggle_on" : "toggle_off"}
            </span>
          </button>

          <div className="space-y-1">
            <label className="font-label-caps text-[9px] text-on-surface-variant tracking-wider">LUMINANCE</label>
            <select
              value={state.luminanceFormula}
              onChange={(e) => dispatch({ type: "SET_LUMINANCE_FORMULA", formula: e.target.value as import("../../types").LuminanceFormula })}
              className="w-full rounded-sm border border-outline-variant bg-surface-container px-2 py-1.5 text-xs font-label-caps text-on-surface outline-none focus:border-tertiary transition-colors tracking-wider appearance-none cursor-pointer"
            >
              <option value="perceived">Perceived (Rec. 709)</option>
              <option value="average">Average RGB</option>
              <option value="max">Max Channel</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-label-caps text-[9px] text-on-surface-variant tracking-wider">TRANSPARENCY BG</label>
            <select
              value={state.transparencyBg}
              onChange={(e) => dispatch({ type: "SET_TRANSPARENCY_BG", bg: e.target.value as import("../../types").TransparencyBg })}
              className="w-full rounded-sm border border-outline-variant bg-surface-container px-2 py-1.5 text-xs font-label-caps text-on-surface outline-none focus:border-tertiary transition-colors tracking-wider appearance-none cursor-pointer"
            >
              <option value="white">White</option>
              <option value="black">Black</option>
              <option value="checkerboard">Checkerboard</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {state.transparencyBg === "custom" && (
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={state.transparencyCustomColor}
                onChange={(e) => dispatch({ type: "SET_TRANSPARENCY_CUSTOM_COLOR", color: e.target.value })}
                className="h-8 w-8 cursor-pointer border-0 bg-transparent"
              />
              <span className="text-sm font-label-caps text-on-surface-variant tracking-wider">{state.transparencyCustomColor}</span>
            </div>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-tertiary font-label-caps text-[10px] uppercase mb-2 border-b border-outline-variant pb-1 tracking-wider">Image Adjustments</h3>
        <div className="space-y-2">
          <SliderControl label="BRIGHTNESS" value={state.adjustments.brightness} min={-100} max={100} step={1} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { brightness: v } })} />
          <SliderControl label="CONTRAST" value={state.adjustments.contrast} min={0.5} max={2} step={0.05} format={(v) => v.toFixed(2)} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { contrast: v } })} />
          <SliderControl label="GAMMA" value={state.adjustments.gamma} min={0.1} max={3} step={0.1} format={(v) => v.toFixed(1)} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { gamma: v } })} />
        </div>
      </section>

      <section>
        <h3 className="text-tertiary font-label-caps text-[10px] uppercase mb-2 border-b border-outline-variant pb-1 tracking-wider">Transform</h3>
        <div className="flex gap-2">
          <button
            onClick={() => dispatch({ type: "SET_TRANSFORM", t: { rotation: (state.transform.rotation + 90) % 360 } })}
            className="flex-1 rounded-sm bg-surface-container-high px-3 py-2 text-[10px] font-label-caps text-on-surface-variant border border-outline-variant hover:border-tertiary hover:text-tertiary transition-all tracking-wider"
          >
            ROTATE
          </button>
          <button
            onClick={() => dispatch({ type: "SET_TRANSFORM", t: { flipH: !state.transform.flipH } })}
            className={`flex-1 rounded-sm px-3 py-2 text-[10px] font-label-caps border transition-all tracking-wider ${
              state.transform.flipH
                ? "bg-secondary/20 text-secondary border-secondary"
                : "bg-surface-container-high text-on-surface-variant border-outline-variant hover:border-tertiary hover:text-tertiary"
            }`}
          >
            FLIP
          </button>
        </div>
      </section>
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
      <div className="flex justify-between text-[10px] text-on-surface-variant font-label-caps">
        <span className="tracking-wider">{label}</span>
        <span>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-tertiary"
      />
    </div>
  );
}
