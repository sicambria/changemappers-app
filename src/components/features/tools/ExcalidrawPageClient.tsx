'use client';

import type React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CircleHelp, Eraser, RefreshCcw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { sanitizeStoredScene, type StoredScene } from '@/components/features/tools/excalidrawScene';
import { Z_CLASS } from '@/lib/z-index';

type ExcalidrawApi = import('@excalidraw/excalidraw/types').ExcalidrawImperativeAPI;

declare global {
  interface Window {
    EXCALIDRAW_ASSET_PATH?: string;
  }
}

function ExcalidrawLoading() {
  // next/dynamic `loading` renders as a component, so the hook is valid here even
  // though the dynamic() call itself sits at module level.
  const { t } = useTranslation(['common']);
  return (
    <div className="flex h-full items-center justify-center bg-slate-950 text-slate-200">
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-5 py-3 text-sm">
        {t('tools.draw.loading')}
      </div>
    </div>
  );
}

const Excalidraw = dynamic(
  async () => {
    globalThis.window.EXCALIDRAW_ASSET_PATH = '/excalidraw/';
    const excalidrawModule = await import('@excalidraw/excalidraw');
    return excalidrawModule.Excalidraw;
  },
  {
    ssr: false,
    loading: () => <ExcalidrawLoading />,
  },
) as unknown as React.ComponentType<Record<string, unknown>>;

const STORAGE_KEY = 'changemappers.excalidraw.scene';

function readStoredScene(): StoredScene | null {
  if (globalThis.window === undefined) {
    return null;
  }

  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeStoredScene(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function resolveExcalidrawLanguage(language: string | undefined): string {
  switch (language) {
    case 'hu':
      return 'hu-HU';
    case 'es':
      return 'es-ES';
    default:
      return 'en';
  }
}

export default function ExcalidrawPageClient() {
  const { t } = useTranslation(['common']);
  const { language } = useLanguage();
  const excalidrawApiRef = useRef<ExcalidrawApi | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const [initialData, setInitialData] = useState<StoredScene | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    setInitialData(readStoredScene());
  }, []);

  useEffect(() => () => {
    if (saveTimeoutRef.current !== null) {
      globalThis.clearTimeout(saveTimeoutRef.current);
    }
  }, []);

  const handleClear = useCallback(() => {
    globalThis.localStorage.removeItem(STORAGE_KEY);
    excalidrawApiRef.current?.resetScene();
  }, []);

  const handleReload = useCallback(() => {
    setInitialData(readStoredScene());
    excalidrawApiRef.current?.refresh();
  }, []);

  const excalidrawLanguage = resolveExcalidrawLanguage(language);

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950">
      {/* Floating toolbar */}
      <div className="absolute left-4 top-4 z-50 flex items-center gap-2">
        <Link
          href="/tools"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-900/90 text-slate-200 shadow-lg backdrop-blur transition hover:border-emerald-400/30 hover:text-emerald-300"
          title={t('tools.draw.backToTools')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <button
          type="button"
          onClick={handleClear}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-900/90 text-amber-200 shadow-lg backdrop-blur transition hover:border-amber-400/30 hover:text-amber-100"
          title={t('tools.draw.clearCanvas')}
        >
          <Eraser className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={handleReload}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-900/90 text-slate-200 shadow-lg backdrop-blur transition hover:border-white/25 hover:text-white"
          title={t('tools.draw.reloadLocalScene')}
        >
          <RefreshCcw className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-900/90 text-emerald-300 shadow-lg backdrop-blur transition hover:border-emerald-400/30 hover:text-emerald-200"
          title={t('tools.draw.openHelp')}
        >
          <CircleHelp className="h-5 w-5" />
        </button>
      </div>

      {/* Canvas fills the entire viewport */}
      <div className="h-full w-full">
        <Excalidraw
          excalidrawAPI={(api: ExcalidrawApi) => {
            excalidrawApiRef.current = api;
          }}
          initialData={initialData ?? undefined}
          langCode={excalidrawLanguage}
          theme="light"
          UIOptions={{
            canvasActions: {
              loadScene: true,
              saveToActiveFile: true,
              export: {
                saveFileToDisk: true,
              },
            },
          }}
          onChange={(elements: unknown[], appState: Record<string, unknown>, files: Record<string, unknown>) => {
            if (saveTimeoutRef.current !== null) {
              globalThis.clearTimeout(saveTimeoutRef.current);
            }

            saveTimeoutRef.current = globalThis.setTimeout(() => {
              const nextScene = sanitizeStoredScene({
                elements,
                appState,
                files,
              });

              if (!nextScene) {
                return;
              }

              globalThis.localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(nextScene),
              );
            }, 250) as unknown as number;
          }}
        />
      </div>

      {/* Help modal */}
      {helpOpen && (
        <div // NOSONAR(S6819) — role="dialog"+aria-modal kept; native dialog relies on showModal()/close() which jsdom does not implement, breaking modal tests — focus/Esc handled in JS
          className={`fixed inset-0 ${Z_CLASS.toolOverlay} flex items-center justify-center p-4`}
          role="dialog"
          aria-modal="true"
          aria-label={t('tools.draw.helpTitle')}
        >
          <div // NOSONAR(S6819) — role="button" trigger with nested button children (button-in-button blocked); a native button wrapper would be invalid button-in-button — role=button + tabIndex + keyboard handlers cover interaction
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setHelpOpen(false)}
            onKeyDown={(e) => { if (e.key === 'Escape') setHelpOpen(false); }}
            role="button"
            tabIndex={-1}
            aria-label={t('tools.draw.closeHelp')}
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">
                {t('tools.draw.helpTitle')}
              </h2>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 px-6 py-5 text-sm text-slate-300">
              <p>{t('tools.draw.helpIntro')}</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>{t('tools.draw.helpClear')}</li>
                <li>{t('tools.draw.helpReload')}</li>
                <li>{t('tools.draw.helpSelfHosted')}</li>
                <li>{t('tools.draw.helpAutosave')}</li>
                <li>{t('tools.draw.helpExport')}</li>
              </ul>
              <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-emerald-50">
                {t('tools.draw.helpLimitations')}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
              <Link
                href="/canvas"
                className="rounded-xl border border-emerald-400/30 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-400/10 hover:text-emerald-100"
              >
                {t('tools.draw.openCanvas')}
              </Link>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
              >
                {t('tools.draw.closeHelp')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
