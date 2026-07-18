import type { AppState, EditorCell } from "../types";
import { CHAR_PRESETS, GRADIENT_PRESETS, STYLE_PRESETS } from "../data/presets";

export const initialState: AppState = {
  imageUrl: null,
  imageData: null,

  charPresetId: "classic",
  customChars: "",
  colorMode: "mono",
  gradientId: "cyberpunk",
  monoColor: "#ffffff",

  canvas: {
    asciiWidth: 100,
    asciiHeight: 60,
    fontSize: 6,
    lineHeight: 1,
    letterSpacing: 0,
    fontFamily: "ui-monospace, Consolas, monospace",
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

  transform: {
    rotation: 0,
    flipH: false,
    flipV: false,
  },

  asciiOutput: "",
  colorGrid: [],
  loading: false,

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

  zoom: 1,
  panX: 0,
  panY: 0,
  fullscreen: false,
  comparisonMode: false,
  comparisonPosition: 50,

  projects: [],
  activeProjectId: null,
};

export type Action =
  | { type: "SET_IMAGE"; url: string; imageData: ImageData }
  | { type: "CLEAR_IMAGE" }
  | { type: "SET_CHAR_PRESET"; id: string }
  | { type: "SET_CUSTOM_CHARS"; chars: string }
  | { type: "SET_COLOR_MODE"; mode: AppState["colorMode"] }
  | { type: "SET_GRADIENT"; id: string }
  | { type: "SET_MONO_COLOR"; color: string }
  | { type: "SET_CANVAS"; canvas: Partial<AppState["canvas"]> }
  | { type: "SET_ADJUSTMENTS"; adj: Partial<AppState["adjustments"]> }
  | { type: "RESET_ADJUSTMENTS" }
  | { type: "SET_BACKGROUND"; bg: Partial<AppState["background"]> }
  | { type: "SET_TRANSFORM"; t: Partial<AppState["transform"]> }
  | { type: "SET_ASCII"; output: string; colorGrid: string[][] }
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
  | { type: "SET_COMPARISON_POS"; pos: number }
  | { type: "LOAD_PROJECT"; state: Partial<AppState> }
  | { type: "SET_PROJECTS"; projects: AppState["projects"] }
  | { type: "SET_STYLE_PRESET"; presetId: string };

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_IMAGE":
      return {
        ...state,
        imageUrl: action.url,
        imageData: action.imageData,
        editorGrid: [],
        undoStack: [],
        redoStack: [],
      };

    case "CLEAR_IMAGE":
      return {
        ...state,
        imageUrl: null,
        imageData: null,
        asciiOutput: "",
        colorGrid: [],
        editorGrid: [],
        undoStack: [],
        redoStack: [],
      };

    case "SET_CHAR_PRESET":
      return { ...state, charPresetId: action.id };

    case "SET_CUSTOM_CHARS": {
      const saved = JSON.parse(localStorage.getItem("glyphlab_custom_chars") ?? "[]") as string[];
      if (action.chars && !saved.includes(action.chars)) {
        saved.push(action.chars);
        if (saved.length > 20) saved.shift();
        localStorage.setItem("glyphlab_custom_chars", JSON.stringify(saved));
      }
      return { ...state, customChars: action.chars };
    }

    case "SET_COLOR_MODE":
      return { ...state, colorMode: action.mode };

    case "SET_GRADIENT":
      return { ...state, gradientId: action.id };

    case "SET_MONO_COLOR":
      return { ...state, monoColor: action.color };

    case "SET_CANVAS":
      return { ...state, canvas: { ...state.canvas, ...action.canvas } };

    case "SET_ADJUSTMENTS":
      return { ...state, adjustments: { ...state.adjustments, ...action.adj } };

    case "RESET_ADJUSTMENTS":
      return {
        ...state,
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
      };

    case "SET_BACKGROUND":
      return { ...state, background: { ...state.background, ...action.bg } };

    case "SET_TRANSFORM":
      return { ...state, transform: { ...state.transform, ...action.t } };

    case "SET_ASCII":
      return {
        ...state,
        asciiOutput: action.output,
        colorGrid: action.colorGrid,
        loading: false,
      };

    case "SET_LOADING":
      return { ...state, loading: action.loading };

    case "SET_LAYERS":
      return { ...state, layers: action.layers };

    case "TOGGLE_LAYER":
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.id ? { ...l, visible: !l.visible } : l
        ),
      };

    case "LOCK_LAYER":
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.id ? { ...l, locked: !l.locked } : l
        ),
      };

    case "SET_ACTIVE_LAYER":
      return { ...state, activeLayerId: action.id };

    case "ADD_LAYER":
      return { ...state, layers: [...state.layers, action.layer] };

    case "REMOVE_LAYER":
      return {
        ...state,
        layers: state.layers.filter((l) => l.id !== action.id),
        activeLayerId:
          state.activeLayerId === action.id
            ? state.layers[0]?.id ?? ""
            : state.activeLayerId,
      };

    case "MOVE_LAYER": {
      const idx = state.layers.findIndex((l) => l.id === action.id);
      if (idx === -1) return state;
      const newIdx = action.direction === "up" ? idx + 1 : idx - 1;
      if (newIdx < 0 || newIdx >= state.layers.length) return state;
      const newLayers = [...state.layers];
      [newLayers[idx], newLayers[newIdx]] = [newLayers[newIdx], newLayers[idx]];
      return { ...state, layers: newLayers };
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
        while (grid[cell.row].length <= cell.col) {
          grid[cell.row].push({ row: cell.row, col: cell.col, char: " " });
        }
        grid[cell.row][cell.col] = cell;
      }
      return { ...state, editorGrid: grid };
    }

    case "FILL_CELLS": {
      const grid = state.editorGrid.map((r) => [...r]);
      for (const cell of action.cells) {
        while (grid.length <= cell.row) grid.push([]);
        while (grid[cell.row].length <= cell.col) {
          grid[cell.row].push({ row: cell.row, col: cell.col, char: " " });
        }
        grid[cell.row][cell.col] = cell;
      }
      return { ...state, editorGrid: grid };
    }

    case "PUSH_UNDO":
      return {
        ...state,
        undoStack: [...state.undoStack.slice(-49), action.grid],
        redoStack: [],
      };

    case "UNDO": {
      if (state.undoStack.length === 0) return state;
      const prev = state.undoStack[state.undoStack.length - 1];
      return {
        ...state,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, state.editorGrid],
        editorGrid: prev,
      };
    }

    case "REDO": {
      if (state.redoStack.length === 0) return state;
      const next = state.redoStack[state.redoStack.length - 1];
      return {
        ...state,
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, state.editorGrid],
        editorGrid: next,
      };
    }

    case "SET_ZOOM":
      return { ...state, zoom: Math.max(0.5, Math.min(5, action.zoom)) };

    case "SET_PAN":
      return { ...state, panX: action.x, panY: action.y };

    case "TOGGLE_FULLSCREEN":
      return { ...state, fullscreen: !state.fullscreen };

    case "TOGGLE_COMPARISON":
      return {
        ...state,
        comparisonMode: !state.comparisonMode,
        comparisonPosition: 50,
      };

    case "SET_COMPARISON_POS":
      return { ...state, comparisonPosition: action.pos };

    case "LOAD_PROJECT":
      return { ...initialState, ...action.state };

    case "SET_PROJECTS":
      return { ...state, projects: action.projects };

    case "SET_STYLE_PRESET": {
      const preset = STYLE_PRESETS.find((p) => p.id === action.presetId);
      if (!preset) return state;
      return {
        ...state,
        charPresetId: preset.charPresetId,
        colorMode: preset.colorMode,
        gradientId: preset.gradientId ?? state.gradientId,
        monoColor: preset.monoColor,
        canvas: { ...state.canvas, fontSize: preset.fontSize },
        background: { ...state.background, type: preset.background },
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

export function getActiveGradient(state: AppState): string[] {
  return GRADIENT_PRESETS.find((g) => g.id === state.gradientId)?.colors ?? GRADIENT_PRESETS[0].colors;
}
