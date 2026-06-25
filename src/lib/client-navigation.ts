'use client';

export function hardNavigate(destination: string): void {
  globalThis.location.assign(destination);
}
