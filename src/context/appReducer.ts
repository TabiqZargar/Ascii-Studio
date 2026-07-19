import { CHAR_PRESETS, STYLE_PRESETS } from "../data/presets";
import type { AppState, EditorCell, ImageAnalysis, SettingsSnapshot } from "../types";

export const initialState: AppState = {
  imageUrl: null,
  imageData: null,
  imageAnalysis: null,

  charPresetId: "classic",
  customChars: "",
  colorMode: "mono",
  monoColor: "#ffffff",

  canvas: {
    asciiWidth: 120,
    asciiHeight: 60,
    fontSize: 6,
    lineHeight: 1,
    letterSpacing: 0,
    fontFamily: "'JetBrains Mono', monospace",
  },

  adjustments: {
    brightness: 0,
    contrast: 1,
    saturation: 1,
    exposure: 1,
    gamma: 1,
    sharpness: 0,
    blur: 0,
    invert: false,
    grayscale: false,
    edgeDetection: false,
  },

  background: {
    type: "black",
    color: "#000000",
    gradientColors: ["#000000", "#1a1a2e"],
  },

  transform: { rotation: 0, flipH: false, flipV: false },

  asciiOutput: "",
  colorGrid: [],
  loading: false,
  conversionTime: 0,

  layers: [
    { id: "image-layer", type: "image", name: "Image", visible: true, locked: false, opacity: 1 },
    { id: "ascii-layer", type: "ascii", name: "ASCII", visible: true, locked: false, opacity: 1 },
    { id: "text-layer", type: "text", name: "Text", visible: true, locked: false, opacity: 1 },
  ],
  activeLayerId: "ascii-layer",

  brushType: "brush",
  brushChar: "@",
  brushSize: 1,
  editorGrid: [],
  undoStack: [],
  redoStack: [],
  settingsUndoStack: [],
  settingsRedoStack: [],

  zoom: 1,
  panX: 0,
  panY: 0,
  fullscreen: false,
  comparisonMode: false,

  favoritePresets: JSON.parse(localStorage.getItem("ascii_studio_favorites") ?? "[]"),
  projects: [],
  activeProjectId: null,
};

export type Action =
  | { type: "SET_IMAGE"; url: string; imageData: ImageData; smallImageData?: ImageData; analysis?: ImageAnalysis | null }
  | { type: "CLEAR_IMAGE" }
  | { type: "SET_IMAGE_ANALYSIS"; analysis: ImageAnalysis | null }
  | { type: "SET_CHAR_PRESET"; id: string }
  | { type: "SET_CUSTOM_CHARS"; chars: string }
  | { type: "SET_COLOR_MODE"; mode: AppState["colorMode"] }
  | { type: "SET_MONO_COLOR"; color: string }
  | { type: "SET_CANVAS"; canvas: Partial<AppState["canvas"]> }
  | { type: "SET_ADJUSTMENTS"; adj: Partial<AppState["adjustments"]> }
  | { type: "RESET_ADJUSTMENTS" }
  | { type: "SET_BACKGROUND"; bg: Partial<AppState["background"]> }
  | { type: "SET_TRANSFORM"; t: Partial<AppState["transform"]> }
  | { type: "SET_ASCII"; output: string; colorGrid: string[][]; time: number }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_LAYERS"; layers: AppState["layers"] }
  | { type: "TOGGLE_LAYER"; id: string }
  | { type: "LOCK_LAYER"; id: string }
  | { type: "SET_ACTIVE_LAYER"; id: string }
  | { type: "ADD_LAYER"; layer: AppState["layers"][number] }
  | { type: "REMOVE_LAYER"; id: string }
  | { type: "MOVE_LAYER"; id: string; direction: "up" | "down" }
  | { type: "SET_BRUSH_TYPE"; brush: AppState["brushType"] }
  | { type: "SET_BRUSH_CHAR"; char: string }
  | { type: "SET_BRUSH_SIZE"; size: number }
  | { type: "PAINT_CELLS"; cells: EditorCell[] }
  | { type: "FILL_CELLS"; cells: EditorCell[] }
  | { type: "PUSH_UNDO"; grid: EditorCell[][] }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SET_ZOOM"; zoom: number }
  | { type: "SET_PAN"; x: number; y: number }
  | { type: "TOGGLE_FULLSCREEN" }
  | { type: "TOGGLE_COMPARISON" }
  | { type: "TOGGLE_FAVORITE"; presetId: string }
  | { type: "LOAD_PROJECT"; state: Partial<AppState> }
  | { type: "SET_PROJECTS"; projects: AppState["projects"] }
  | { type: "SET_STYLE_PRESET"; presetId: string }
  | { type: "SURPRISE_ME" }
  | { type: "AUTO_ENHANCE" }
  | { type: "AUTO_OPTIMIZE" }
  | { type: "SETTINGS_UNDO" }
  | { type: "SETTINGS_REDO" };

