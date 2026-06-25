'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui';
import { XIcon, PlusIcon } from 'lucide-react';

export function TagSelector({
    value, onChange, options, translationPrefix, placeholder, max,
}: Readonly<{
    value: string;
    onChange: (v: string) => void;
    options: string[];
    translationPrefix: string;
    placeholder: string;
    max?: number;
}>) {
    const { t } = useTranslation(['profiles']);
    const [customInput, setCustomInput] = useState('');

    const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

    const toggle = (option: string) => {
        const label = t(`${translationPrefix}.${option}` as never, option);
        if (selected.includes(label)) {
            onChange(selected.filter(s => s !== label).join(', '));
        } else if (!max || selected.length < max) {
            onChange([...selected, label].join(', '));
        }
    };

    const isOptionSelected = (option: string) => {
        const label = t(`${translationPrefix}.${option}` as never, option);
        return selected.includes(label);
    };

    const addCustom = () => {
        const trimmed = customInput.trim();
        if (!trimmed || selected.includes(trimmed)) return;
        if (!max || selected.length < max) {
            onChange([...selected, trimmed].join(', '));
        }
        setCustomInput('');
    };

    const removeTag = (tag: string) => onChange(selected.filter(s => s !== tag).join(', '));

    const customTags = selected.filter(s => !options.some(o => t(`${translationPrefix}.${o}` as never, o) === s));

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
                {options.map(opt => (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => toggle(opt)}
                        className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                            isOptionSelected(opt)
                                ? 'bg-emerald-100 border-emerald-500 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-600'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                        }`}
                    >
                        {t(`${translationPrefix}.${opt}` as never, opt)}
                    </button>
                ))}
            </div>
            {customTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {customTags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300">
                            {tag}
                            <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                                <XIcon className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
            <div className="flex gap-2">
                <Input
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
                    placeholder={placeholder}
                    className="text-sm h-8"
                />
                <button
                    type="button"
                    onClick={addCustom}
                    className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs flex items-center gap-1 shrink-0"
                >
                    <PlusIcon className="h-3 w-3" />
                    {t('edit.customTagOther')}
                </button>
            </div>
        </div>
    );
}
