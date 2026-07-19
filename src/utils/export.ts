export function exportTxt(ascii: string): Blob {
  return new Blob([ascii], { type: "text/plain" });
}

export function exportPng(
  ascii: string,
  colorGrid: string[][],
  colorMode: string,
  fontSize: number,
  lineHeight: number,
  letterSpacing: number,
  monoColor: string,
  bgColor: string
): Promise<Blob> {
  const lines = ascii.split("\n");
  const maxCols = Math.max(...lines.map((l) => l.length), 1);
  const charW = fontSize * 0.6 + letterSpacing;
  const charH = fontSize * lineHeight;
  const w = Math.max(1, maxCols * charW);
  const h = Math.max(1, lines.length * charH);

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(w);
  canvas.height = Math.ceil(h);
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = bgColor === "transparent" ? "#000" : bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${fontSize}px monospace`;

  for (let y = 0; y < lines.length; y++) {
    const line = lines[y];
    const cLine = colorGrid[y] ?? [];
    for (let x = 0; x < line.length; x++) {
      const ch = line[x];
      if (ch === " ") continue;
      if ((colorMode === "gradient" || colorMode === "original") && cLine[x]) {
        ctx.fillStyle = cLine[x];
      } else {
        ctx.fillStyle = monoColor;
      }
      ctx.fillText(ch, x * charW, (y + 1) * charH * 0.85);
    }
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? new Blob()), "image/png");
  });
}

export function exportSvg(
  grid: string[][],
  colorGrid: string[][],
  colorMode: string,
  fontSize: number,
  lineHeight: number,
  letterSpacing: number,
  monoColor: string,
  _gradientColors: string[],
  bgColor: string
): Blob {
  const charW = fontSize * 0.6 + letterSpacing;
  const charH = fontSize * lineHeight;
  const w = (grid[0]?.length ?? 0) * charW;
  const h = grid.length * charH;

  let bgFill = bgColor;
  if (bgColor === "transparent") bgFill = "none";

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
  svgContent += `<rect width="${w}" height="${h}" fill="${bgFill}"/>`;
  svgContent += `<style>text{font-family:monospace;font-size:${fontSize}px;white-space:pre}</style>`;

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < (grid[y]?.length ?? 0); x++) {
      const ch = grid[y][x];
      if (ch === " ") continue;
      let fill = monoColor;
      if ((colorMode === "gradient" || colorMode === "original") && colorGrid[y]?.[x]) {
        fill = colorGrid[y][x];
      }
      svgContent += `<text x="${x * charW}" y="${(y + 1) * charH}" fill="${fill}">${escapeXml(ch)}</text>`;
    }
  }

  svgContent += "</svg>";
  return new Blob([svgContent], { type: "image/svg+xml" });
}

export function exportHtml(
  grid: string[][],
  colorGrid: string[][],
  colorMode: string,
  fontSize: number,
  lineHeight: number,
  letterSpacing: number,
  monoColor: string,
  bgColor: string
): Blob {
  let bgFill = bgColor;
  if (bgColor === "transparent") bgFill = "#000";

  const lines = grid.map((row, y) =>
    row
      .map((ch, x) => {
        if (ch === " ") return " ";
        if ((colorMode === "gradient" || colorMode === "original") && colorGrid[y]?.[x]) {
          return `<span style="color:${colorGrid[y][x]}">${escapeHtml(ch)}</span>`;
        }
        return `<span style="color:${monoColor}">${escapeHtml(ch)}</span>`;
      })
      .join("")
  );

  const html = `<!DOCTYPE html>
<html>
<head>
<title>ASCII Studio - ASCII Art</title>
<style>
  body { margin:0; padding:20px; background:${bgFill}; }
  pre {
    font-family:monospace;
    font-size:${fontSize}px;
    line-height:${lineHeight};
    letter-spacing:${letterSpacing}px;
    white-space:pre;
  }
</style>
</head>
<body><pre>${lines.join("\n")}</pre></body>
</html>`;

  return new Blob([html], { type: "text/html" });
}

export function exportProjectJson(state: Record<string, unknown>): Blob {
  const project = {
    version: "1.0",
    app: "ascii-studio",
    name: "ascii-studio-project",
    charPresetId: state.charPresetId,
    customChars: state.customChars,
    colorMode: state.colorMode,
    gradientId: state.gradientId,
    monoColor: state.monoColor,
    canvas: state.canvas,
    adjustments: state.adjustments,
    background: state.background,
    transform: state.transform,
    layers: state.layers,
    editorGrid: state.editorGrid,
  };
  return new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
