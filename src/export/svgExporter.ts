import type { ExportOptions, ExportResult } from "./exportTypes";
import { splitAsciiToGrid, parseRgb, resolveColor, escapeXml, getCanvasSize } from "./exportUtils";

export function exportSvg(opts: ExportOptions): ExportResult {
  const grid = splitAsciiToGrid(opts.asciiData);
  const { width, height, charW, charH } = getCanvasSize(
    grid,
    opts.fontSize,
    opts.lineHeight,
    opts.letterSpacing
  );

  const totalW = width + opts.padding * 2;
  const totalH = height + opts.padding * 2;
  const bgFill = opts.transparent ? "none" : (opts.background || "#000");

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">`);

  if (bgFill !== "none") {
    parts.push(`<rect width="${totalW}" height="${totalH}" fill="${bgFill}"/>`);
  }

  parts.push(`<style>text{font-family:"JetBrains Mono","Fira Code","Consolas",monospace;font-size:${opts.fontSize}px;white-space:pre}</style>`);
  parts.push(`<g transform="translate(${opts.padding},${opts.padding})">`);

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < (grid[y]?.length ?? 0); x++) {
      const ch = grid[y][x];
      if (ch === " ") continue;

      let fill = opts.monoColor;
      if (opts.colorMode !== "mono" && opts.colorGrid[y]?.[x]) {
        const parsed = parseRgb(opts.colorGrid[y][x]);
        if (parsed) {
          fill = resolveColor(opts.colorMode, parsed.r, parsed.g, parsed.b, opts.monoColor);
        }
      }

      const tx = x * charW;
      const ty = (y + 1) * charH;
      parts.push(`<text x="${tx}" y="${ty}" fill="${fill}">${escapeXml(ch)}</text>`);
    }
  }

  parts.push("</g></svg>");

  return {
    blob: new Blob([parts.join("")], { type: "image/svg+xml" }),
    filename: "ascii-art.svg",
    mimeType: "image/svg+xml",
  };
}
