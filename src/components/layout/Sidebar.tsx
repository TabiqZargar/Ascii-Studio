import { useApp, useDispatch } from "../../context/AppContext";
import { Collapsible } from "../common/Collapsible";
import { Slider, Toggle } from "../common/Controls";

export default function Sidebar() {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-zinc-800 bg-zinc-900 overflow-y-auto">
      <Collapsible title="Brush Tools" defaultOpen>
        <BrushTools />
      </Collapsible>
      <Collapsible title="Character Set">
        <CharacterPanel />
      </Collapsible>
      <Collapsible title="Colors" defaultOpen>
        <ColorPanel />
      </Collapsible>
      <Collapsible title="Canvas">
        <CanvasPanel />
      </Collapsible>
      <Collapsible title="Image Adjustments">
        <AdjustmentsPanel />
      </Collapsible>
      <Collapsible title="Transform">
        <TransformPanel />
      </Collapsible>
      <Collapsible title="Background">
        <BackgroundPanel />
      </Collapsible>
      <Collapsible title="Font">
        <FontPanel />
      </Collapsible>
      <Collapsible title="Layers">
        <LayersPanel />
      </Collapsible>
      <Collapsible title="Export">
        <ExportPanel />
      </Collapsible>
      <Collapsible title="Projects">
        <ProjectPanel />
      </Collapsible>
    </aside>
  );
}

