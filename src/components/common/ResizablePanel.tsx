import { useState, useCallback, useRef, useEffect } from "react";

interface ResizablePanelProps {
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
  children: React.ReactNode;
}

export function ResizablePanel({ defaultWidth, minWidth = 200, maxWidth = 500, children }: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startX.current = e.clientX;
    startWidth.current = width;
  }, [width]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      const delta = e.clientX - startX.current;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth.current + delta));
      setWidth(newWidth);
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging, minWidth, maxWidth]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ascii_studio_sidebar_width");
      if (saved) setWidth(Math.max(minWidth, Math.min(maxWidth, parseInt(saved, 10))));
    } catch { /* ignore */ }
  }, [minWidth, maxWidth]);

  useEffect(() => {
    try { localStorage.setItem("ascii_studio_sidebar_width", String(width)); } catch { /* ignore */ }
  }, [width]);

  return (
    <div className="flex h-full" style={{ width }}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </div>
      <div
        className={`w-1 cursor-col-resize transition-colors ${isDragging ? "bg-emerald-500" : "bg-zinc-800/50 hover:bg-emerald-500/50"}`}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
