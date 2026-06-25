'use client';

import { useRef, useState, useEffect } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/lib/i18n';
import { GlobeIcon, ChevronDownIcon } from 'lucide-react';
import { Z_CLASS } from '@/lib/z-index';

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
    hu: 'Magyar',
    en: 'English',
    es: 'Español',
};

interface LanguageSwitcherProps {
    /** "dropdown" = compact button with flyout (menu bar), "buttons" = inline buttons (mobile menu), "menu-item" = row inside a dropdown */
    variant?: 'dropdown' | 'buttons' | 'menu-item';
}

export function LanguageSwitcher({ variant = 'dropdown' }: Readonly<LanguageSwitcherProps>) {
    const { language, changeLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (variant !== 'dropdown') return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [variant]);

    if (variant === 'dropdown') {
        return (
            <div className="relative" ref={ref}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:text-emerald-400 dark:hover:bg-gray-800"
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                >
                    <GlobeIcon className="h-4 w-4" />
                    <span className="uppercase font-bold text-xs">{language}</span>
                    <ChevronDownIcon className={`h-3 w-3 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                    <div className={`absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 ${Z_CLASS.aboveHeader} dark:bg-gray-800 dark:border-gray-700`}>
                        {SUPPORTED_LANGUAGES.map((lang) => (
                            <button
                                key={lang}
                                onClick={() => { changeLanguage(lang); setIsOpen(false); }}
                                className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                                    language === lang
                                        ? 'text-emerald-600 bg-emerald-50 font-semibold dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            >
                                <span className="w-7 text-[10px] font-bold uppercase text-gray-400">{lang}</span>
                                {LANGUAGE_LABELS[lang]}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (variant === 'menu-item') {
        return (
            <div className="px-4 py-2">
                <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <GlobeIcon className="h-3 w-3" />
                    <span>{LANGUAGE_LABELS[language]}</span>
                </div>
                <div className="flex gap-1">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                        <button
                            key={lang}
                            onClick={() => changeLanguage(lang)}
                            className={`px-2 py-1 text-xs rounded font-medium transition-colors whitespace-nowrap ${
                                language === lang
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            {LANGUAGE_LABELS[lang]}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // buttons variant (mobile menu)
    return (
        <div className="flex items-center gap-2 px-4 py-2">
            <GlobeIcon className="h-4 w-4 text-gray-400" />
            <div className="flex gap-1">
                {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                        key={lang}
                        onClick={() => changeLanguage(lang)}
                        className={`px-2.5 py-1 text-sm rounded-md font-medium transition-colors whitespace-nowrap ${
                            language === lang
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        {LANGUAGE_LABELS[lang]}
                    </button>
                ))}
            </div>
        </div>
    );
}