function BrushTools() {
  const state = useApp();
  const dispatch = useDispatch();
  const brushes: Array<{ type: typeof state.brushType; icon: string; label: string }> = [
    { type: "brush", icon: "✏", label: "Brush" },
    { type: "rectangle", icon: "▭", label: "Rectangle" },
    { type: "circle", icon: "○", label: "Circle" },
    { type: "line", icon: "╱", label: "Line" },
    { type: "fill", icon: "◆", label: "Fill" },
    { type: "text", icon: "T", label: "Text" },
    { type: "eraser", icon: "⌫", label: "Eraser" },
  ];

  return (
    <div className="grid grid-cols-4 gap-1">
      {brushes.map((b) => (
        <button
          key={b.type}
          onClick={() => dispatch({ type: "SET_BRUSH_TYPE", brush: b.type })}
          className={`flex flex-col items-center rounded-md p-2 text-lg transition-colors ${
            state.brushType === b.type
              ? "bg-violet-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
          title={b.label}
        >
          <span>{b.icon}</span>
          <span className="mt-0.5 text-[9px]">{b.label}</span>
        </button>
      ))}
      <div className="col-span-4 mt-2">
        <div className="mb-1 text-xs text-zinc-500">Brush Character</div>
        <input
          type="text"
          value={state.brushChar}
          onChange={(e) => dispatch({ type: "SET_BRUSH_CHAR", char: e.target.value.slice(-1) || "@" })}
          maxLength={2}
          className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-center font-mono text-sm text-zinc-300 outline-none focus:border-violet-500"
        />
      </div>
      <div className="col-span-4 mt-2">
        <Slider
          label="Brush Size"
          value={state.brushSize}
          min={1}
          max={10}
          step={1}
          onChange={(v) => dispatch({ type: "SET_BRUSH_SIZE", size: v })}
        />
      </div>
    </div>
  );
}

function CharacterPanel() {
  const state = useApp();
  const dispatch = useDispatch();
  const presets = [
    { id: "classic", name: "Classic", chars: "@%#*+=-:." },
    { id: "blocks", name: "Blocks", chars: "\u2588\u2593\u2592\u2591" },
    { id: "dense", name: "Dense", chars: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYX" },
    { id: "minimal", name: "Minimal", chars: "@#*." },
    { id: "braille", name: "Braille", chars: "\u28FF\u28F7\u28EF\u28E7\u28DF\u28CF\u28BF\u287F" },
    { id: "binary", name: "Binary", chars: "10" },
    { id: "numeric", name: "Numeric", chars: "9876543210" },
    { id: "symbols", name: "Symbols", chars: "#@$%&*!?=+<>" },
  ];

  const savedCustom = (() => {
    try { return JSON.parse(localStorage.getItem("glyphlab_custom_chars") ?? "[]") as string[]; }
    catch { return []; }
  })();

  return (
    <div>
      <div className="grid grid-cols-2 gap-1">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => dispatch({ type: "SET_CHAR_PRESET", id: p.id })}
            className={`rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
              state.charPresetId === p.id
                ? "bg-violet-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            <div className="font-medium">{p.name}</div>
            <div className="font-mono text-[10px] opacity-60 truncate">{p.chars}</div>
          </button>
        ))}
      </div>
      <div className="mt-3">
        <div className="mb-1 text-xs text-zinc-500">Custom Characters</div>
        <input
          type="text"
          value={state.customChars}
          onChange={(e) => {
            dispatch({ type: "SET_CUSTOM_CHARS", chars: e.target.value });
            dispatch({ type: "SET_CHAR_PRESET", id: "custom" });
          }}
          placeholder="Enter your characters..."
          className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 font-mono text-xs text-zinc-300 outline-none focus:border-violet-500"
        />
        {savedCustom.length > 0 && (
          <div className="mt-2">
            <div className="mb-1 text-[10px] text-zinc-600">Saved Sets</div>
            <div className="flex flex-wrap gap-1">
              {savedCustom.map((chars, i) => (
                <button
                  key={i}
                  onClick={() => {
                    dispatch({ type: "SET_CUSTOM_CHARS", chars });
                    dispatch({ type: "SET_CHAR_PRESET", id: "custom" });
                  }}
                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                    state.customChars === chars && state.charPresetId === "custom"
                      ? "bg-violet-600 text-white"
                      : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                  }`}
                >
                  {chars.length > 8 ? chars.slice(0, 8) + "…" : chars}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ColorPanel() {
  const state = useApp();
  const dispatch = useDispatch();
  const gradients = [
    { id: "cyberpunk", name: "Cyberpunk", colors: ["#0d0221","#a600ff","#ff2afc"] },
    { id: "fire", name: "Fire", colors: ["#1a0000","#cc3300","#ffcc00"] },
    { id: "ocean", name: "Ocean", colors: ["#000428","#0077b6","#90e0ef"] },
    { id: "neon", name: "Neon", colors: ["#0a0a0a","#e94560","#00ff88"] },
    { id: "purple", name: "Purple", colors: ["#0a0011","#6600cc","#cc99ff"] },
    { id: "terminal", name: "Terminal", colors: ["#000000","#006600","#00ff00"] },
    { id: "grayscale", name: "Grayscale", colors: ["#000000","#666666","#ffffff"] },
    { id: "sunset", name: "Sunset", colors: ["#0c0718","#d63384","#ffc300"] },
  ];

  return (
    <div>
      <div className="mb-2 flex gap-1">
        {(["mono", "original", "gradient"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => dispatch({ type: "SET_COLOR_MODE", mode })}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs transition-colors ${
              state.colorMode === mode
                ? "bg-violet-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {mode === "mono" ? "Mono" : mode === "original" ? "Original" : "Gradient"}
          </button>
        ))}
      </div>

      {state.colorMode === "mono" && (
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs text-zinc-400">Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={state.monoColor}
              onChange={(e) => dispatch({ type: "SET_MONO_COLOR", color: e.target.value })}
              className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0"
            />
            <span className="font-mono text-xs text-zinc-500">{state.monoColor}</span>
          </div>
        </div>
      )}

      {state.colorMode === "gradient" && (
        <div className="grid grid-cols-2 gap-1">
          {gradients.map((g) => (
            <button
              key={g.id}
              onClick={() => dispatch({ type: "SET_GRADIENT", id: g.id })}
              className={`flex flex-col items-start rounded-md p-2 text-left text-xs transition-colors ${
                state.gradientId === g.id
                  ? "ring-1 ring-violet-500 bg-zinc-700"
                  : "bg-zinc-800 hover:bg-zinc-700"
              }`}
            >
              <span className="text-zinc-300">{g.name}</span>
              <div className="mt-1 flex h-2 w-full overflow-hidden rounded">
                {g.colors.map((c, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CanvasPanel() {
  const state = useApp();
  const dispatch = useDispatch();
  return (
    <div>
      <Slider
        label="ASCII Width"
        value={state.canvas.asciiWidth}
        min={20}
        max={300}
        step={5}
        onChange={(v) => dispatch({ type: "SET_CANVAS", canvas: { asciiWidth: v } })}
      />
      <Slider
        label="ASCII Height"
        value={state.canvas.asciiHeight}
        min={10}
        max={200}
        step={5}
        onChange={(v) => dispatch({ type: "SET_CANVAS", canvas: { asciiHeight: v } })}
      />
      <Slider
        label="Font Size"
        value={state.canvas.fontSize}
        min={2}
        max={24}
        step={1}
        format={(v) => `${v}px`}
        onChange={(v) => dispatch({ type: "SET_CANVAS", canvas: { fontSize: v } })}
      />
      <Slider
        label="Line Height"
        value={state.canvas.lineHeight}
        min={0.5}
        max={3}
        step={0.1}
        onChange={(v) => dispatch({ type: "SET_CANVAS", canvas: { lineHeight: v } })}
      />
      <Slider
        label="Letter Spacing"
        value={state.canvas.letterSpacing}
        min={-2}
        max={10}
        step={0.5}
        format={(v) => `${v}px`}
        onChange={(v) => dispatch({ type: "SET_CANVAS", canvas: { letterSpacing: v } })}
      />
    </div>
  );
}

function AdjustmentsPanel() {
  const state = useApp();
  const dispatch = useDispatch();
  const a = state.adjustments;
  return (
    <div>
      <Slider label="Brightness" value={a.brightness} min={-100} max={100} step={1} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { brightness: v } })} />
      <Slider label="Contrast" value={a.contrast} min={0.5} max={2} step={0.05} format={(v) => v.toFixed(2)} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { contrast: v } })} />
      <Slider label="Saturation" value={a.saturation} min={0} max={3} step={0.1} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { saturation: v } })} />
      <Slider label="Exposure" value={a.exposure} min={0.1} max={3} step={0.1} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { exposure: v } })} />
      <Slider label="Gamma" value={a.gamma} min={0.1} max={3} step={0.1} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { gamma: v } })} />
      <Slider label="Blur" value={a.blur} min={0} max={10} step={0.5} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { blur: v } })} />
      <Slider label="Sharpness" value={a.sharpness} min={0} max={10} step={0.5} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { sharpness: v } })} />
      <Toggle label="Invert Colors" checked={a.invert} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { invert: v } })} />
      <Toggle label="Grayscale" checked={a.grayscale} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { grayscale: v } })} />
      <Toggle label="Edge Detection" checked={a.edgeDetection} onChange={(v) => dispatch({ type: "SET_ADJUSTMENTS", adj: { edgeDetection: v } })} />
      <button onClick={() => dispatch({ type: "RESET_ADJUSTMENTS" })} className="mt-2 w-full rounded-md bg-zinc-800 px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-700">Reset All</button>
    </div>
  );
}

function TransformPanel() {
  const state = useApp();
  const dispatch = useDispatch();
  const t = state.transform;
  return (
    <div>
      <Slider
        label="Rotation"
        value={t.rotation}
        min={-180}
        max={180}
        step={90}
        format={(v) => `${v}°`}
        onChange={(v) => dispatch({ type: "SET_TRANSFORM", t: { rotation: v } })}
      />
      <div className="flex gap-2">
        <button
          onClick={() => dispatch({ type: "SET_TRANSFORM", t: { flipH: !t.flipH } })}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs transition-colors ${t.flipH ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
        >
          Flip H
        </button>
        <button
          onClick={() => dispatch({ type: "SET_TRANSFORM", t: { flipV: !t.flipV } })}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs transition-colors ${t.flipV ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
        >
          Flip V
        </button>
      </div>
    </div>
  );
}

function BackgroundPanel() {
  const state = useApp();
  const dispatch = useDispatch();
  const b = state.background;
  const types = [
    { id: "black", name: "Black" },
    { id: "white", name: "White" },
    { id: "transparent", name: "Transparent" },
    { id: "custom", name: "Custom" },
    { id: "gradient", name: "Gradient" },
  ] as const;

  return (
    <div>
      <div className="mb-2 grid grid-cols-3 gap-1">
        {types.map((t) => (
          <button
            key={t.id}
            onClick={() => dispatch({ type: "SET_BACKGROUND", bg: { type: t.id } })}
            className={`rounded-md px-2 py-1.5 text-xs transition-colors ${
              b.type === t.id
                ? "bg-violet-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>
      {b.type === "custom" && (
        <div className="flex items-center justify-between">
          <label className="text-xs text-zinc-400">Color</label>
          <input
            type="color"
            value={b.color}
            onChange={(e) => dispatch({ type: "SET_BACKGROUND", bg: { color: e.target.value } })}
            className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0"
          />
        </div>
      )}
      {b.type === "gradient" && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={b.gradientColors[0]}
            onChange={(e) =>
              dispatch({
                type: "SET_BACKGROUND",
                bg: { gradientColors: [e.target.value, b.gradientColors[1]] },
              })
            }
            className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0"
          />
          <span className="text-xs text-zinc-600">→</span>
          <input
            type="color"
            value={b.gradientColors[1]}
            onChange={(e) =>
              dispatch({
                type: "SET_BACKGROUND",
                bg: { gradientColors: [b.gradientColors[0], e.target.value] },
              })
            }
            className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0"
          />
        </div>
      )}
    </div>
  );
}

function FontPanel() {
  const state = useApp();
  const dispatch = useDispatch();
  const fonts = [
    { id: "ui-monospace, Consolas, monospace", name: "System Mono" },
    { id: "'Fira Code', monospace", name: "Fira Code" },
    { id: "'JetBrains Mono', monospace", name: "JetBrains Mono" },
    { id: "'IBM Plex Mono', monospace", name: "IBM Plex Mono" },
    { id: "'Cascadia Code', monospace", name: "Cascadia Code" },
    { id: "'Source Code Pro', monospace", name: "Source Code Pro" },
  ];
  return (
    <div className="grid grid-cols-2 gap-1">
      {fonts.map((f) => (
        <button
          key={f.id}
          onClick={() => dispatch({ type: "SET_CANVAS", canvas: { fontFamily: f.id } })}
          className={`rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
            state.canvas.fontFamily === f.id
              ? "bg-violet-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          {f.name}
        </button>
      ))}
    </div>
  );
}

function LayersPanel() {
  const state = useApp();
  const dispatch = useDispatch();
  return (
    <div>
      {state.layers.map((layer) => (
        <div
          key={layer.id}
          className={`mb-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
            state.activeLayerId === layer.id ? "bg-zinc-700" : "bg-zinc-800"
          }`}
        >
          <button
            onClick={() => dispatch({ type: "SET_ACTIVE_LAYER", id: layer.id })}
            className="flex-1 text-left text-zinc-300"
          >
            {layer.name}
          </button>
          <button
            onClick={() => dispatch({ type: "TOGGLE_LAYER", id: layer.id })}
            className={`text-xs ${layer.visible ? "text-zinc-400" : "text-zinc-700"}`}
          >
            {layer.visible ? "👁" : "—"}
          </button>
          <button
            onClick={() => dispatch({ type: "LOCK_LAYER", id: layer.id })}
            className={`text-xs ${layer.locked ? "text-red-400" : "text-zinc-600"}`}
          >
            {layer.locked ? "🔒" : "🔓"}
          </button>
          <button
            onClick={() => dispatch({ type: "MOVE_LAYER", id: layer.id, direction: "up" })}
            className="text-zinc-600 hover:text-zinc-300"
          >↑</button>
          <button
            onClick={() => dispatch({ type: "MOVE_LAYER", id: layer.id, direction: "down" })}
            className="text-zinc-600 hover:text-zinc-300"
          >↓</button>
        </div>
      ))}
      <button
        onClick={() => {
          const id = `layer-${Date.now()}`;
          dispatch({
            type: "ADD_LAYER",
            layer: { id, type: "text", name: `Layer ${state.layers.length + 1}`, visible: true, locked: false, opacity: 1 },
          });
        }}
        className="mt-2 w-full rounded-md border border-dashed border-zinc-700 px-2 py-1.5 text-xs text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
      >
        + Add Layer
      </button>
    </div>
  );
}

function ExportPanel() {
  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => document.dispatchEvent(new CustomEvent("glyphlab-export", { detail: "txt" }))}
        className="rounded-md bg-zinc-800 px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700"
      >
        Export TXT
      </button>
      <button
        onClick={() => document.dispatchEvent(new CustomEvent("glyphlab-export", { detail: "png" }))}
        className="rounded-md bg-zinc-800 px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700"
      >
        Export PNG
      </button>
      <button
        onClick={() => document.dispatchEvent(new CustomEvent("glyphlab-export", { detail: "svg" }))}
        className="rounded-md bg-zinc-800 px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700"
      >
        Export SVG
      </button>
      <button
        onClick={() => document.dispatchEvent(new CustomEvent("glyphlab-export", { detail: "html" }))}
        className="rounded-md bg-zinc-800 px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700"
      >
        Export HTML
      </button>
      <button
        onClick={() => document.dispatchEvent(new CustomEvent("glyphlab-export", { detail: "json" }))}
        className="rounded-md bg-zinc-800 px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700"
      >
        Export Project JSON
      </button>
      <button
        onClick={() => document.dispatchEvent(new CustomEvent("glyphlab-export", { detail: "clipboard" }))}
        className="rounded-md bg-zinc-800 px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700"
      >
        Copy to Clipboard
      </button>
    </div>
  );
}

function ProjectPanel() {
  const state = useApp();
  const dispatch = useDispatch();
  return (
    <div>
      <button
        onClick={() => document.dispatchEvent(new CustomEvent("glyphlab-save"))}
        className="mb-2 w-full rounded-md bg-violet-600 px-2 py-1.5 text-xs text-white hover:bg-violet-500"
      >
        Save Project
      </button>
      {state.projects.length === 0 && (
        <p className="text-xs text-zinc-600">No saved projects</p>
      )}
      {state.projects.map((p) => (
        <div key={p.id} className="mb-1 flex items-center justify-between rounded-md bg-zinc-800 px-2 py-1.5">
          <div className="text-xs text-zinc-300">{p.name}</div>
          <div className="flex gap-1">
            <button
              onClick={() => document.dispatchEvent(new CustomEvent("glyphlab-load-project", { detail: p.id }))}
              className="text-xs text-violet-400 hover:text-violet-300"
            >
              Load
            </button>
            <button
              onClick={() => {
                dispatch({ type: "SET_PROJECTS", projects: state.projects.filter((pp) => pp.id !== p.id) });
                localStorage.setItem("glyphlab_projects", JSON.stringify(state.projects.filter((pp) => pp.id !== p.id)));
              }}
              className="text-xs text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
