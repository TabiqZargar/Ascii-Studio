export interface CharPreset {
  id: string;
  name: string;
  chars: string;
  preview: string;
}

export type ColorMode = "mono" | "original" | "matrix" | "amber" | "cyberpunk" | "fire";

export interface CanvasSettings {
  asciiWidth: number;
  asciiHeight: number;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  fontFamily: string;
}

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

export type BackgroundType = "black" | "white" | "transparent" | "custom" | "gradient";

export interface BackgroundSettings {
  type: BackgroundType;
  color: string;
  gradientColors: [string, string];
}

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

export type LayerType = "image" | "ascii" | "text";

export interface Layer {
  id: string;
  type: LayerType;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
}

export type BrushType = "brush" | "rectangle" | "circle" | "line" | "fill" | "text" | "eraser";

export interface EditorCell {
  row: number;
  col: number;
  char: string;
}

export interface StylePreset {
  id: string;
  name: string;
  icon: string;
  charPresetId: string;
  colorMode: ColorMode;
  monoColor: string;
  fontSize: number;
  brightness: number;
  contrast: number;
  background: BackgroundType;
}

export interface Project {
  id: string;
  name: string;
  savedAt: string;
  charPresetId: string;
  customChars: string;
  colorMode: ColorMode;
  monoColor: string;
  canvas: CanvasSettings;
  adjustments: ImageAdjustments;
  background: BackgroundSettings;
  transform: Transform;
  layers: Layer[];
  editorGrid: EditorCell[][];
}

export interface ImageAnalysis {
  score: "excellent" | "good" | "difficult";
  label: string;
  detail: string;
  suggestedPreset?: string;
  avgBrightness: number;
  avgContrast: number;
}

export interface SettingsSnapshot {
  charPresetId: string;
  customChars: string;
  colorMode: ColorMode;
  monoColor: string;
  canvas: CanvasSettings;
  adjustments: ImageAdjustments;
  background: BackgroundSettings;
  transform: Transform;
}

export interface AsciiFrame {
  output: string;
  colorGrid: string[][];
}

export interface AnimationState {
  frames: AsciiFrame[];
  rawFrames: ImageData[];
  frameTimings: number[];
  currentFrame: number;
  playing: boolean;
  fps: number;
  loop: boolean;
  converting: boolean;
  convertProgress: number;
  convertTotal: number;
}

export interface AppState {
  imageUrl: string | null;
  imageData: ImageData | null;
  imageAnalysis: ImageAnalysis | null;

  charPresetId: string;
  customChars: string;
  colorMode: ColorMode;
  monoColor: string;

  canvas: CanvasSettings;
  adjustments: ImageAdjustments;
  background: BackgroundSettings;
  transform: Transform;

  asciiOutput: string;
  colorGrid: string[][];
  loading: boolean;
  conversionTime: number;

  animation: AnimationState;

  layers: Layer[];
  activeLayerId: string;

  brushType: BrushType;
  brushChar: string;
  brushSize: number;
  editorGrid: EditorCell[][];
  undoStack: EditorCell[][][];
  redoStack: EditorCell[][][];
  settingsUndoStack: SettingsSnapshot[];
  settingsRedoStack: SettingsSnapshot[];

  zoom: number;
  panX: number;
  panY: number;
  fullscreen: boolean;
  comparisonMode: boolean;

  favoritePresets: string[];
  projects: Project[];
  activeProjectId: string | null;
}
