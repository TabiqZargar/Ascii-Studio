import { useState, useEffect } from "react";

interface ToolbarProps {
  ascii: string;
  disabled: boolean;
}

export default function Toolbar({ ascii, disabled }: ToolbarProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    if (!ascii) return;
    await navigator.clipboard.writeText(ascii);
    setCopied(true);
  };

  const handleDownload = () => {
    if (!ascii) return;
    const blob = new Blob([ascii], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ascii-art.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleCopy}
        disabled={disabled}
        className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {copied ? "Copied!" : "Copy ASCII"}
      </button>
      <button
        onClick={handleDownload}
        disabled={disabled}
        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Download TXT
      </button>
    </div>
  );
}
