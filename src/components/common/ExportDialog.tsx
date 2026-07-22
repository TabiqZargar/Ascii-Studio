import { useState, useRef, useEffect, useCallback } from "react";
import type { ExportFormat, ExportOptions } from "../../export";
import { EXPORT_PRESETS, SCALE_OPTIONS, exportAscii, downloadBlob } from "../../export";

interface Props {
  open: boolean;
  onClose: () => void;
  asciiData: string;
  colorGrid: string[][];
  colorMode: string;
  monoColor: string;
  lineHeight: number;
  letterSpacing: number;
}

export default function ExportDialog({
  open,
  onClose,
  asciiData,
  colorGrid,
  colorMode,
  monoColor,
  lineHeight,
  letterSpacing,
}: Props) {
  const [format, setFormat] = useState<ExportFormat>("png");
  const [scale, setScale] = useState<1 | 2 | 4>(2);
  const [transparent, setTransparent] = useState(false);
  const [background, setBackground] = useState("#000000");
  const [fontSize, setFontSize] = useState(12);
  const [padding, setPadding] = useState(16);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const toastTimer = useRef<number | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !previewRef.current) return;
    const container = previewRef.current;
    container.innerHTML = "";

    const lines = asciiData.split("\n").slice(0, 20);

    const pre = document.createElement("pre");
    pre.style.fontFamily = "monospace";
    pre.style.fontSize = "5px";
    pre.style.lineHeight = String(lineHeight);
    pre.style.letterSpacing = letterSpacing + "px";
    pre.style.whiteSpace = "pre";
    pre.style.color = monoColor;
    pre.style.margin = "0";
    pre.style.overflow = "hidden";

    if (!transparent) {
      container.style.background = background;
    } else {
      container.style.background = "repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50%/8px 8px";
    }

    for (let y = 0; y < lines.length; y++) {
      const line = lines[y];
      const cLine = colorGrid[y] ?? [];
      for (let x = 0; x < line.length; x++) {
        const ch = line[x];
        if (ch === " ") {
          pre.appendChild(document.createTextNode(" "));
          continue;
        }
        const span = document.createElement("span");
        span.textContent = ch;
        if (colorMode !== "mono" && cLine[x]) {
          span.style.color = cLine[x];
        } else {
          span.style.color = monoColor;
        }
        pre.appendChild(span);
      }
      if (y < lines.length - 1) pre.appendChild(document.createTextNode("\n"));
    }

    container.appendChild(pre);
  }, [open, asciiData, colorGrid, colorMode, monoColor, lineHeight, letterSpacing, transparent, background]);

  const buildOpts = useCallback((): ExportOptions => ({
    format,
    scale,
    transparent,
    fontSize,
    padding,
    background,
    foreground: monoColor,
    asciiData,
    colorGrid,
    colorMode,
    monoColor,
    lineHeight,
    letterSpacing,
  }), [format, scale, transparent, fontSize, padding, background, monoColor, asciiData, colorGrid, colorMode, lineHeight, letterSpacing]);

  const handleExport = useCallback(async () => {
    setLoading(true);
    try {
      const result = await exportAscii(buildOpts());
      if (result.blob && result.filename) {
        downloadBlob(result.blob, result.filename);
        showToast("Exported " + result.filename);
      } else if (format === "clipboard-text") {
        showToast("Copied text to clipboard");
      } else if (format === "clipboard-png") {
        showToast("Copied image to clipboard");
      }
      onClose();
    } catch (err) {
      showToast("Export failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [buildOpts, format, onClose, showToast]);

  if (!open) return null;

  const showScale = format === "png" || format === "clipboard-png";
  const showFontSize = format !== "clipboard-text";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl rounded-2xl bg-surface/95 backdrop-blur-xl border border-outline-variant/20 shadow-[0_30px_80px_rgba(0,0,0,0.7)] overflow-hidden animate-fadeIn">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div>
            <h2 className="text-base font-semibold text-on-surface">Export</h2>
            <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mt-0.5">Configure &amp; Download</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="flex gap-0 h-[440px]">
          <div className="w-[55%] px-6 py-4 space-y-5 overflow-y-auto">
            <FormatSelector format={format} onChange={setFormat} />
            {showScale && <ScaleSelector scale={scale} onChange={setScale} />}
            {showFontSize && <FontSizeSlider fontSize={fontSize} onChange={setFontSize} />}
            <BackgroundControls
              transparent={transparent}
              background={background}
              onTransparentChange={setTransparent}
              onBackgroundChange={setBackground}
            />
            <PaddingSlider padding={padding} onChange={setPadding} />
          </div>

          <div className="w-[45%] flex flex-col border-l border-outline-variant/10">
            <div className="px-4 pt-3 pb-2">
              <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">Preview</label>
            </div>
            <div className="flex-1 mx-4 mb-3 rounded-lg overflow-hidden bg-surface-container border border-outline-variant/10 p-2">
              <div ref={previewRef} className="w-full h-full rounded overflow-hidden" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/10 bg-surface-container-low/30">
          <span className="text-[11px] text-on-surface-variant">
            {asciiData.split("\n").length} lines &middot; {asciiData.replace(/\n/g, "").length.toLocaleString()} chars
          </span>
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-on-primary hover:bg-primary-container transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" />
                Exporting...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">download</span>
                Download
              </>
            )}
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] rounded-lg bg-surface-container-high px-4 py-2.5 text-sm text-on-surface shadow-xl border border-outline-variant/20 animate-fadeIn">
          {toast}
        </div>
      )}
    </div>
  );
}

