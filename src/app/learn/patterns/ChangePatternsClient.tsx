'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChangePattern, LogicalOperator, FILTER_CATEGORIES, PATTERN_CATEGORIES } from './types';
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LayoutGridIcon, SearchIcon, FilterIcon, XIcon, HelpCircleIcon, ZapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PatternFinderQuiz from './PatternFinderQuiz';

interface Props {
  initialPatterns: ChangePattern[];
  error?: boolean;
}

interface CategorizedFilter {
  categoryId: string;
  value: string;
  operator: LogicalOperator;
}

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  'Individual': { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-400' },
  'Community': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  'Institutional': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  'Policy': { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400' },
  'Structural': { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-400' },
  'Paradigm': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
};

const CATEGORY_ICONS: Record<string, string> = {
  levelOfChange: '📊',
  primaryApproach: '🎯',
  riskLevel: '⚠️',
  timeHorizon: '⏱️',
  participantRequirement: '👥',
};

const LOGICAL_OPERATORS: LogicalOperator[] = ['AND', 'OR', 'XOR'];

function reduceOrGroup(group: boolean[], op: LogicalOperator): boolean {
    return op === 'XOR' ? group.filter(Boolean).length === 1 : group.some(Boolean);
}

function evaluateFilterGroups(
    filters: CategorizedFilter[],
    evaluateFilter: (f: CategorizedFilter) => boolean,
): boolean {
    const andGroup: boolean[] = [];
    let currentOrGroup: boolean[] = [];

    for (let i = 0; i < filters.length; i++) {
        const result = evaluateFilter(filters[i]);
        if (i === 0) {
            currentOrGroup.push(result);
            continue;
        }
        // The operator select rendered above row `i` (only for i > 0) binds
        // `filters[i].operator`, so it is the join between filter[i-1] and filter[i].
        // Read that operator here — NOT filters[i-1].operator, which would bind the
        // select to the *next* pair (the off-by-one this fixes).
        const joinOp = filters[i].operator;
        if (joinOp === 'OR') {
            currentOrGroup.push(result);
            continue;
        }
        // AND or XOR: flush the current group, then start a new one
        if (currentOrGroup.length > 0) {
            andGroup.push(reduceOrGroup(currentOrGroup, joinOp));
            currentOrGroup = [];
        }
        currentOrGroup.push(result);
    }

    if (currentOrGroup.length > 0) {
        const lastOp = filters.length > 1 ? filters.at(-1)!.operator : 'OR';
        andGroup.push(reduceOrGroup(currentOrGroup, lastOp));
    }

    return andGroup.every(Boolean);
}

export default function ChangePatternsClient({ initialPatterns, error }: Readonly<Props>) {
  const { t } = useTranslation('learning');
  const [search, setSearch] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [categorizedFilters, setCategorizedFilters] = useState<CategorizedFilter[]>([]);

  // Plain render-time helper (not useCallback): it is only ever called during render (JSX below), so it
  // must call the live `t` directly — a `useCallback(..., [])` would freeze `t` to the first render and
  // show stale translations after a language switch, and a `tRef` cannot be read during render
  // (react-hooks/refs). This is the render-consumed exception to the §1B ref pattern.
  const translateFilterValue = (categoryId: string, value: string): string => {
    const key = `patterns.filterValues.${categoryId}.${value}`;
    return t(key, value);
  };

  const getPatternCategories = useCallback((pattern: ChangePattern, categoryId: string): string[] => {
    if (categoryId === 'levelOfChange') {
      return pattern.levelOfChange.split(',').map(s => s.trim());
    }
    const categorizer = PATTERN_CATEGORIES[categoryId];
    return categorizer ? categorizer(pattern) : [];
  }, []);

  const matchesPattern = useCallback((pattern: ChangePattern, filters: CategorizedFilter[], searchTerm: string): boolean => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      pattern.name.toLowerCase().includes(searchLower) ||
      pattern.definition.toLowerCase().includes(searchLower) ||
      pattern.example.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;
    if (filters.length === 0) return true;

    return evaluateFilterGroups(filters, (filter) => {
      const patternValues = getPatternCategories(pattern, filter.categoryId);
      return patternValues.includes(filter.value);
    });
  }, [getPatternCategories]);

  const filteredPatterns = useMemo(() => {
    return initialPatterns.filter(p => matchesPattern(p, categorizedFilters, search));
  }, [initialPatterns, categorizedFilters, search, matchesPattern]);

  const addFilter = (categoryId: string, value: string) => {
    if (!value) return;
    const newFilter: CategorizedFilter = {
      categoryId,
      value,
      // New filters always default to AND; the operator can be changed later via
      // updateFilterOperator. (Previously a dead `length === 0 ? 'AND' : 'AND'` ternary.)
      operator: 'AND',
    };
    setCategorizedFilters([...categorizedFilters, newFilter]);
  };

  const updateFilterOperator = (index: number, operator: LogicalOperator) => {
    const updated = [...categorizedFilters];
    updated[index] = { ...updated[index], operator };
    setCategorizedFilters(updated);
  };

  const removeFilter = (index: number) => {
    setCategorizedFilters(categorizedFilters.filter((_, i) => i !== index));
  };

  const clearFilters = () => {
    setCategorizedFilters([]);
    setSearch('');
  };

  const _getAvailableValues = (categoryId: string): string[] => {
    const category = FILTER_CATEGORIES[categoryId];
    if (category) return category.values;
    return [];
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 p-6 rounded-lg flex items-center gap-3 border border-red-100 dark:border-red-900">
          <LayoutGridIcon className="w-6 h-6 shrink-0 text-red-500" />
          <div>
            <h2 className="font-semibold text-lg">{t('patterns.dbError')}</h2>
            <p>{t('patterns.dbErrorDetail')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <ZapIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                {t('patterns.title')}
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
              {t('patterns.subtitle')}
            </p>
          </div>
          <Button
            onClick={() => setShowQuiz(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <HelpCircleIcon className="w-4 h-4" />
            {t('patterns.findPattern')}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="space-y-6">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('patterns.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pb-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-12 shadow-sm"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                  <FilterIcon className="w-4 h-4 text-gray-500" />
                  {t('patterns.filters')}
                </h3>
                {categorizedFilters.length > 0 && (
                  <button onClick={clearFilters} className="text-xs text-rose-500 hover:underline">
                    {t('patterns.clearFilters')}
                  </button>
                )}
              </div>

              {categorizedFilters.length > 0 && (
                <div className="mb-4 space-y-2">
                  {categorizedFilters.map((filter, index) => (
                    <div key={`${filter.categoryId}-${filter.value}`} className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2">
                      {index > 0 && (
                        <select
                          value={filter.operator}
                          onChange={(e) => updateFilterOperator(index, e.target.value as LogicalOperator)}
                          className="text-xs px-1 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                          {LOGICAL_OPERATORS.map(op => (
                            <option key={op} value={op}>{op}</option>
                          ))}
                        </select>
                      )}
                <span className="text-sm flex-1">
                  <span className="text-gray-500">{t(`patterns.categoryLabels.${filter.categoryId}`)}:</span>{' '}
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">{translateFilterValue(filter.categoryId, filter.value)}</span>
                </span>
                      <button
                        onClick={() => removeFilter(index)}
                        className="text-gray-400 hover:text-rose-500"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                {Object.entries(FILTER_CATEGORIES).map(([categoryId, category]) => (
                  <div key={categoryId}>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                      <span>{CATEGORY_ICONS[categoryId]}</span>
                      {t(`patterns.categoryLabels.${categoryId}`)}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {category.values.map(value => (
                        <button
                          key={value}
                          onClick={() => addFilter(categoryId, value)}
                          disabled={categorizedFilters.some(f => f.categoryId === categoryId && f.value === value)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                        categorizedFilters.some(f => f.categoryId === categoryId && f.value === value)
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 cursor-not-allowed'
                          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                      }`}
                    >
                      {translateFilterValue(categoryId, value)}
                    </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className="lg:col-span-3">
            <div className="mb-6 text-sm text-gray-500 dark:text-gray-400 font-medium">
              {t('patterns.resultsCount', { count: filteredPatterns.length, total: initialPatterns.length })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {filteredPatterns.map(pattern => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    key={pattern.id}
                  >
                    <Card className="h-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 hover:shadow-lg transition-all relative overflow-hidden group">
                      <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500/70" />
                      <CardHeader className="pb-3 pt-6">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <Badge variant="outline" className="text-[10px] font-mono mb-2">
                              {pattern.abbr}
                            </Badge>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight">
                              {pattern.name}
                            </h3>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-5">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                          {pattern.definition}
                        </p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {pattern.levelOfChange.split(',').map((level) => {
                  const trimmedLevel = level.trim();
                  const colors = LEVEL_COLORS[trimmedLevel] || { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' };
                  return (
                    <Badge key={trimmedLevel} className={`text-xs ${colors.bg} ${colors.text}`}>
                      {translateFilterValue('levelOfChange', trimmedLevel)}
                    </Badge>
                  );
                })}
              </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t('patterns.strengths')}:</span>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">{pattern.strengths}</p>
                          </div>
                          <div className="bg-rose-50 dark:bg-rose-900/20 p-2 rounded-lg">
                            <span className="text-rose-600 dark:text-rose-400 font-semibold">{t('patterns.weaknesses')}:</span>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">{pattern.weaknesses}</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-medium">{t('patterns.bestContext')}:</span> {pattern.bestContext}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredPatterns.length === 0 && (
                <div className="col-span-full py-16 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                  <XIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="font-medium text-lg">{t('patterns.noResults')}</p>
                  <p className="text-sm mt-1">{t('patterns.noResultsHint')}</p>
                  <button onClick={clearFilters} className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition-colors">
                    {t('patterns.clearFilters')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <PatternFinderQuiz
        isOpen={showQuiz}
        onClose={() => setShowQuiz(false)}
        patterns={initialPatterns}
      />
    </div>
  );
}
