import type { ExportOptions, ExportResult } from "./exportTypes";
import { renderFrameToCanvas } from "./exportUtils";

export async function exportPng(opts: ExportOptions): Promise<ExportResult> {
  const bgColor = opts.transparent ? "#000" : (opts.background || "#000");

  const canvas = renderFrameToCanvas(
    opts.asciiData,
    opts.colorGrid,
    opts.colorMode,
    opts.fontSize,
    opts.lineHeight,
    opts.letterSpacing,
    opts.monoColor,
    bgColor,
    opts.scale,
    opts.padding,
    opts.transparent
  );

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (b) => resolve(b ?? new Blob([], { type: "image/png" })),
      "image/png"
    );
  });

  return {
    blob,
    filename: `ascii-art-${opts.scale}x.png`,
    mimeType: "image/png",
  };
}