function FormatSelector({ format, onChange }: { format: ExportFormat; onChange: (f: ExportFormat) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">Format</label>
      <div className="grid grid-cols-3 gap-1.5">
        {EXPORT_PRESETS.map((p) => (
          <button
            key={p.format}
            onClick={() => onChange(p.format)}
            className={`flex flex-col items-center rounded-lg px-2 py-2.5 transition-all text-center ${
              format === p.format
                ? "bg-primary/15 border border-primary/40 text-primary"
                : "bg-surface-container border border-outline-variant/10 text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-lg mb-0.5">{p.icon}</span>
            <span className="text-[10px] font-medium">{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ScaleSelector({ scale, onChange }: { scale: 1 | 2 | 4; onChange: (s: 1 | 2 | 4) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">Resolution</label>
      <div className="flex gap-1.5">
        {SCALE_OPTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => onChange(s.value)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
              scale === s.value
                ? "bg-primary/15 border border-primary/40 text-primary"
                : "bg-surface-container border border-outline-variant/10 text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <div>{s.label}</div>
            <div className="text-[9px] opacity-60">{s.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function FontSizeSlider({ fontSize, onChange }: { fontSize: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[11px] text-on-surface-variant font-medium">
        <span className="uppercase tracking-wider">Font Size</span>
        <span>{fontSize}px</span>
      </div>
      <input
        type="range"
        min={6}
        max={32}
        step={1}
        value={fontSize}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

function BackgroundControls({
  transparent,
  background,
  onTransparentChange,
  onBackgroundChange,
}: {
  transparent: boolean;
  background: string;
  onTransparentChange: (v: boolean) => void;
  onBackgroundChange: (c: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">Background</label>
      <div className="flex items-center justify-between">
        <span className="text-xs text-on-surface-variant">Transparent</span>
        <button
          onClick={() => onTransparentChange(!transparent)}
          className={`relative h-5 w-9 rounded-full transition-colors ${
            transparent ? "bg-primary" : "bg-surface-container-highest"
          }`}
        >
          <div
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-on-surface transition-transform ${
              transparent ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
      {!transparent && (
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={background}
            onChange={(e) => onBackgroundChange(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border border-outline-variant/20 bg-transparent"
          />
          <span className="text-xs font-mono text-on-surface-variant">{background}</span>
        </div>
      )}
    </div>
  );
}

function PaddingSlider({ padding, onChange }: { padding: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[11px] text-on-surface-variant font-medium">
        <span className="uppercase tracking-wider">Padding</span>
        <span>{padding}px</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={4}
        value={padding}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
