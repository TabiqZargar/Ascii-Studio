import type { CharPreset, GradientPreset, StylePreset } from "../types";

export const CHAR_PRESETS: CharPreset[] = [
  { id: "classic", name: "Classic", chars: "@%#*+=-:.", preview: "@%#*+=-:." },
  { id: "blocks", name: "Blocks", chars: "\u2588\u2593\u2592\u2591", preview: "\u2588\u2593\u2592\u2591\u2588\u2593" },
  { id: "dense", name: "Dense", chars: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYX", preview: "$@B%8&WM#*" },
  { id: "minimal", name: "Minimal", chars: "@#*.", preview: "@#*." },
  { id: "braille", name: "Braille", chars: "\u28FF\u28F7\u28EF\u28E7\u28DF\u28CF\u28BF\u287F", preview: "\u28FF\u28F7\u28EF\u28E7" },
  { id: "binary", name: "Binary", chars: "10", preview: "101101001" },
  { id: "numeric", name: "Numeric", chars: "9876543210", preview: "9876543210" },
  { id: "symbols", name: "Symbols", chars: "#@$%&*!?=+<>", preview: "#@$%&*!?=+<>" },
];

export const GRADIENT_PRESETS: GradientPreset[] = [
  { id: "cyberpunk", name: "Cyberpunk", colors: ["#0d0221", "#0f084b", "#26015f", "#a600ff", "#ff2afc", "#ff0099"] },
  { id: "fire", name: "Fire", colors: ["#1a0000", "#4a0000", "#8b0000", "#cc3300", "#ff6600", "#ffcc00"] },
  { id: "ocean", name: "Ocean", colors: ["#000428", "#001845", "#023e8a", "#0077b6", "#00b4d8", "#90e0ef"] },
  { id: "neon", name: "Neon", colors: ["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460", "#e94560", "#00ff88"] },
  { id: "purple", name: "Purple", colors: ["#0a0011", "#1a0033", "#330066", "#6600cc", "#9933ff", "#cc99ff"] },
  { id: "terminal", name: "Terminal Green", colors: ["#000000", "#001100", "#003300", "#006600", "#00cc00", "#00ff00"] },
  { id: "grayscale", name: "Grayscale", colors: ["#000000", "#333333", "#666666", "#999999", "#cccccc", "#ffffff"] },
  { id: "sunset", name: "Sunset", colors: ["#0c0718", "#2d1b3d", "#6b2fa0", "#d63384", "#ff6b35", "#ffc300"] },
];

export const STYLE_PRESETS: StylePreset[] = [
  { id: "clean", name: "Clean", icon: "\u2728", charPresetId: "classic", colorMode: "mono", monoColor: "#e4e4e7", fontSize: 6, brightness: 10, contrast: 1.1, background: "black" },
  { id: "portrait", name: "Portrait", icon: "\uD83D\uDC64", charPresetId: "dense", colorMode: "mono", monoColor: "#ffffff", fontSize: 5, brightness: 0, contrast: 1.2, background: "black" },
  { id: "landscape", name: "Landscape", icon: "\uD83C\uDFDE", charPresetId: "dense", colorMode: "gradient", gradientId: "ocean", monoColor: "#ffffff", fontSize: 5, brightness: 5, contrast: 1.1, background: "black" },
  { id: "terminal", name: "Terminal", icon: "\uD83D\uDCBB", charPresetId: "classic", colorMode: "gradient", gradientId: "terminal", monoColor: "#00ff00", fontSize: 7, brightness: 0, contrast: 1, background: "black" },
  { id: "matrix", name: "Matrix", icon: "\uD83D\uDFE9", charPresetId: "dense", colorMode: "gradient", gradientId: "terminal", monoColor: "#00ff00", fontSize: 5, brightness: -10, contrast: 1.3, background: "black" },
  { id: "crt", name: "CRT", icon: "\uD83D\uDCFA", charPresetId: "classic", colorMode: "gradient", gradientId: "terminal", monoColor: "#33ff33", fontSize: 6, brightness: 0, contrast: 1.2, background: "black" },
  { id: "pixel-art", name: "Pixel Art", icon: "\uD83C\uDFAE", charPresetId: "blocks", colorMode: "original", monoColor: "#ffffff", fontSize: 6, brightness: 0, contrast: 1, background: "black" },
  { id: "comic", name: "Comic", icon: "\uD83C\uDFAD", charPresetId: "minimal", colorMode: "mono", monoColor: "#000000", fontSize: 8, brightness: 20, contrast: 1.4, background: "white" },
  { id: "noir", name: "Noir", icon: "\uD83C\uDF19", charPresetId: "dense", colorMode: "mono", monoColor: "#d4d4d8", fontSize: 5, brightness: -15, contrast: 1.5, background: "black" },
  { id: "high-contrast", name: "High Contrast", icon: "\u2728", charPresetId: "classic", colorMode: "mono", monoColor: "#ffffff", fontSize: 6, brightness: 0, contrast: 2, background: "black" },
];

export const SAMPLE_IMAGES: { id: string; name: string; icon: string; generate: (ctx: CanvasRenderingContext2D, w: number, h: number) => void }[] = [
  {
    id: "portrait",
    name: "Portrait",
    icon: "\uD83D\uDC64",
    generate: (ctx, w, h) => {
      const cx = w / 2, cy = h * 0.4;
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#d4a574";
      ctx.beginPath();
      ctx.ellipse(cx, cy, w * 0.18, h * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.ellipse(cx - w * 0.06, cy - h * 0.03, w * 0.025, h * 0.015, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + w * 0.06, cy - h * 0.03, w * 0.025, h * 0.015, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#c4956a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy + h * 0.04, w * 0.04, 0.1, Math.PI - 0.1);
      ctx.stroke();
      ctx.fillStyle = "#2d1b69";
      ctx.beginPath();
      ctx.ellipse(cx, cy - h * 0.18, w * 0.22, h * 0.12, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3d3d5c";
      ctx.fillRect(cx - w * 0.15, h * 0.62, w * 0.3, h * 0.38);
    },
  },
  {
    id: "landscape",
    name: "Landscape",
    icon: "\uD83C\uDFDE\uFE0F",
    generate: (ctx, w, h) => {
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.5);
      sky.addColorStop(0, "#0f2027");
      sky.addColorStop(0.5, "#203a43");
      sky.addColorStop(1, "#2c5364");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h * 0.55);
      ctx.fillStyle = "#1a472a";
      ctx.beginPath();
      ctx.moveTo(0, h * 0.55);
      ctx.lineTo(w * 0.15, h * 0.3);
      ctx.lineTo(w * 0.3, h * 0.5);
      ctx.lineTo(w * 0.5, h * 0.2);
      ctx.lineTo(w * 0.7, h * 0.45);
      ctx.lineTo(w * 0.85, h * 0.25);
      ctx.lineTo(w, h * 0.5);
      ctx.lineTo(w, h * 0.55);
      ctx.fill();
      ctx.fillStyle = "#0d3320";
      ctx.beginPath();
      ctx.moveTo(0, h * 0.55);
      ctx.lineTo(w * 0.2, h * 0.4);
      ctx.lineTo(w * 0.4, h * 0.52);
      ctx.lineTo(w * 0.6, h * 0.35);
      ctx.lineTo(w * 0.8, h * 0.48);
      ctx.lineTo(w, h * 0.55);
      ctx.fill();
      ctx.fillStyle = "#0a1628";
      ctx.fillRect(0, h * 0.55, w, h * 0.45);
      ctx.fillStyle = "#162447";
      ctx.fillRect(0, h * 0.6, w, h * 0.4);
    },
  },
  {
    id: "cat",
    name: "Cat",
    icon: "\uD83D\uDC31",
    generate: (ctx, w, h) => {
      ctx.fillStyle = "#1e1e2e";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#f5deb3";
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.55, w * 0.2, h * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#deb887";
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.35);
      ctx.lineTo(w * 0.35, h * 0.15);
      ctx.lineTo(w * 0.42, h * 0.32);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w * 0.58, h * 0.32);
      ctx.lineTo(w * 0.65, h * 0.15);
      ctx.lineTo(w * 0.7, h * 0.35);
      ctx.fill();
      ctx.fillStyle = "#2d5016";
      ctx.beginPath();
      ctx.ellipse(w * 0.42, h * 0.48, w * 0.04, h * 0.05, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(w * 0.58, h * 0.48, w * 0.04, h * 0.05, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.ellipse(w * 0.42, h * 0.48, w * 0.015, h * 0.02, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(w * 0.58, h * 0.48, w * 0.015, h * 0.02, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffb6c1";
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.54, w * 0.02, h * 0.012, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f5deb3";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.52);
      ctx.lineTo(w * 0.15, h * 0.48);
      ctx.moveTo(w * 0.3, h * 0.54);
      ctx.lineTo(w * 0.15, h * 0.54);
      ctx.moveTo(w * 0.7, h * 0.52);
      ctx.lineTo(w * 0.85, h * 0.48);
      ctx.moveTo(w * 0.7, h * 0.54);
      ctx.lineTo(w * 0.85, h * 0.54);
      ctx.stroke();
    },
  },
  {
    id: "city",
    name: "City Skyline",
    icon: "\uD83C\uDFD9\uFE0F",
    generate: (ctx, w, h) => {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#0f0c29");
      sky.addColorStop(0.5, "#302b63");
      sky.addColorStop(1, "#24243e");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      const buildings = [
        [0.05, 0.12, 0.35], [0.18, 0.08, 0.45], [0.28, 0.15, 0.3],
        [0.38, 0.1, 0.5], [0.5, 0.14, 0.35], [0.6, 0.06, 0.55],
        [0.72, 0.12, 0.4], [0.82, 0.09, 0.48], [0.92, 0.11, 0.38],
      ];
      buildings.forEach(([x, bw, bh]) => {
        const bx = x * w;
        const by = h * (1 - bh);
        ctx.fillStyle = `hsl(240, ${10 + Math.random() * 20}%, ${8 + Math.random() * 12}%)`;
        ctx.fillRect(bx, by, bw * w, h - by);
        ctx.fillStyle = "#ffd70033";
        for (let wy = by + 8; wy < h - 8; wy += 12) {
          for (let wx = bx + 4; wx < bx + bw * w - 4; wx += 8) {
            if (Math.random() > 0.4) {
              ctx.fillRect(wx, wy, 3, 4);
            }
          }
        }
      });
    },
  },
  {
    id: "logo",
    name: "Logo",
    icon: "\uD83D\uDCD0",
    generate: (ctx, w, h) => {
      ctx.fillStyle = "#0f0f0f";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#10b981";
      ctx.beginPath();
      ctx.roundRect(w * 0.25, h * 0.2, w * 0.5, h * 0.6, w * 0.05);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.floor(h * 0.25)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("A", w / 2, h * 0.42);
      ctx.font = `600 ${Math.floor(h * 0.06)}px sans-serif`;
      ctx.fillText("ASCII Studio", w / 2, h * 0.62);
    },
  },
];
