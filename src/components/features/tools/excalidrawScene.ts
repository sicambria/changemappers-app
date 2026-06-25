export type StoredScene = {
  elements?: unknown[];
  appState?: Record<string, unknown>;
  files?: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeAppState(appState: unknown): Record<string, unknown> {
  if (!isRecord(appState)) {
    return { collaborators: [] };
  }

  return {
    ...appState,
    collaborators: Array.isArray(appState.collaborators) ? appState.collaborators : [],
  };
}

export function sanitizeStoredScene(scene: unknown): StoredScene | null {
  if (!isRecord(scene)) {
    return null;
  }

  return {
    elements: Array.isArray(scene.elements) ? scene.elements : [],
    appState: sanitizeAppState(scene.appState),
    files: isRecord(scene.files) ? scene.files : {},
  };
}
