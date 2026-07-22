export type ExportFormat = "png" | "txt" | "html" | "svg" | "clipboard-text" | "clipboard-png";

export interface ExportOptions {
  format: ExportFormat;
  scale: 1 | 2 | 4;
  transparent: boolean;
  fontSize: number;
  padding: number;
  background: string;
  foreground: string;
  asciiData: string;
  colorGrid: string[][];
  colorMode: string;
  monoColor: string;
  lineHeight: number;
  letterSpacing: number;
}

export interface ExportResult {
  blob?: Blob;
  filename: string;
  mimeType: string;
}

export interface ExportPreset {
  id: string;
  label: string;
  icon: string;
  description: string;
  format: ExportFormat;
}
