interface AsciiPreviewProps {
  ascii: string;
  loading: boolean;
}

export default function AsciiPreview({ ascii, loading }: AsciiPreviewProps) {
  return (
    <div className="flex min-h-[300px] flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-400">ASCII Output</h2>
        {loading && (
          <span className="text-xs text-zinc-600">Converting...</span>
        )}
      </div>
      <div className="flex-1 overflow-auto rounded-lg bg-zinc-950 p-4">
        {ascii ? (
          <pre className="whitespace-pre font-mono text-[6px] leading-[6px] text-zinc-300">
            {ascii}
          </pre>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-600">
            {loading ? "Processing image..." : "Upload an image to generate ASCII art"}
          </div>
        )}
      </div>
    </div>
  );
}