function captureSettings(state: AppState): SettingsSnapshot {
  return {
    charPresetId: state.charPresetId,
    customChars: state.customChars,
    colorMode: state.colorMode,
    monoColor: state.monoColor,
    canvas: { ...state.canvas },
    adjustments: { ...state.adjustments },
    background: { ...state.background },
    transform: { ...state.transform },
  };
}

function withSettingsUndo(state: AppState, newState: AppState): AppState {
  const snapshot = captureSettings(state);
  return {
    ...newState,
    settingsUndoStack: [...state.settingsUndoStack.slice(-49), snapshot],
    settingsRedoStack: [],
  };
}

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_IMAGE":
      return { ...state, imageUrl: action.url, imageData: action.imageData, imageAnalysis: (action as { analysis?: ImageAnalysis | null }).analysis ?? state.imageAnalysis, editorGrid: [], undoStack: [], redoStack: [] };
    case "CLEAR_IMAGE":
      return { ...state, imageUrl: null, imageData: null, imageAnalysis: null, asciiOutput: "", colorGrid: [], editorGrid: [], undoStack: [], redoStack: [] };
    case "SET_IMAGE_ANALYSIS":
      return { ...state, imageAnalysis: action.analysis };
    case "SET_CHAR_PRESET":
      return { ...state, charPresetId: action.id };
    case "SET_CUSTOM_CHARS":
      return (() => {
        const saved = JSON.parse(localStorage.getItem("ascii_studio_custom_chars") ?? "[]") as string[];
        if (action.chars && !saved.includes(action.chars)) {
          saved.push(action.chars);
          if (saved.length > 20) saved.shift();
          localStorage.setItem("ascii_studio_custom_chars", JSON.stringify(saved));
        }
        return { ...state, customChars: action.chars };
      })();
    case "SET_COLOR_MODE":
      return { ...state, colorMode: action.mode };
    case "SET_MONO_COLOR":
      return { ...state, monoColor: action.color };
    case "SET_CANVAS":
      return { ...state, canvas: { ...state.canvas, ...action.canvas } };
    case "SET_ADJUSTMENTS":
      return { ...state, adjustments: { ...state.adjustments, ...action.adj } };
    case "RESET_ADJUSTMENTS":
      return { ...state, adjustments: { brightness: 0, contrast: 1, saturation: 1, exposure: 1, gamma: 1, sharpness: 0, blur: 0, invert: false, grayscale: false, edgeDetection: false } };
    case "SET_BACKGROUND":
      return { ...state, background: { ...state.background, ...action.bg } };
    case "SET_TRANSFORM":
      return { ...state, transform: { ...state.transform, ...action.t } };
    case "SET_ASCII":
      return { ...state, asciiOutput: action.output, colorGrid: action.colorGrid, loading: false, conversionTime: action.time };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_LAYERS":
      return { ...state, layers: action.layers };
    case "TOGGLE_LAYER":
      return { ...state, layers: state.layers.map((l) => l.id === action.id ? { ...l, visible: !l.visible } : l) };
    case "LOCK_LAYER":
      return { ...state, layers: state.layers.map((l) => l.id === action.id ? { ...l, locked: !l.locked } : l) };
    case "SET_ACTIVE_LAYER":
      return { ...state, activeLayerId: action.id };
    case "ADD_LAYER":
      return { ...state, layers: [...state.layers, action.layer] };
    case "REMOVE_LAYER":
      return { ...state, layers: state.layers.filter((l) => l.id !== action.id), activeLayerId: state.activeLayerId === action.id ? state.layers[0]?.id ?? "" : state.activeLayerId };
    case "MOVE_LAYER": {
      const idx = state.layers.findIndex((l) => l.id === action.id);
      if (idx === -1) return state;
      const newIdx = action.direction === "up" ? idx + 1 : idx - 1;
      if (newIdx < 0 || newIdx >= state.layers.length) return state;
      const nl = [...state.layers];
      [nl[idx], nl[newIdx]] = [nl[newIdx], nl[idx]];
      return { ...state, layers: nl };
    }
    case "SET_BRUSH_TYPE":
      return { ...state, brushType: action.brush };
    case "SET_BRUSH_CHAR":
      return { ...state, brushChar: action.char };
    case "SET_BRUSH_SIZE":
      return { ...state, brushSize: action.size };
    case "PAINT_CELLS": {
      const grid = state.editorGrid.map((r) => [...r]);
      for (const cell of action.cells) {
        while (grid.length <= cell.row) grid.push([]);
        while (grid[cell.row].length <= cell.col) grid[cell.row].push({ row: cell.row, col: grid[cell.row].length, char: " " });
        grid[cell.row][cell.col] = cell;
      }
      return { ...state, editorGrid: grid };
    }
    case "FILL_CELLS": {
      const grid = state.editorGrid.map((r) => [...r]);
      for (const cell of action.cells) {
        while (grid.length <= cell.row) grid.push([]);
        while (grid[cell.row].length <= cell.col) grid[cell.row].push({ row: cell.row, col: grid[cell.row].length, char: " " });
        grid[cell.row][cell.col] = cell;
      }
      return { ...state, editorGrid: grid };
    }
    case "PUSH_UNDO":
      return { ...state, undoStack: [...state.undoStack.slice(-49), action.grid], redoStack: [] };
    case "UNDO": {
      if (state.undoStack.length === 0) return state;
      const prev = state.undoStack[state.undoStack.length - 1];
      return { ...state, undoStack: state.undoStack.slice(0, -1), redoStack: [...state.redoStack, state.editorGrid], editorGrid: prev };
    }
    case "REDO": {
      if (state.redoStack.length === 0) return state;
      const next = state.redoStack[state.redoStack.length - 1];
      return { ...state, redoStack: state.redoStack.slice(0, -1), undoStack: [...state.undoStack, state.editorGrid], editorGrid: next };
    }
    case "SET_ZOOM":
      return { ...state, zoom: Math.max(0.5, Math.min(5, action.zoom)) };
    case "SET_PAN":
      return { ...state, panX: action.x, panY: action.y };
    case "TOGGLE_FULLSCREEN":
      return { ...state, fullscreen: !state.fullscreen };
    case "TOGGLE_COMPARISON":
      return { ...state, comparisonMode: !state.comparisonMode };
    case "TOGGLE_FAVORITE": {
      const favs = state.favoritePresets.includes(action.presetId)
        ? state.favoritePresets.filter((id) => id !== action.presetId)
        : [...state.favoritePresets, action.presetId];
      localStorage.setItem("ascii_studio_favorites", JSON.stringify(favs));
      return { ...state, favoritePresets: favs };
    }
    case "LOAD_PROJECT":
      return { ...initialState, ...action.state };
    case "SET_PROJECTS":
      return { ...state, projects: action.projects };
    case "SET_STYLE_PRESET": {
      const preset = STYLE_PRESETS.find((p) => p.id === action.presetId);
      if (!preset) return state;
      return withSettingsUndo(state, {
        ...state,
        charPresetId: preset.charPresetId,
        colorMode: preset.colorMode,
        monoColor: preset.monoColor,
        canvas: { ...state.canvas, fontSize: preset.fontSize },
        adjustments: { ...state.adjustments, brightness: preset.brightness, contrast: preset.contrast },
        background: { ...state.background, type: preset.background },
      });
    }
    case "SURPRISE_ME": {
      const random = STYLE_PRESETS[Math.floor(Math.random() * STYLE_PRESETS.length)];
      return withSettingsUndo(state, { ...state, charPresetId: random.charPresetId, colorMode: random.colorMode, monoColor: random.monoColor, canvas: { ...state.canvas, fontSize: random.fontSize }, background: { ...state.background, type: random.background } });
    }
    case "AUTO_ENHANCE":
      return withSettingsUndo(state, { ...state, adjustments: { ...state.adjustments, brightness: 10, contrast: 1.3, sharpness: 2, saturation: 1.1, gamma: 0.95 } });
    case "AUTO_OPTIMIZE": {
      if (!state.imageData) return state;
      const { data, width, height } = state.imageData;
      const totalPixels = width * height;
      let brightnessSum = 0;
      let contrastSum = 0;
      const gray = new Uint8ClampedArray(totalPixels);
      for (let i = 0; i < data.length; i += 4) {
        const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        gray[i / 4] = lum;
        brightnessSum += lum;
      }
      const avgBrightness = brightnessSum / totalPixels;
      for (let i = 0; i < gray.length; i++) {
        contrastSum += Math.abs(gray[i] - avgBrightness);
      }
      const avgContrast = contrastSum / totalPixels;

      let brightness = 0;
      let contrast = 1;
      let charPresetId = "dense";
      let colorMode: AppState["colorMode"] = "mono";
      let asciiWidth = 120;

      if (avgBrightness < 60) { brightness = 20; contrast = 1.3; }
      else if (avgBrightness < 100) { brightness = 10; contrast = 1.15; }
      else if (avgBrightness > 200) { brightness = -15; contrast = 1.2; }
      else if (avgBrightness > 160) { brightness = -5; contrast = 1.1; }

      if (avgContrast < 30) { contrast = Math.max(contrast, 1.4); }
      else if (avgContrast > 60) { contrast = Math.min(contrast, 1.1); }

      if (width > 800 || height > 800) asciiWidth = 150;
      else if (width < 300 || height < 300) asciiWidth = 80;

      return withSettingsUndo(state, {
        ...state,
        charPresetId,
        colorMode,
        monoColor: "#ffffff",
        canvas: { ...state.canvas, asciiWidth, asciiHeight: Math.round(asciiWidth * 0.5) },
        adjustments: { ...state.adjustments, brightness, contrast, gamma: 1, sharpness: 0 },
      });
    }
    case "SETTINGS_UNDO": {
      if (state.settingsUndoStack.length === 0) return state;
      const prev = state.settingsUndoStack[state.settingsUndoStack.length - 1];
      const currentSnapshot = captureSettings(state);
      return {
        ...state,
        charPresetId: prev.charPresetId,
        customChars: prev.customChars,
        colorMode: prev.colorMode,
        monoColor: prev.monoColor,
        canvas: prev.canvas,
        adjustments: prev.adjustments,
        background: prev.background,
        transform: prev.transform,
        settingsUndoStack: state.settingsUndoStack.slice(0, -1),
        settingsRedoStack: [...state.settingsRedoStack, currentSnapshot],
      };
    }
    case "SETTINGS_REDO": {
      if (state.settingsRedoStack.length === 0) return state;
      const next = state.settingsRedoStack[state.settingsRedoStack.length - 1];
      const currentSnapshot = captureSettings(state);
      return {
        ...state,
        charPresetId: next.charPresetId,
        customChars: next.customChars,
        colorMode: next.colorMode,
        monoColor: next.monoColor,
        canvas: next.canvas,
        adjustments: next.adjustments,
        background: next.background,
        transform: next.transform,
        settingsRedoStack: state.settingsRedoStack.slice(0, -1),
        settingsUndoStack: [...state.settingsUndoStack, currentSnapshot],
      };
    }
    default:
      return state;
  }
}

export function getActiveCharString(state: AppState): string {
  if (state.charPresetId === "custom") return state.customChars;
  return CHAR_PRESETS.find((p) => p.id === state.charPresetId)?.chars ?? "@%#*+=-:.";
}
