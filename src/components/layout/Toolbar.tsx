import { useState, useEffect, useCallback } from "react";
import { useApp } from "../../context/AppContext";

interface Props {
  ascii: string;
  disabled: boolean;
}

export default function Toolbar({ ascii, disabled }: Props) {
  const state = useApp();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    if (!ascii) return;
    await navigator.clipboard.writeText(ascii);
    setCopied(true);
  }, [ascii]);

  useEffect(() => {
    const handler = () => handleCopy();
    window.addEventListener("ascii-studio-copy", handler);
    return () => window.removeEventListener("ascii-studio-copy", handler);
  }, [handleCopy]);

  const charCount = ascii.replace(/\n/g, "").length;
  const lineCount = ascii ? ascii.split("\n").length : 0;

  return (
    <div className="flex items-center gap-2 text-[11px]">
      <button
        onClick={handleCopy}
        disabled={disabled}
        className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {copied ? "Copied!" : "Copy"}
      </button>

      {state.asciiOutput && (
        <div className="flex items-center gap-3 text-zinc-500">
          <span>
            {state.canvas.asciiWidth}x{Math.round(state.canvas.asciiWidth * 0.5)}
          </span>
          <span>{lineCount} lines</span>
          <span>{charCount.toLocaleString()} chars</span>
          {state.conversionTime > 0 && <span>{state.conversionTime}ms</span>}
          <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-zinc-500">
            {state.charPresetId === "custom" ? "Custom" : state.charPresetId}
          </span>
        </div>
      )}
    </div>
  );
}
