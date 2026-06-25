'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchIcon, BookOpenIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

interface GlossaryEntry {
  id: string;
  emoji: string;
  term: string;
  definition: string;
  category: string;
}

const CATEGORY_KEYS = [
  { key: 'all', category: 'all' },
  { key: 'self', category: 'self' },
  { key: 'nature', category: 'nature' },
  { key: 'others', category: 'others' },
  { key: 'regenerative', category: 'regenerative' },
  { key: 'systems', category: 'systems' },
  { key: 'change', category: 'change' },
] as const;

function GlossaryCard({ entry }: Readonly<{ entry: GlossaryEntry }>) {
  const { t } = useTranslation('glossary');
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      id={entry.id}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5"
    >
      <button
        className="w-full text-left flex items-start gap-5 p-6"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">
          {entry.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-xl font-bold text-gray-900 leading-snug">{entry.term}</h3>
            </div>
            <div className="flex items-center gap-3 shrink-0 mt-1">
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold">
                {t(`categories.${entry.category}`)}
              </span>
              {expanded ? (
                <div className="p-1 rounded-full bg-gray-100 text-gray-900">
                  <ChevronUpIcon className="h-5 w-5" />
                </div>
              ) : (
                <div className="p-1 rounded-full bg-gray-50 text-gray-400">
                  <ChevronDownIcon className="h-5 w-5" />
                </div>
              )}
            </div>
          </div>
          {!expanded && (
            <p className="text-sm text-gray-600 mt-3 leading-relaxed line-clamp-2">{entry.definition}</p>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-50 pt-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
          <p className="text-base text-gray-700 leading-relaxed font-medium">{entry.definition}</p>

          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
              {t(`categoryDescriptions.${entry.category}`)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GlossaryClient() {
  const { t } = useTranslation('glossary');
  const { t: tCommon } = useTranslation('common');
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const entries: GlossaryEntry[] = useMemo(() => {
    const terms = t('terms', { returnObjects: true }) as Record<string, { term: string; definition: string; category: string; emoji: string }>;
    if (!terms || typeof terms !== 'object') return [];
    
    return Object.entries(terms).map(([id, data]) => ({
      id,
      emoji: data.emoji,
      term: data.term,
      definition: data.definition,
      category: data.category,
    }));
  }, [t]);

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      const matchesCategory = activeCategory === 'all' || entry.category === activeCategory;
      const matchesQuery =
        !query ||
        entry.term.toLowerCase().includes(query.toLowerCase()) ||
        entry.definition.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory, entries]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex p-4 bg-emerald-100 rounded-3xl mb-8">
            <BookOpenIcon className="text-emerald-600" size={48} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            {tCommon('glossary.title')}
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto mb-12">
            {tCommon('glossary.subtitle')}
          </p>

          <div className="relative max-w-2xl mx-auto">
            <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
            <input
              type="search"
              placeholder={tCommon('glossary.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-14 pr-6 py-4 text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
            />
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_KEYS.map(({ key }) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`text-sm px-6 py-2.5 rounded-xl border transition-all font-bold tracking-tight ${
                  activeCategory === key
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100'
                    : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                {t(`categories.${key}`)}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs font-bold text-gray-400 uppercase tracking-widest">{filtered.length}</span>
        </div>

        <div className="space-y-6">
          {filtered.length > 0 ? (
            filtered.map((entry) => <GlossaryCard key={entry.id} entry={entry} />)
          ) : (
            <div className="text-center py-24 bg-white rounded-3xl border border-gray-100">
              <p className="text-gray-400 text-xl font-bold mb-2">{tCommon('glossary.noResults')}</p>
              <p className="text-gray-500">{tCommon('glossary.noResultsHint')}</p>
              <button
                onClick={() => setQuery('')}
                className="mt-6 text-emerald-600 font-bold hover:underline"
              >
                {tCommon('glossary.clearSearch')}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
