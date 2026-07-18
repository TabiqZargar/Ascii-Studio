import type { Project, AppState } from "../types";

const STORAGE_KEY = "glyphlab_projects";

export function saveProject(state: AppState, name: string): Project {
  const project: Project = {
    id: crypto.randomUUID(),
    name,
    savedAt: new Date().toISOString(),
    charPresetId: state.charPresetId,
    customChars: state.customChars,
    colorMode: state.colorMode,
    gradientId: state.gradientId,
    monoColor: state.monoColor,
    canvas: state.canvas,
    adjustments: state.adjustments,
    background: state.background,
    transform: state.transform,
    layers: state.layers,
    editorGrid: state.editorGrid,
  };

  const existing = loadProjects();
  existing.push(project);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  return project;
}

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function deleteProject(id: string) {
  const projects = loadProjects().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function importProjectJson(json: string): Partial<AppState> | null {
  try {
    const data = JSON.parse(json);
    if (!data.version) return null;
    return {
      charPresetId: data.charPresetId,
      customChars: data.customChars,
      colorMode: data.colorMode,
      gradientId: data.gradientId,
      monoColor: data.monoColor,
      canvas: data.canvas,
      adjustments: data.adjustments,
      background: data.background,
      transform: data.transform,
      layers: data.layers,
      editorGrid: data.editorGrid,
    };
  } catch {
    return null;
  }
}
