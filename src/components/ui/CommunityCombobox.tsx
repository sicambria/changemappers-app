'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { SearchIcon, CheckIcon, ChevronDownIcon, PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { searchCommunitiesAction } from '@/app/actions/community';

export interface CommunityOption {
    id: string;
    name: string;
    isNew?: boolean;
}

export function CommunityCombobox({
  value,
  onChange,
  placeholder,
  error,
}: Readonly<{
  value: CommunityOption | null;
  onChange: (val: CommunityOption | null) => void;
  placeholder?: string;
  error?: string;
}>) {
  const { t } = useTranslation('common');
  const displayPlaceholder = placeholder || t('communityCombobox.searchOrAdd');
  const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [options, setOptions] = useState<CommunityOption[]>([]);
    const [isPending, startTransition] = useTransition();
    const containerRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    // Perform search whenever the search string changes
    useEffect(() => {
        if (!open) return;

        startTransition(async () => {
            try {
                // Fetch existing communities matching query
                const res = await searchCommunitiesAction({ query: search, page: 1, pageSize: 10 });
                let fetchedOps: CommunityOption[] = [];
                if (res.success && res.data) {
                    fetchedOps = res.data.data.map(c => ({
                        id: c.id,
                        name: c.name
                    }));
                }

                // Append "AddNew" option if there's text and it doesn't exactly match an existing name
                const exactMatch = fetchedOps.some(o => o.name.toLowerCase() === search.trim().toLowerCase());
                if (search.trim().length > 1 && !exactMatch) {
                    fetchedOps.push({
                        id: 'NEW',
                        name: search.trim(),
                        isNew: true
                    });
                }

                setOptions(fetchedOps);
            } catch (error) {
                console.error('Combobox search failed:', error);
            }
        });
    }, [search, open]);

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border bg-white dark:bg-gray-800 text-sm ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                    } ${open ? 'ring-2 ring-emerald-500 border-transparent' : ''}`}
            >
                <span className={value ? 'text-gray-900 dark:text-white line-clamp-1 text-left' : 'text-gray-500 dark:text-gray-400 line-clamp-1 text-left'}>
                    {value ? value.name : displayPlaceholder}
                </span>
                <ChevronDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
            </button>

            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700 relative">
                        {isPending ? (
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        )}
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder={t('communityCombobox.searchByName')}
                            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border-none rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                            autoFocus
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto p-1">
                        {(() => {
                        if ((!options || options.length === 0) && !isPending && search.trim() === '') return (
                            <div className="p-3 text-center text-sm text-gray-500">{t('communityCombobox.startTyping')}</div>
                        );
                        if ((!options || options.length === 0) && !isPending) return (
                            <div className="p-3 text-center text-sm text-gray-500">{t('communityCombobox.noResults')}</div>
                        );
                        return (
                            options.map((opt, idx) => (
                                <button
                                    key={opt.id === 'NEW' ? `new-${idx}` : opt.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt);
                                        setOpen(false);
                                        setSearch('');
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${value?.id === opt.id && !opt.isNew
                                        ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        {opt.isNew && <PlusIcon className="h-3 w-3 text-emerald-600" />}
                                        <span className={opt.isNew ? 'font-medium text-emerald-600 dark:text-emerald-400' : ''}>
                                            {opt.isNew ? t('communityCombobox.addNew', { name: opt.name }) : opt.name}
                                        </span>
                                    </span>
                                    {value?.id === opt.id && !opt.isNew && <CheckIcon className="h-4 w-4 text-emerald-600" />}
                                </button>
                            ))
                        );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
