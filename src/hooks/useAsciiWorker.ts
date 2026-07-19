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

      const options = {
        charset: chars,
        asciiWidth: state.canvas.asciiWidth,
        asciiHeight: state.canvas.asciiHeight,
        brightness: state.adjustments.brightness,
        contrast: state.adjustments.contrast,
        saturation: state.adjustments.saturation,
        exposure: state.adjustments.exposure,
        gamma: state.adjustments.gamma,
        sharpness: state.adjustments.sharpness,
        blur: state.adjustments.blur,
        invert: state.adjustments.invert,
        grayscale: state.adjustments.grayscale,
        edgeDetection: state.adjustments.edgeDetection,
        dithering: state.engine.dithering,
        useShapeMatching: state.engine.useShapeMatching,
        ditherLevels: chars.length,
        invertColors: false,
        colorMode: state.colorMode,
        monoColor: state.monoColor,
        enableHistogramEq: state.engine.enableHistogramEq,
        enableAdaptiveEq: state.engine.enableAdaptiveEq,
        enableUnsharpMask: state.engine.enableUnsharpMask,
        enableNoiseReduction: state.engine.enableNoiseReduction,
        edgeEnhance: state.engine.edgeEnhance,
      };

      const worker = workerRef.current;

      const handler = (e: MessageEvent) => {
        onResult(e.data.output, e.data.colorGrid);
        worker.removeEventListener("message", handler);
      };
      worker.addEventListener("message", handler);

      worker.postMessage({
        imageData: state.imageData,
        options,
      });
    },
    []
  );

  return { convert };
}
