import type { ExportOptions, ExportResult } from "./exportTypes";
import { splitAsciiToGrid, parseRgb, resolveColor, escapeHtml } from "./exportUtils";

export function exportHtml(opts: ExportOptions): ExportResult {
  const grid = splitAsciiToGrid(opts.asciiData);
  const bgFill = opts.transparent ? "transparent" : (opts.background || "#000");

  const lines = grid.map((row, y) =>
    row
      .map((ch, x) => {
        if (ch === " ") return " ";
        if (opts.colorMode !== "mono" && opts.colorGrid[y]?.[x]) {
          const parsed = parseRgb(opts.colorGrid[y][x]);
          if (parsed) {
            const color = resolveColor(opts.colorMode, parsed.r, parsed.g, parsed.b, opts.monoColor);
            return `<span style="color:${color}">${escapeHtml(ch)}</span>`;
          }
        }
        return `<span style="color:${opts.monoColor}">${escapeHtml(ch)}</span>`;
      })
      .join("")
  );

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ASCII Art - ASCII Studio</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 100vh;
    padding: ${opts.padding}px;
    background: ${bgFill};
  }
  pre {
    font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", monospace;
    font-size: ${opts.fontSize}px;
    line-height: ${opts.lineHeight};
    letter-spacing: ${opts.letterSpacing}px;
    white-space: pre;
    -webkit-font-smoothing: antialiased;
  }
</style>
</head>
<body>
<pre>${lines.join("\n")}</pre>
</body>
</html>`;

  return {
    blob: new Blob([html], { type: "text/html" }),
    filename: "ascii-art.html",
    mimeType: "text/html",
  };
}
