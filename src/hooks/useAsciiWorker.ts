import { useRef, useCallback, useEffect } from "react";
import type { AppState } from "../types";
import { getActiveCharString } from "../context/appReducer";

export interface ConvertParams {
  charset: string;
  asciiWidth: number;
  adjustments: { brightness: number; contrast: number; gamma: number; invert: boolean };
}

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
        if (e.data.output !== undefined) {
          onResult(e.data.output, e.data.colorGrid);
          worker.removeEventListener("message", handler);
        }
      };
      worker.addEventListener("message", handler);

      worker.postMessage({
        imageData: state.imageData,
        charset: chars,
        width: state.canvas.asciiWidth,
        adjustments: {
          brightness: state.adjustments.brightness,
          contrast: state.adjustments.contrast,
          gamma: state.adjustments.gamma,
          invert: state.adjustments.invert,
        },
      });
    },
    []
  );

  const convertFrame = useCallback(
    (
      imageData: ImageData,
      params: ConvertParams,
      onResult: (output: string, colorGrid: string[][]) => void
    ) => {
      if (!workerRef.current) return;
      const worker = workerRef.current;

      const handler = (e: MessageEvent) => {
        if (e.data.output !== undefined) {
          onResult(e.data.output, e.data.colorGrid);
          worker.removeEventListener("message", handler);
        }
      };
      worker.addEventListener("message", handler);

      worker.postMessage({
        imageData,
        charset: params.charset,
        width: params.asciiWidth,
        adjustments: params.adjustments,
      });
    },
    []
  );

  const convertBatch = useCallback(
    (
      frames: ImageData[],
      charset: string,
      asciiWidth: number,
      adjustments: { brightness: number; contrast: number; gamma: number; invert: boolean },
      onProgress: (current: number, total: number) => void,
      onDone: (results: { output: string; colorGrid: string[][] }[]) => void
    ) => {
      if (!workerRef.current || frames.length === 0) return;

      const worker = workerRef.current;

      const handler = (e: MessageEvent) => {
        if (e.data.type === "progress") {
          onProgress(e.data.current, e.data.total);
        } else if (e.data.type === "batch-done") {
          onDone(e.data.results);
          worker.removeEventListener("message", handler);
        }
      };
      worker.addEventListener("message", handler);

      worker.postMessage({
        type: "batch",
        frames,
        charset,
        width: asciiWidth,
        adjustments,
      });
    },
    []
  );

  return { convert, convertFrame, convertBatch };
}
