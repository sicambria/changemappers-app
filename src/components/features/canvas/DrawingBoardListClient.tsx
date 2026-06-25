'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Canvas {
  id: string;
  title: string;
  description?: string | null;
  visibility: string;
  createdBy: { name: string | null };
}

const VISIBILITY_COLORS: Record<string, string> = {
  PUBLIC: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REGISTERED: 'bg-blue-50 text-blue-700 border-blue-200',
  COMMUNITY: 'bg-purple-50 text-purple-700 border-purple-200',
};

interface Props {
  canvases: Canvas[];
}

export default function DrawingBoardListClient({ canvases }: Readonly<Props>) {
  const { t } = useTranslation('canvas');

  const getVisibilityLabel = (visibility: string): string => {
    return t(`visibility.${visibility}`, visibility);
  };

  return (
    <main className="h-full overflow-y-auto bg-gray-50 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('drawingBoard.title')}</h1>
            <p className="text-gray-500 mt-1">
              {t('drawingBoard.subtitle')}
            </p>
          </div>
          <Link
            href="/canvas/new"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
          >
            {t('drawingBoard.newDiagram')}
          </Link>
        </div>

        {canvases.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-gray-200 shadow-sm mb-4">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">{t('drawingBoard.noDiagrams')}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {canvases.map((canvas) => (
            <Link
              key={canvas.id}
              href={`/canvas/${canvas.id}`}
              className="block rounded-2xl border border-gray-200 bg-white p-5 hover:border-emerald-300 hover:shadow-md transition-all shadow-sm group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                  {canvas.title}
                </h2>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${VISIBILITY_COLORS[canvas.visibility] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}
                >
                  {getVisibilityLabel(canvas.visibility)}
                </span>
              </div>
              {canvas.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                  {canvas.description}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-auto">
                {t('drawingBoard.by')} {canvas.createdBy.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
