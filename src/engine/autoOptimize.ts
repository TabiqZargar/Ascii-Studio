/**
 * Auto-optimize feature for one-click quality improvement.
 *
 * Analyzes the image, detects subject type, and applies
 * optimal settings automatically.
 */

import { analyzeSubject, type SubjectAnalysis } from "./subjectDetection";
import type { AppState } from "../types";

export interface OptimizeResult {
  analysis: SubjectAnalysis;
  suggestedState: Partial<AppState>;
  summary: string;
}

export function autoOptimize(imageData: ImageData, currentState: AppState): OptimizeResult {
  const analysis = analyzeSubject(imageData);

  const suggestedState: Partial<AppState> = {
    charPresetId: getCharPresetForType(analysis),
    colorMode: getColorModeForType(analysis),
    adjustments: {
      ...currentState.adjustments,
      contrast: analysis.recommendedSettings.contrast,
      brightness: analysis.recommendedSettings.brightness,
      sharpness: analysis.recommendedSettings.sharpness,
      saturation: 1.0,
      exposure: 1.0,
      gamma: analysis.type === "screenshot" ? 1.2 : 1.0,
      blur: 0,
      invert: false,
      grayscale: false,
      edgeDetection: false,
    },
  };

  const summary = buildSummary(analysis);

  return { analysis, suggestedState, summary };
}

function getCharPresetForType(analysis: SubjectAnalysis): string {
  switch (analysis.type) {
    case "portrait":
      return "dense";
    case "landscape":
      return "dense";
    case "architecture":
      return "classic";
    case "logo":
      return "classic";
    case "text":
      return "classic";
    case "screenshot":
      return "classic";
    case "illustration":
      return "classic";
    default:
      return "classic";
  }
}

function getColorModeForType(analysis: SubjectAnalysis): "mono" | "original" | "gradient" {
  switch (analysis.type) {
    case "portrait":
      return "original";
    case "landscape":
      return "gradient";
    case "architecture":
      return "mono";
    case "logo":
      return "mono";
    case "screenshot":
      return "mono";
    case "text":
      return "mono";
    case "illustration":
      return "original";
    default:
      return "mono";
  }
}

function buildSummary(analysis: SubjectAnalysis): string {
  const typeLabel = analysis.type.charAt(0).toUpperCase() + analysis.type.slice(1);
  const confidence = Math.round(analysis.confidence * 100);
  const edgeLabel = analysis.features.edgeDensity > 0.2 ? "High" :
    analysis.features.edgeDensity > 0.1 ? "Medium" : "Low";
  const qualityLabel = analysis.confidence > 0.6 ? "Excellent" :
    analysis.confidence > 0.3 ? "Good" : "Fair";

  return [
    `Auto optimized for ${typeLabel}`,
    `Character Set: ${getCharPresetForType(analysis) === "dense" ? "Classic Dense" : "Classic"}`,
    `Detail: ${analysis.features.textureComplexity > 0.2 ? "High" : "Medium"}`,
    `Contrast: ${Math.round((analysis.recommendedSettings.contrast - 1) * 100)}%`,
    `Edge Enhancement: ${edgeLabel}`,
    `Estimated Quality: ${qualityLabel}`,
    `Confidence: ${confidence}%`,
  ].join("\n");
}
