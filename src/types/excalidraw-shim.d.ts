declare module '@excalidraw/excalidraw' {
  import type { ComponentType } from 'react';

  export type ExcalidrawImperativeAPI = {
    resetScene: () => void;
    refresh: () => void;
    [key: string]: unknown;
  };

  export const Excalidraw: ComponentType<Record<string, unknown>>;
}

declare module '@excalidraw/excalidraw/types' {
  import type { ExcalidrawImperativeAPI as ExcalidrawImperativeAPI } from '@excalidraw/excalidraw';

  export type ExcalidrawImperativeAPI = ExcalidrawImperativeAPI;
}
