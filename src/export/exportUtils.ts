import { getThemeColor } from "../utils/colorThemes";

export function resolveColor(
  colorMode: string,
  r: number,
  g: number,
  b: number,
  monoColor: string
): string {
  if (colorMode === "original") return `rgb(${r},${g},${b})`;
  if (colorMode === "mono") return monoColor;
  const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  return getThemeColor(colorMode as never, lum, `rgb(${r},${g},${b})`);
}

export function splitAsciiToGrid(ascii: string): string[][] {
  return ascii.split("\n").map((line) => line.split(""));
}

export function getCharDimensions(fontSize: number, lineHeight: number, letterSpacing: number) {
  return {
    charW: fontSize * 0.6 + letterSpacing,
    charH: fontSize * lineHeight,
  };
}

export function getCanvasSize(
  grid: string[][],
  fontSize: number,
  lineHeight: number,
  letterSpacing: number
) {
  const { charW, charH } = getCharDimensions(fontSize, lineHeight, letterSpacing);
  const maxCols = Math.max(...grid.map((row) => row.length), 1);
  const rows = grid.length;
  return {
    width: Math.max(1, maxCols * charW),
    height: Math.max(1, rows * charH),
    charW,
    charH,
  };
}

export function parseRgb(rgb: string): { r: number; g: number; b: number } | null {
  const match = rgb.match(/rgb\((\d+),(\d+),(\d+)\)/);
  if (!match) return null;
  return { r: +match[1], g: +match[2], b: +match[3] };
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderFrameToCanvas(
  ascii: string,
  colorGrid: string[][],
  colorMode: string,
  fontSize: number,
  lineHeight: number,
  letterSpacing: number,
  monoColor: string,
  bgColor: string,
  scale: number = 1,
  padding: number = 0,
  transparent: boolean = false
): HTMLCanvasElement {
  const lines = ascii.split("\n");
  const maxCols = Math.max(...lines.map((l) => l.length), 1);
  const { charW, charH } = getCharDimensions(fontSize, lineHeight, letterSpacing);
  const contentW = maxCols * charW;
  const contentH = lines.length * charH;
  const totalW = Math.ceil((contentW + padding * 2) * scale);
  const totalH = Math.ceil((contentH + padding * 2) * scale);

  const canvas = document.createElement("canvas");
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext("2d")!;

  if (!transparent) {
    ctx.fillStyle = bgColor || "#000";
    ctx.fillRect(0, 0, totalW, totalH);
  }

  ctx.scale(scale, scale);
  ctx.translate(padding, padding);

  const fontStr = `${fontSize}px monospace`;
  ctx.font = fontStr;

  for (let y = 0; y < lines.length; y++) {
    const line = lines[y];
    const cLine = colorGrid[y] ?? [];
    for (let x = 0; x < line.length; x++) {
      const ch = line[x];
      if (ch === " ") continue;

      if (colorMode !== "mono" && cLine[x]) {
        const parsed = parseRgb(cLine[x]);
        if (parsed) {
          ctx.fillStyle = resolveColor(colorMode, parsed.r, parsed.g, parsed.b, monoColor);
        } else {
          ctx.fillStyle = monoColor;
        }
      } else {
        ctx.fillStyle = monoColor;
      }
      ctx.fillText(ch, x * charW, (y + 1) * charH * 0.85);
    }
  }

  return canvas;
}
