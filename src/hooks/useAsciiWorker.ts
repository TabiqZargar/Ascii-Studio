import { useRef, useCallback, useEffect } from "react";
import type { AppState } from "../types";
import { getActiveCharString } from "../context/appReducer";

export function useAsciiWorker() {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../workers/asciiWorker.ts", import.meta.url),
      { type: "module" }
    );
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const convert = useCallback(
    (
      state: AppState,
      onResult: (output: string, colorGrid: string[][]) => void
    ) => {
      if (!state.imageData || !workerRef.current) return;

      const chars = getActiveCharString(state);
      const worker = workerRef.current;

      const handler = (e: MessageEvent) => {
        onResult(e.data.output, e.data.colorGrid);
        worker.removeEventListener("message", handler);
      };
      worker.addEventListener("message", handler);

      worker.postMessage({
        imageData: state.imageData,
        chars,
        width: state.canvas.asciiWidth,
        height: state.canvas.asciiHeight,
        adjustments: state.adjustments,
      });
    },
    []
  );

  return { convert };
}
