import { useRef, useState, useCallback, useEffect, forwardRef } from "react";
import { useApp, useDispatch } from "../../context/AppContext";
import type { EditorCell } from "../../types";
import { getThemeColor } from "../../utils/colorThemes";

interface Props {
  asciiOutput: string;
  colorGrid: string[][];
}

function computeShapeCells(
  brushType: string,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  brush: string
): EditorCell[] {
  const cells: EditorCell[] = [];
  const minR = Math.min(startRow, endRow);
  const maxR = Math.max(startRow, endRow);
  const minC = Math.min(startCol, endCol);
  const maxC = Math.max(startCol, endCol);

  switch (brushType) {
    case "rectangle":
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          if (r === minR || r === maxR || c === minC || c === maxC) {
            cells.push({ row: r, col: c, char: brush });
          }
        }
      }
      break;
    case "circle": {
      const cx = (startCol + endCol) / 2;
      const cy = (startRow + endRow) / 2;
      const rx = Math.abs(endCol - startCol) / 2;
      const ry = Math.abs(endRow - startRow) / 2;
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          const dx = (c - cx) / (rx || 1);
          const dy = (r - cy) / (ry || 1);
          if (Math.abs(dx * dx + dy * dy - 1) < 0.3) {
            cells.push({ row: r, col: c, char: brush });
          }
        }
      }
      break;
    }
    case "line": {
      const steps = Math.max(Math.abs(endCol - startCol), Math.abs(endRow - startRow), 1);
      for (let i = 0; i <= steps; i++) {
        const t = steps === 0 ? 0 : i / steps;
        const r = Math.round(startRow + (endRow - startRow) * t);
        const c = Math.round(startCol + (endCol - startCol) * t);
        cells.push({ row: r, col: c, char: brush });
      }
      break;
    }
    case "fill":
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          cells.push({ row: r, col: c, char: brush });
        }
      }
      break;
  }
  return cells;
}

