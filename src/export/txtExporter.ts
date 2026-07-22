import type { ExportOptions, ExportResult } from "./exportTypes";

export function exportTxt(opts: ExportOptions): ExportResult {
  return {
    blob: new Blob([opts.asciiData], { type: "text/plain" }),
    filename: "ascii-art.txt",
    mimeType: "text/plain",
  };
}
