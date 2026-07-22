import { useApp } from "../../context/AppContext";
import { useRef, useState, useCallback, useEffect } from "react";
import { getThemeColor } from "../../utils/colorThemes";

interface Props {
  asciiOutput: string;
  colorGrid: string[][];
}

export default function ComparisonSlider({ asciiOutput, colorGrid }: Props) {
  const state = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pos1, setPos1] = useState(33);
  const [pos2, setPos2] = useState(66);
  const [dragTarget, setDragTarget] = useState<1 | 2>(1);

  const handleMouseDown = useCallback((target: 1 | 2) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    setDragTarget(target);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(2, Math.min(98, pct));
      if (dragTarget === 1) setPos1(Math.min(clamped, pos2 - 2));
      else setPos2(Math.max(clamped, pos1 + 2));
    },
    [dragging, dragTarget, pos1, pos2]
  );

  const handleMouseUp = useCallback(() => setDragging(false), []);

  useEffect(() => {
    if (dragging) {
      const handler = () => setDragging(false);
      window.addEventListener("mouseup", handler);
      return () => window.removeEventListener("mouseup", handler);
    }
  }, [dragging]);

  if (!state.imageUrl) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden select-none touch-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={(e) => {
        if (!dragging || !containerRef.current) return;
        const touch = e.touches[0];
        const rect = containerRef.current.getBoundingClientRect();
        const pct = ((touch.clientX - rect.left) / rect.width) * 100;
        const clamped = Math.max(2, Math.min(98, pct));
        if (dragTarget === 1) setPos1(Math.min(clamped, pos2 - 2));
        else setPos2(Math.max(clamped, pos1 + 2));
      }}
      onTouchEnd={() => setDragging(false)}
    >
      <div className="absolute inset-0 overflow-hidden">
        <img src={state.imageUrl} alt="Original" className="h-full w-full object-contain" draggable={false} />
      </div>

      <div
        className="absolute inset-0 overflow-hidden bg-zinc-900"
        style={{ clipPath: `inset(0 0 0 ${pos1}%)` }}
      >
        <div className="flex h-full items-center justify-center p-4">
          <img src={state.imageUrl} alt="Processed" className="h-full w-full object-contain" draggable={false} style={{ filter: `brightness(${1 + state.adjustments.brightness / 100}) contrast(${state.adjustments.contrast}) saturate(${state.adjustments.saturation}) ${state.adjustments.grayscale ? "grayscale(1)" : ""} ${state.adjustments.invert ? "invert(1)" : ""}` }} />
        </div>
      </div>

      <div
        className="absolute inset-0 overflow-hidden bg-black"
        style={{ clipPath: `inset(0 0 0 ${pos2}%)` }}
      >
        <div className="flex h-full items-center justify-center p-4">
          <pre
            className="whitespace-pre font-mono text-[5px] leading-[5px] text-zinc-300"
            style={{ fontFamily: state.canvas.fontFamily }}
          >
            {asciiOutput.split("\n").map((line, y) => {
              const cLine = colorGrid[y] ?? [];
              return (
                <div key={y}>
                  {line.split("").map((ch, x) => {
                    let color = state.monoColor;
                    if (state.colorMode === "original") {
                      color = cLine[x] ?? state.monoColor;
                    } else if (state.colorMode !== "mono") {
                      const rgbStr = cLine[x];
                      let lum = 128;
                      if (rgbStr) {
                        const match = rgbStr.match(/rgb\((\d+),(\d+),(\d+)\)/);
                        if (match) lum = Math.round(0.299 * +match[1] + 0.587 * +match[2] + 0.114 * +match[3]);
                      }
                      color = getThemeColor(state.colorMode, lum, cLine[x]);
                    }
                    return <span key={x} style={{ color }}>{ch}</span>;
                  })}
                </div>
              );
            })}
          </pre>
        </div>
      </div>

      <div
        className="absolute top-0 bottom-0 z-10 w-1 cursor-ew-resize bg-emerald-500 touch-none"
        style={{ left: `${pos1}%` }}
        onMouseDown={handleMouseDown(1)}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(true);
          setDragTarget(1);
        }}
      >
        <div className="absolute -left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">1</div>
      </div>

      <div
        className="absolute top-0 bottom-0 z-10 w-1 cursor-ew-resize bg-emerald-400 touch-none"
        style={{ left: `${pos2}%` }}
        onMouseDown={handleMouseDown(2)}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(true);
          setDragTarget(2);
        }}
      >
        <div className="absolute -left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-400 text-[10px] text-white">2</div>
      </div>

      <div className="absolute left-3 top-3 z-20 rounded-md bg-zinc-900/80 px-2 py-1 text-xs text-zinc-400 backdrop-blur-sm">Original</div>
      <div className="absolute top-3 z-20 rounded-md bg-zinc-900/80 px-2 py-1 text-xs text-zinc-400 backdrop-blur-sm" style={{ left: `${(pos1 + pos2) / 2}%`, transform: "translateX(-50%)" }}>Processed</div>
      <div className="absolute right-3 top-3 z-20 rounded-md bg-zinc-900/80 px-2 py-1 text-xs text-zinc-400 backdrop-blur-sm">ASCII</div>
    </div>
  );
}