const AsciiCanvas = forwardRef<HTMLDivElement, Props>(function AsciiCanvas({ asciiOutput, colorGrid }, ref) {
  const state = useApp();
  const dispatch = useDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  const fittedRef = useRef(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [shapeStart, setShapeStart] = useState<{ row: number; col: number } | null>(null);

  const setRefs = useCallback((el: HTMLDivElement | null) => {
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
  }, [ref]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        dispatch({ type: "SET_ZOOM", zoom: state.zoom + (e.deltaY > 0 ? -0.1 : 0.1) });
      }
    },
    [state.zoom, dispatch]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || e.altKey) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - state.panX, y: e.clientY - state.panY });
        e.preventDefault();
      }
    },
    [state.panX, state.panY]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        dispatch({ type: "SET_PAN", x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      }
    },
    [isPanning, panStart, dispatch]
  );

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  useEffect(() => {
    fittedRef.current = false;
  }, [state.imageUrl]);

  useEffect(() => {
    if (state.imageUrl && containerRef.current && asciiOutput && !fittedRef.current) {
      fittedRef.current = true;
      const rect = containerRef.current.getBoundingClientRect();
      const lines = asciiOutput.split("\n").length;
      const maxCols = Math.max(...asciiOutput.split("\n").map((l) => l.length), 1);
      if (lines > 0 && maxCols > 0) {
        const scaleX = rect.width / (maxCols * (state.canvas.fontSize * 0.6));
        const scaleY = rect.height / (lines * state.canvas.fontSize * state.canvas.lineHeight);
        dispatch({ type: "SET_ZOOM", zoom: Math.max(0.5, Math.min(Math.min(scaleX, scaleY, 3), 3)) });
        dispatch({ type: "SET_PAN", x: 0, y: 0 });
      }
    }
  });

  const asciiLayer = state.layers.find((l) => l.type === "ascii");
  const showAscii = asciiLayer?.visible ?? true;
  const lines = asciiOutput ? asciiOutput.split("\n") : [];
  const { fontSize, lineHeight, letterSpacing, fontFamily } = state.canvas;

  let renderHash = 0x811c9dc5;
  for (let i = 0; i < asciiOutput.length; i++) { renderHash ^= asciiOutput.charCodeAt(i); renderHash = Math.imul(renderHash, 0x01000193); }
  console.log("[RENDER CHK] Stage 14 asciiOutput hash=0x" + (renderHash >>> 0).toString(16).padStart(8, "0") + " len=" + asciiOutput.length);

  const handleCharMouseDown = useCallback((row: number, col: number, e: React.MouseEvent) => {
    if (state.activeLayerId !== "ascii-layer" || asciiLayer?.locked) return;
    e.stopPropagation();
    const paintChar = state.brushType === "eraser" ? " " : state.brushChar;

    if (state.brushType === "brush" || state.brushType === "eraser" || state.brushType === "text") {
      dispatch({ type: "PUSH_UNDO", grid: state.editorGrid.map((r) => [...r]) });
      const cells: EditorCell[] = [];
      if (state.brushType === "text") {
        cells.push({ row, col, char: paintChar });
      } else {
        for (let dy = 0; dy < state.brushSize; dy++) {
          for (let dx = 0; dx < state.brushSize; dx++) {
            cells.push({ row: row + dy, col: col + dx, char: paintChar });
          }
        }
      }
      dispatch({ type: "PAINT_CELLS", cells });
    } else if (["rectangle", "circle", "line", "fill"].includes(state.brushType)) {
      dispatch({ type: "PUSH_UNDO", grid: state.editorGrid.map((r) => [...r]) });
      setShapeStart({ row, col });
    }
  }, [state.activeLayerId, asciiLayer?.locked, state.brushType, state.brushChar, state.brushSize, state.editorGrid, dispatch]);

  const handleCharMouseEnter = useCallback((row: number, col: number, e: React.MouseEvent) => {
    if (e.buttons === 0 || state.activeLayerId !== "ascii-layer" || asciiLayer?.locked) return;
    const paintChar = state.brushType === "eraser" ? " " : state.brushChar;
    if (state.brushType === "brush" || state.brushType === "eraser") {
      const cells: EditorCell[] = [];
      for (let dy = 0; dy < state.brushSize; dy++) {
        for (let dx = 0; dx < state.brushSize; dx++) {
          cells.push({ row: row + dy, col: col + dx, char: paintChar });
        }
      }
      dispatch({ type: "PAINT_CELLS", cells });
    }
  }, [state.activeLayerId, asciiLayer?.locked, state.brushType, state.brushChar, state.brushSize, dispatch]);

  const handleCharMouseUp = useCallback((row: number, col: number) => {
    if (!shapeStart || !["rectangle", "circle", "line", "fill"].includes(state.brushType)) return;
    const paintChar = state.brushType === "eraser" ? " " : state.brushChar;
    const cells = computeShapeCells(state.brushType, shapeStart.row, shapeStart.col, row, col, paintChar);
    if (cells.length > 0) dispatch({ type: "FILL_CELLS", cells });
    setShapeStart(null);
  }, [shapeStart, state.brushType, state.brushChar, dispatch]);

  return (
    <div
      ref={setRefs}
      className="absolute inset-0 overflow-hidden checkerboard"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`,
          transformOrigin: "center center",
          cursor: isPanning ? "grabbing" : "default",
        }}
      >
        {asciiOutput ? (
          <pre className="whitespace-pre font-mono text-zinc-300" style={{ fontSize: `${fontSize}px`, lineHeight, letterSpacing: `${letterSpacing}px`, fontFamily }}>
            {showAscii ? lines.map((line, y) => {
              const cLine = colorGrid[y] ?? [];
              return (
                <div key={y} style={state.colorMode === "mono" ? { color: state.monoColor } : undefined}>
                  {line.split("").map((ch, x) => {
                    const edited = state.editorGrid[y]?.[x]?.char;
                    const display = edited ?? ch;
                    let color: string | undefined;
                    if (state.colorMode === "mono") {
                      color = state.monoColor;
                    } else if (state.colorMode === "original") {
                      color = cLine[x] ?? state.monoColor;
                    } else {
                      const rgbStr = cLine[x];
                      let lum = 128;
                      if (rgbStr) {
                        const match = rgbStr.match(/rgb\((\d+),(\d+),(\d+)\)/);
                        if (match) lum = Math.round(0.299 * +match[1] + 0.587 * +match[2] + 0.114 * +match[3]);
                      }
                      color = getThemeColor(state.colorMode, lum, cLine[x]);
                    }
                    return (
                      <span
                        key={x}
                        style={color ? { color } : undefined}
                        className={state.activeLayerId === "ascii-layer" && !asciiLayer?.locked ? "cursor-crosshair hover:bg-emerald-500/30" : ""}
                        onMouseDown={(e) => handleCharMouseDown(y, x, e)}
                        onMouseEnter={(e) => handleCharMouseEnter(y, x, e)}
                        onMouseUp={() => handleCharMouseUp(y, x)}
                      >
                        {display}
                      </span>
                    );
                  })}
                </div>
              );
            }) : (
              <div className="text-sm text-zinc-600">ASCII layer hidden</div>
            )}
          </pre>
        ) : (
          <div className="text-sm text-zinc-600">
            {state.loading ? "Processing..." : "Upload an image to begin"}
          </div>
        )}
      </div>
    </div>
  );
});

export default AsciiCanvas;
