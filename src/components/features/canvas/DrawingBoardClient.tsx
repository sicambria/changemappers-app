'use client';

/**
 * DrawingBoardClient
 *
 * Embeds the draw.io editor via the official embed iframe API.
 * Communicates via window.postMessage (proto=json protocol).
 *
 * Flow:
 * 1. Iframe loads → sends "init" message
 * 2. We respond with "load" + diagram XML
 * 3. User edits; on Ctrl+S / Save button → editor sends "export" request
 * 4. We forward "export" to iframe, editor replies with XML
 * 5. We persist XML via saveCanvasDiagramAction
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { saveCanvasDiagramAction } from '@/app/actions/canvas';
import { getLocalCanvas, markLocalCanvasSynced, upsertLocalCanvas } from '@/lib/local-db';

interface Props {
  canvasId: string;
  title: string;
  initialXml: string | null;
  isOwner: boolean;
}

type DrawIoMessage =
  | { event: 'init' }
  | { event: 'load'; xml: string }
  | { event: 'save'; xml: string }
  | { event: 'export'; format: string; xml: string }
  | { event: 'autosave'; xml: string }
  | { event: 'configure' }
  | { event: 'ready' };

const EMBED_URL =
  'https://embed.diagrams.net/?embed=1&spin=1&proto=json&saveAndExit=0&noExitBtn=1&libraries=1&lang=en';

export default function DrawingBoardClient({ canvasId, title, initialXml, isOwner }: Readonly<Props>) {
  const { t } = useTranslation('canvas');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeXml, setActiveXml] = useState(initialXml);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'local' | 'saved' | 'error'>('idle');
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const pendingExportRef = useRef(false);

  const postToEditor = useCallback((msg: object) => {
    const frame = iframeRef.current;
    if (!frame?.contentWindow) return;
    frame.contentWindow.postMessage(JSON.stringify(msg), 'https://embed.diagrams.net');
  }, []);

  const loadDiagram = useCallback(() => {
    postToEditor({
      action: 'load',
      xml: activeXml ?? '<mxGraphModel/>',
      autosave: isOwner ? 1 : 0,
    });
  }, [postToEditor, activeXml, isOwner]);

  const requestExport = useCallback(() => {
    if (!isOwner) return;
    pendingExportRef.current = true;
    postToEditor({ action: 'export', format: 'xml' });
  }, [postToEditor, isOwner]);

  const persistXml = useCallback(
    async (xml: string) => {
      if (!isOwner) return;
      setSaveStatus('saving');
      try {
        const updatedAt = new Date().toISOString();
        await upsertLocalCanvas({
          id: canvasId,
          title,
          visibility: 'REGISTERED',
          diagramXml: xml,
          updatedAt,
          dirty: true,
        });
        setActiveXml(xml);
        setSaveStatus('local');

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setHasUnsaved(false);
          return;
        }

        const result = await saveCanvasDiagramAction(canvasId, xml);
        if (result.success) {
          await markLocalCanvasSynced(canvasId);
          setSaveStatus('saved');
          setHasUnsaved(false);
          setTimeout(() => setSaveStatus('idle'), 2500);
        } else {
          setSaveStatus('error');
        }
      } catch {
        setSaveStatus('error');
      }
    },
    [canvasId, isOwner, title],
  );

  useEffect(() => {
    if (!isOwner) return;

    let isMounted = true;
    void getLocalCanvas(canvasId).then(async (localCanvas) => {
      if (!isMounted) return;

      if (localCanvas?.diagramXml) {
        setActiveXml(localCanvas.diagramXml);

        if (!localCanvas.dirty && initialXml && localCanvas.diagramXml !== initialXml) {
          const updatedAt = new Date().toISOString();
          await upsertLocalCanvas({
            ...localCanvas,
            title,
            diagramXml: initialXml,
            updatedAt,
            cloudUpdatedAt: updatedAt,
            dirty: false,
          });
          if (isMounted) setActiveXml(initialXml);
        }
        return;
      }

      if (!initialXml) return;

      const updatedAt = new Date().toISOString();
      await upsertLocalCanvas({
        id: canvasId,
        title,
        visibility: 'REGISTERED',
        diagramXml: initialXml,
        updatedAt,
        cloudUpdatedAt: updatedAt,
        dirty: false,
      });
    });

    return () => {
      isMounted = false;
    };
  }, [canvasId, initialXml, isOwner, title]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;

      let msg: DrawIoMessage;
      try {
        msg = JSON.parse(event.data as string) as DrawIoMessage;
      } catch {
        return;
      }

      switch (msg.event) {
        case 'init':
          loadDiagram();
          break;

        case 'configure':
          postToEditor({ action: 'configure', config: {} });
          break;

        case 'autosave':
          if (isOwner) {
            setHasUnsaved(true);
            void persistXml(msg.xml);
          }
          break;

        case 'save':
          if (isOwner) {
            void persistXml(msg.xml);
          }
          break;

        case 'export':
          if (pendingExportRef.current) {
            pendingExportRef.current = false;
            void persistXml(msg.xml);
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loadDiagram, persistXml, postToEditor, isOwner]);

  return (
    <div className="relative flex flex-col h-full w-full">
      {isOwner && (
        <div className="absolute top-2 right-3 z-10 flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="rounded-full bg-white/90 border border-gray-200 px-3 py-1 text-xs text-gray-500 shadow-sm">
              {t('drawingBoard.saving')}
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs text-emerald-700 shadow-sm">
              {t('drawingBoard.saved')}
            </span>
          )}
          {saveStatus === 'local' && (
            <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs text-amber-700 shadow-sm">
              {t('drawingBoard.savedLocally')}
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs text-red-600 shadow-sm">
              {t('drawingBoard.saveFailed')}
            </span>
          )}
          {saveStatus === 'idle' && hasUnsaved && (
            <button
              onClick={requestExport}
              className="rounded-full bg-white/90 border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 shadow-sm transition"
            >
              {t('drawingBoard.save')}
            </button>
          )}
          {saveStatus === 'local' && (
            <button
              onClick={requestExport}
              className="rounded-full bg-white/90 border border-amber-200 px-3 py-1 text-xs text-amber-700 hover:bg-amber-50 shadow-sm transition"
            >
              {t('drawingBoard.syncToCloud')}
            </button>
          )}
        </div>
      )}

      {!isOwner && (
        <div className="absolute top-2 right-3 z-10">
          <span className="rounded-full bg-white/90 border border-gray-200 px-3 py-1 text-xs text-gray-400 shadow-sm">
            {t('drawingBoard.viewOnly')}
          </span>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={EMBED_URL}
        className="flex-1 w-full h-full border-0"
        title={t('drawingBoard.title')}
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}
