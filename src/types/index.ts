// ── Character Sets ──
export interface CharPreset {
  id: string;
  name: string;
  chars: string;
}

// ── Color ──
export type ColorMode = "mono" | "original" | "gradient";

export interface GradientPreset {
  id: string;
  name: string;
  colors: string[];
}

// ── Canvas ──
export interface CanvasSettings {
  asciiWidth: number;
  asciiHeight: number;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  fontFamily: string;
}

// ── Image Adjustments ──
export interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  gamma: number;
  sharpness: number;
  blur: number;
  invert: boolean;
  grayscale: boolean;
  edgeDetection: boolean;
}

// ── Background ──
export type BackgroundType = "black" | "white" | "transparent" | "custom" | "gradient";

export interface BackgroundSettings {
  type: BackgroundType;
  color: string;
  gradientColors: [string, string];
}

// ── Crop / Transform ──
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Transform {
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

// ── Layers ──
export type LayerType = "image" | "ascii" | "text";

export interface Layer {
  id: string;
  type: LayerType;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
}

// ── Editor ──
export type BrushType =
  | "brush"
  | "rectangle"
  | "circle"
  | "line"
  | "fill"
  | "text"
  | "eraser";

export interface EditorCell {
  row: number;
  col: number;
  char: string;
}

// ── Presets ──
export interface StylePreset {
  id: string;
  name: string;
  charPresetId: string;
  colorMode: ColorMode;
  gradientId?: string;
  monoColor: string;
  fontSize: number;
  background: BackgroundType;
}

// ── Project ──
export interface Project {
  id: string;
  name: string;
  savedAt: string;
  charPresetId: string;
  customChars: string;
  colorMode: ColorMode;
  gradientId: string;
  monoColor: string;
  canvas: CanvasSettings;
  adjustments: ImageAdjustments;
  background: BackgroundSettings;
  transform: Transform;
  layers: Layer[];
  editorGrid: EditorCell[][];
}

// ── App State ──
export interface AppState {
  imageUrl: string | null;
  imageData: ImageData | null;

  charPresetId: string;
  customChars: string;
  colorMode: ColorMode;
  gradientId: string;
  monoColor: string;

  canvas: CanvasSettings;
  adjustments: ImageAdjustments;
  background: BackgroundSettings;
  transform: Transform;

  asciiOutput: string;
  colorGrid: string[][];
  loading: boolean;

  layers: Layer[];
  activeLayerId: string;

  brushType: BrushType;
  brushChar: string;
  brushSize: number;
  editorGrid: EditorCell[][];
  undoStack: EditorCell[][][];
  redoStack: EditorCell[][][];

  zoom: number;
  panX: number;
  panY: number;
  fullscreen: boolean;
  comparisonMode: boolean;
  comparisonPosition: number;

  projects: Project[];
  activeProjectId: string | null;
}
