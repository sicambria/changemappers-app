'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { SearchIcon } from 'lucide-react';

export type HelpLink = { text: string; href: string };

export type HelpSection = {
  id: string;
  title: string;
  summary: string;
  items: string[];
  label?: string;
  links?: HelpLink[];
  inlineLinks?: Record<string, string>;
};

type HelpSearchClientProps = {
  sections: HelpSection[];
  searchLabel: string;
  searchPlaceholder: string;
  resultsLabel: string;
  noResultsTitle: string;
  noResultsBody: string;
  tocLabel: string;
  filterLabel: string;
  clearFilterLabel: string;
};

const LABEL_COLORS: Record<string, string> = {
  Philosophy: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
  'Getting Started': 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
  Community: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  Matching: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  Privacy: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  Safety: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
  Learning: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
};

const LABEL_COLORS_ACTIVE: Record<string, string> = {
  Philosophy: 'bg-violet-600 text-white border-violet-600',
  'Getting Started': 'bg-sky-600 text-white border-sky-600',
  Community: 'bg-emerald-600 text-white border-emerald-600',
  Matching: 'bg-amber-500 text-white border-amber-500',
  Privacy: 'bg-rose-600 text-white border-rose-600',
  Safety: 'bg-orange-600 text-white border-orange-600',
  Learning: 'bg-teal-600 text-white border-teal-600',
};

function getLabelColor(label: string, active: boolean): string {
  if (active) return LABEL_COLORS_ACTIVE[label] ?? 'bg-slate-700 text-white border-slate-700';
  return LABEL_COLORS[label] ?? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';
}

function sectionText(section: HelpSection): string {
  return [section.title, section.summary, ...section.items].join(' ').toLocaleLowerCase();
}

function renderWithInlineLinks(text: string, inlineLinks: Record<string, string>): React.ReactNode {
  const keys = Object.keys(inlineLinks);
  if (keys.length === 0) return text;

  // Build case-insensitive pattern, longest match first
  const sorted = keys.toSorted((a, b) => b.length - a.length);
  const escaped = sorted.map((k) => k.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) => {
    const lower = part.toLowerCase();
    const href = inlineLinks[part] ?? inlineLinks[lower];
    if (href) {
      return (
        <Link
          key={i /* NOSONAR(S6479) — positional segments of a single regex-split string; the list is rebuilt from scratch each render and never reordered, so the index is the stable identity */}
          href={href}
          className="font-medium text-emerald-700 underline decoration-emerald-300 underline-offset-2 transition-colors hover:text-emerald-900 hover:decoration-emerald-500"
        >
          {part}
        </Link>
      );
    }
    return part;
  });
}

function scrollToCard(id: string) {
  document.getElementById(`card-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function SectionCard({ section }: Readonly<{ section: HelpSection }>) {
  const inlineLinks = section.inlineLinks ?? {};

  return (
    <article
      id={`card-${section.id}`}
      className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-950">{section.title}</h2>
        {section.label && (
          <span
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getLabelColor(section.label, false)}`}
          >
            {section.label}
          </span>
        )}
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {renderWithInlineLinks(section.summary, inlineLinks)}
      </p>

      <ul className="mt-5 grow space-y-3 text-sm leading-6 text-slate-700">
        {section.items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
            <span>{renderWithInlineLinks(item, inlineLinks)}</span>
          </li>
        ))}
      </ul>

      {section.links && section.links.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {section.links.slice(0, 3).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
            >
              {link.text} →
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}

export function HelpSearchClient({
  sections,
  searchLabel,
  searchPlaceholder,
  resultsLabel,
  noResultsTitle,
  noResultsBody,
  tocLabel,
  filterLabel,
  clearFilterLabel,
}: Readonly<HelpSearchClientProps>) {
  const [query, setQuery] = useState('');
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const normalizedQuery = query.trim().toLocaleLowerCase();

  const allLabels = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const s of sections) {
      if (s.label && !seen.has(s.label)) {
        seen.add(s.label);
        result.push(s.label);
      }
    }
    return result;
  }, [sections]);

  const filteredSections = useMemo(() => {
    let result = sections;
    if (normalizedQuery) result = result.filter((s) => sectionText(s).includes(normalizedQuery));
    if (activeLabel) result = result.filter((s) => s.label === activeLabel);
    return result;
  }, [normalizedQuery, activeLabel, sections]);

  const renderedResultsLabel = resultsLabel.replace('{{count}}', String(filteredSections.length));

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    observerRef.current?.disconnect();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id.replace('card-', ''));
            break;
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
    );
    observerRef.current = observer;
    for (const section of filteredSections) {
      const el = document.getElementById(`card-${section.id}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [filteredSections]);

  return (
    <div className="flex gap-8">
      {/* Sidebar: TOC + label filter (desktop) */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-24 space-y-1">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
            {tocLabel}
          </p>
          <nav aria-label={tocLabel}>
            {filteredSections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToCard(section.id)}
                className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm transition ${
                  activeId === section.id
                    ? 'bg-emerald-50 font-semibold text-emerald-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {section.title}
              </button>
            ))}
          </nav>

          {allLabels.length > 0 && (
            <div className="mt-6 space-y-2 border-t border-slate-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                {filterLabel}
              </p>
              <div className="flex flex-col gap-1.5">
                {allLabels.map((label) => (
                  <button
                    key={label}
                    onClick={() => setActiveLabel(activeLabel === label ? null : label)}
                    className={`rounded-xl border px-3 py-1.5 text-left text-xs font-semibold transition ${getLabelColor(label, activeLabel === label)}`}
                  >
                    {label}
                  </button>
                ))}
                {activeLabel && (
                  <button
                    onClick={() => setActiveLabel(null)}
                    className="mt-1 text-left text-xs text-slate-400 underline hover:text-slate-600"
                  >
                    {clearFilterLabel}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* Mobile: label chips */}
        {allLabels.length > 0 && (
          <div className="flex flex-wrap gap-2 lg:hidden">
            {allLabels.map((label) => (
              <button
                key={label}
                onClick={() => setActiveLabel(activeLabel === label ? null : label)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${getLabelColor(label, activeLabel === label)}`}
              >
                {label}
              </button>
            ))}
            {activeLabel && (
              <button
                onClick={() => setActiveLabel(null)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:bg-slate-50"
              >
                {clearFilterLabel}
              </button>
            )}
          </div>
        )}

        <label className="block" htmlFor="help-search">
          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
            {searchLabel}
          </span>
          <span className="relative mt-3 block">
            <SearchIcon
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="help-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </span>
        </label>

        <p className="text-sm font-medium text-slate-500" aria-live="polite">
          {renderedResultsLabel}
        </p>

        {filteredSections.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredSections.map((section) => (
              <SectionCard key={section.id} section={section} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
            <h2 className="text-lg font-semibold text-slate-950">{noResultsTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{noResultsBody}</p>
          </div>
        )}
      </div>
    </div>
  );
}
