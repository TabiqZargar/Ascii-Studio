import type { ExportOptions } from "./exportTypes";
import { renderFrameToCanvas } from "./exportUtils";

export async function copyTextToClipboard(ascii: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(ascii);
    return true;
  } catch {
    return false;
  }
}

export async function copyPngToClipboard(opts: Omit<ExportOptions, "format">): Promise<boolean> {
  try {
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

    if (navigator.clipboard && "write" in navigator.clipboard) {
      const item = new ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([item]);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
