'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutGridIcon, SearchIcon, TableIcon } from 'lucide-react';

type Portal = {
  name: string;
  type: string;
  url: string;
  score: number | null;
  audience: string;
  features: string[];
  description: string;
};

export function OpenPlatformAnalyzerClient() {
  const { t } = useTranslation('tools');
  const dimensions = t('openPlatform.dimensionsList', { returnObjects: true }) as string[];
  const portals = t('openPlatform.portals', { returnObjects: true }) as Portal[];
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [logic, setLogic] = useState<'AND' | 'OR' | 'XOR'>('AND');
  const [view, setView] = useState<'grid' | 'table'>('grid');

  const toggleDimension = (dimension: string) => {
    setSelected((prev) => prev.includes(dimension) ? prev.filter((item) => item !== dimension) : [...prev, dimension]);
  };

  const filtered = useMemo(() => portals.filter((portal) => {
    const q = query.trim().toLowerCase();
    const textMatch = !q || [portal.name, portal.type, portal.description, portal.audience].some((value) => value.toLowerCase().includes(q));
    if (!textMatch) return false;
    if (selected.length === 0) return true;
    const count = selected.filter((feature) => portal.features.includes(feature)).length;
    if (logic === 'AND') return count === selected.length;
    if (logic === 'OR') return count > 0;
    return count === 1;
  }), [portals, query, selected, logic]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="text-3xl font-bold">{t('openPlatform.title')}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">{t('openPlatform.subtitle')}</p>
        </div>
      </section>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-6 rounded-lg border border-slate-200 bg-white p-4">
          <label className="block text-sm font-medium text-slate-700" htmlFor="portal-search">{t('openPlatform.searchLabel')}</label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input id="portal-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('openPlatform.searchPlaceholder')} className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm" />
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold">{t('openPlatform.dimensions')}</h2>
            <div className="space-y-2">
              {dimensions.map((dimension) => (
                <label key={dimension} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={selected.includes(dimension)} onChange={() => toggleDimension(dimension)} />
                  {dimension}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">{t('openPlatform.filterLogic')}</h2>
            {(['AND', 'OR', 'XOR'] as const).map((option) => <label key={option} className="flex items-center gap-2 text-sm"><input type="radio" checked={logic === option} onChange={() => setLogic(option)} />{option}</label>)}
          </div>
          <button type="button" onClick={() => { setSelected([]); setQuery(''); }} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium">{t('openPlatform.clear')}</button>
        </aside>
        <section>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-600">{t('openPlatform.results', { count: filtered.length })}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setView('grid')} aria-label={t('openPlatform.gridView')} className="rounded-md border border-slate-300 p-2"><LayoutGridIcon className="h-4 w-4" /></button>
              <button type="button" onClick={() => setView('table')} aria-label={t('openPlatform.tableView')} className="rounded-md border border-slate-300 p-2"><TableIcon className="h-4 w-4" /></button>
            </div>
          </div>
          {view === 'grid' ? (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((portal) => (
                <article key={portal.name} className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{portal.name}</h2><p className="text-xs uppercase tracking-wide text-emerald-700">{portal.type}</p></div>{portal.score && <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{portal.score}</span>}</div>
                  <p className="mt-3 text-sm text-slate-600">{portal.description}</p><p className="mt-3 text-xs text-slate-500">{portal.audience}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">{portal.features.map((feature) => <span key={feature} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{feature}</span>)}</div>
                  <a href={portal.url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-medium text-emerald-700">{t('openPlatform.visit')}</a>
                </article>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white"><table className="min-w-full text-sm"><thead className="bg-slate-50"><tr><th className="px-4 py-3 text-left">{t('openPlatform.portal')}</th><th className="px-4 py-3 text-left">{t('openPlatform.score')}</th><th className="px-4 py-3 text-left">{t('openPlatform.features')}</th><th className="px-4 py-3 text-left">{t('openPlatform.audience')}</th></tr></thead><tbody>{filtered.map((portal) => <tr key={portal.name} className="border-t border-slate-100"><td className="px-4 py-3 font-medium">{portal.name}</td><td className="px-4 py-3">{portal.score ?? 'N/A'}</td><td className="px-4 py-3">{portal.features.join(', ')}</td><td className="px-4 py-3">{portal.audience}</td></tr>)}</tbody></table></div>
          )}
        </section>
      </div>
    </main>
  );
}
