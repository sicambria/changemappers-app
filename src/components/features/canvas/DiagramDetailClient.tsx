'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import DrawingBoardClient from './DrawingBoardClient';

interface Canvas {
  id: string;
  title: string;
  visibility: string;
  diagramXml?: string | null;
  createdBy: { id: string; name: string | null };
}

interface Props {
  canvas: Canvas;
  isOwner: boolean;
}

const VISIBILITY_COLORS: Record<string, string> = {
  PUBLIC: 'text-emerald-600',
  REGISTERED: 'text-blue-600',
  COMMUNITY: 'text-purple-600',
};

export default function DiagramDetailClient({ canvas, isOwner }: Readonly<Props>) {
  const { t } = useTranslation('canvas');

  const getVisibilityLabel = (visibility: string): string => {
    const onlyKey = `${visibility}_ONLY`;
    return t(`visibility.${onlyKey}`, t(`visibility.${visibility}`, visibility));
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <header className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200 shrink-0 z-10 shadow-sm">
        <Link
          href="/canvas"
          className="text-xs text-gray-400 hover:text-emerald-600 transition-colors"
        >
          {t('drawingBoard.backToBoard')}
        </Link>

        <div className="h-4 w-px bg-gray-200" />

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-gray-800 truncate">{canvas.title}</h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs border border-gray-200 rounded-full px-2.5 py-0.5 ${VISIBILITY_COLORS[canvas.visibility] ?? 'text-gray-400'}`}>
            {getVisibilityLabel(canvas.visibility)}
          </span>
          <span className="text-xs text-gray-400 hidden sm:block">
            {t('drawingBoard.by')} {canvas.createdBy.name ?? t('drawingBoard.unknown')}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <DrawingBoardClient
          canvasId={canvas.id}
          title={canvas.title}
          initialXml={canvas.diagramXml ?? null}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
}
