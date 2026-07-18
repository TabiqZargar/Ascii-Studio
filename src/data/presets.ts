import type { CharPreset, GradientPreset, StylePreset } from "../types";

export const CHAR_PRESETS: CharPreset[] = [
  { id: "classic", name: "Classic", chars: "@%#*+=-:." },
  { id: "blocks", name: "Blocks", chars: "\u2588\u2593\u2592\u2591" },
  { id: "dense", name: "Dense", chars: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYX" },
  { id: "minimal", name: "Minimal", chars: "@#*." },
  { id: "braille", name: "Braille", chars: "\u28FF\u28F7\u28EF\u28E7\u28DF\u28CF\u28BF\u287F" },
  { id: "binary", name: "Binary", chars: "10" },
  { id: "numeric", name: "Numeric", chars: "9876543210" },
  { id: "symbols", name: "Symbols", chars: "#@$%&*!?=+<>" },
];

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    colors: ["#0d0221", "#0f084b", "#26015f", "#a600ff", "#ff2afc", "#ff0099"],
  },
  {
    id: "fire",
    name: "Fire",
    colors: ["#1a0000", "#4a0000", "#8b0000", "#cc3300", "#ff6600", "#ffcc00"],
  },
  {
    id: "ocean",
    name: "Ocean",
    colors: ["#000428", "#001845", "#023e8a", "#0077b6", "#00b4d8", "#90e0ef"],
  },
  {
    id: "neon",
    name: "Neon",
    colors: ["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460", "#e94560", "#00ff88"],
  },
  {
    id: "purple",
    name: "Purple",
    colors: ["#0a0011", "#1a0033", "#330066", "#6600cc", "#9933ff", "#cc99ff"],
  },
  {
    id: "terminal",
    name: "Terminal Green",
    colors: ["#000000", "#001100", "#003300", "#006600", "#00cc00", "#00ff00"],
  },
  {
    id: "grayscale",
    name: "Grayscale",
    colors: ["#000000", "#333333", "#666666", "#999999", "#cccccc", "#ffffff"],
  },
  {
    id: "sunset",
    name: "Sunset",
    colors: ["#0c0718", "#2d1b3d", "#6b2fa0", "#d63384", "#ff6b35", "#ffc300"],
  },
];

export const STYLE_PRESETS: StylePreset[] = [
  { id: "matrix", name: "Matrix", charPresetId: "dense", colorMode: "gradient", gradientId: "terminal", monoColor: "#00ff00", fontSize: 12, background: "black" },
  { id: "retro-crt", name: "Retro CRT", charPresetId: "classic", colorMode: "gradient", gradientId: "terminal", monoColor: "#33ff33", fontSize: 14, background: "black" },
  { id: "terminal", name: "Terminal", charPresetId: "classic", colorMode: "mono", monoColor: "#00ff00", fontSize: 13, background: "black" },
  { id: "blueprint", name: "Blueprint", charPresetId: "classic", colorMode: "gradient", gradientId: "ocean", monoColor: "#4fc3f7", fontSize: 12, background: "black" },
  { id: "cyberpunk", name: "Cyberpunk", charPresetId: "dense", colorMode: "gradient", gradientId: "cyberpunk", monoColor: "#ff0099", fontSize: 11, background: "black" },
  { id: "vintage", name: "Vintage", charPresetId: "classic", colorMode: "gradient", gradientId: "sunset", monoColor: "#d4a574", fontSize: 13, background: "black" },
  { id: "noir", name: "Noir", charPresetId: "dense", colorMode: "mono", monoColor: "#ffffff", fontSize: 10, background: "black" },
  { id: "manga", name: "Manga", charPresetId: "minimal", colorMode: "mono", monoColor: "#ffffff", fontSize: 16, background: "white" },
  { id: "pixel-art", name: "Pixel Art", charPresetId: "blocks", colorMode: "original", monoColor: "#ffffff", fontSize: 12, background: "black" },
  { id: "neon", name: "Neon", charPresetId: "symbols", colorMode: "gradient", gradientId: "neon", monoColor: "#00ff88", fontSize: 12, background: "black" },
  { id: "comic", name: "Comic", charPresetId: "minimal", colorMode: "mono", monoColor: "#000000", fontSize: 14, background: "white" },
];

export const FONT_OPTIONS = [
  { id: "fira-code", name: "Fira Code", family: "'Fira Code', monospace" },
  { id: "jetbrains", name: "JetBrains Mono", family: "'JetBrains Mono', monospace" },
  { id: "ibm-plex", name: "IBM Plex Mono", family: "'IBM Plex Mono', monospace" },
  { id: "cascadia", name: "Cascadia Code", family: "'Cascadia Code', monospace" },
  { id: "source-code", name: "Source Code Pro", family: "'Source Code Pro', monospace" },
  { id: "system", name: "System Mono", family: "ui-monospace, Consolas, monospace" },
];
