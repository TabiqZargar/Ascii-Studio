import type { ExportFormat, ExportOptions, ExportResult } from "./exportTypes";
import { exportPng } from "./pngExporter";
import { exportTxt } from "./txtExporter";
import { exportHtml } from "./htmlExporter";
import { exportSvg } from "./svgExporter";
import { copyTextToClipboard, copyPngToClipboard } from "./clipboard";

export type { ExportFormat, ExportOptions, ExportResult, ExportPreset } from "./exportTypes";

export const EXPORT_PRESETS: { format: ExportFormat; label: string; icon: string; description: string }[] = [
  { format: "png", label: "PNG", icon: "image", description: "High-res raster image" },
  { format: "txt", label: "TXT", icon: "description", description: "Plain ASCII text" },
  { format: "html", label: "HTML", icon: "code", description: "Self-contained web page" },
  { format: "svg", label: "SVG", icon: "draw", description: "Scalable vector graphic" },
  { format: "clipboard-text", label: "Copy Text", icon: "content_copy", description: "Copy to clipboard" },
  { format: "clipboard-png", label: "Copy Image", icon: "content_paste", description: "Copy PNG to clipboard" },
];

export const SCALE_OPTIONS = [
  { value: 1, label: "1x", description: "Standard" },
  { value: 2, label: "2x", description: "Double" },
  { value: 4, label: "4x", description: "Quad" },
] as const;

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportAscii(opts: ExportOptions): Promise<ExportResult> {
  if (!opts.asciiData || opts.asciiData.trim().length === 0) {
    throw new Error("No ASCII data to export");
  }

  switch (opts.format) {
    case "png":
      return exportPng(opts);

    case "txt":
      return exportTxt(opts);

    case "html":
      return exportHtml(opts);

    case "svg":
      return exportSvg(opts);

    case "clipboard-text": {
      const ok = await copyTextToClipboard(opts.asciiData);
      return {
        filename: "",
        mimeType: "text/plain",
        ...(ok ? {} : { blob: new Blob([opts.asciiData], { type: "text/plain" }) }),
      };
    }

    case "clipboard-png": {
      const ok = await copyPngToClipboard(opts);
      return {
        filename: "",
        mimeType: "image/png",
        ...(ok ? {} : {}),
      };
    }

    default:
      throw new Error(`Unknown export format: ${opts.format}`);
  }
}
