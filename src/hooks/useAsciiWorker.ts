import { useRef, useCallback, useEffect } from "react";
import type { AppState } from "../types";
import { getActiveCharString } from "../context/appReducer";

export interface ConvertParams {
  charset: string;
  asciiWidth: number;
  adjustments: { brightness: number; contrast: number; gamma: number; invert: boolean };
}

type PendingRequest =
  | { type: "single"; onResult: (output: string, colorGrid: string[][]) => void }
  | { type: "frame"; frameIndex?: number; onResult: (output: string, colorGrid: string[][]) => void }
  | {
      type: "batch";
      onProgress: (current: number, total: number) => void;
      onDone: (results: { output: string; colorGrid: string[][] }[]) => void;
    }
  | null;

export function useAsciiWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<PendingRequest>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/asciiWorker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      const pending = pendingRef.current;
      if (!pending) return;

      if (pending.type === "single" || pending.type === "frame") {
        console.log("[ONMESSAGE]", { type: pending.type, frameIndex: pending.type === "frame" ? pending.frameIndex : undefined });
        if (e.data.output !== undefined) {
          console.log("[PROMISE RESOLVE]", { type: pending.type, frameIndex: pending.type === "frame" ? pending.frameIndex : undefined });
          pending.onResult(e.data.output, e.data.colorGrid);
          pendingRef.current = null;
        } else {
          console.log("[PROMISE REJECT]", { type: pending.type, reason: "output undefined" });
        }
      } else if (pending.type === "batch") {
        if (e.data.type === "progress") {
          pending.onProgress(e.data.current, e.data.total);
        } else if (e.data.type === "batch-done") {
          console.log("[ONMESSAGE]", { type: "batch" });
          pending.onDone(e.data.results);
          pendingRef.current = null;
        }
      }
    };

    worker.onerror = (err) => {
      console.log("[WORKER ERROR]", err);
    };

    worker.onmessageerror = (err) => {
      console.log("[MESSAGE ERROR]", err);
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
      pendingRef.current = null;
    };
  }, []);

  const convert = useCallback(
    (
      state: AppState,
      onResult: (output: string, colorGrid: string[][]) => void
    ) => {
      if (!state.imageData || !workerRef.current) return;
      if (state.animation.rawFrames.length > 0) return;

      const chars = getActiveCharString(state);
      pendingRef.current = { type: "single", onResult };

      workerRef.current.postMessage({
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
      frameIndex: number,
      onResult: (output: string, colorGrid: string[][]) => void
    ) => {
      console.log("[CONVERT ENTER]", { frameIndex });
      if (!workerRef.current) { console.log("[CONVERT RETURN] no worker"); return; }
      pendingRef.current = { type: "frame", frameIndex, onResult };

      console.log("[POST MESSAGE]", { frameIndex });
      workerRef.current.postMessage({
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

      pendingRef.current = { type: "batch", onProgress, onDone };

      workerRef.current.postMessage({
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
