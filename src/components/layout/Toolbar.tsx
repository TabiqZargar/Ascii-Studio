import { useState, useEffect, useCallback } from "react";

interface Props {
  ascii: string;
  disabled: boolean;
}

export default function Toolbar({ ascii, disabled }: Props) {
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
    window.addEventListener("glyphlab-copy", handler);
    return () => window.removeEventListener("glyphlab-copy", handler);
  }, [handleCopy]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopy}
        disabled={disabled}
        className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
