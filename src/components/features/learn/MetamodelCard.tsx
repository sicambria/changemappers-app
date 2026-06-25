'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Layers, ArrowRight } from 'lucide-react';
import { type Metamodel, getCategoryColors, CATEGORY_SLUG } from './metamodels.config';

// --------------------------------------------------------------------------
// Card
// --------------------------------------------------------------------------
export function MetamodelCard({ model, onClick }: Readonly<{ model: Metamodel; onClick: () => void }>) {
    const { t } = useTranslation('common');
    const colors = getCategoryColors(model.category);
    const categoryLabel = t(`metamodels.categories.${CATEGORY_SLUG[model.category] ?? 'cosmic'}`, model.category);

    return (
        <button
            type="button"
            className="group flex flex-col w-full text-left bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 cursor-pointer"
            onClick={onClick}
        >
            {/* Category stripe */}
            <div className={`h-1.5 w-full ${colors.dot}`} />

            <div className="flex flex-col gap-3 p-6 flex-1">
                {/* Category badge + origin tradition */}
                <div className="flex items-start justify-between gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text} ${colors.border} border`}>
                        {categoryLabel.replace(' Scale', '').replace(' and ', ' & ')}
                    </span>
                    <span className="text-xs text-gray-400 font-medium shrink-0">{model.originTradition}</span>
                </div>

                {/* Name */}
                <h3 className="text-lg font-extrabold text-gray-900 leading-snug group-hover:text-emerald-700 transition-colors">
                    {model.name}
                </h3>

                {/* Key quote */}
                <p className="text-sm text-gray-500 italic leading-relaxed line-clamp-2">
                    &ldquo;{model.keyQuote}&rdquo;
                </p>

                {/* Core mechanism snippet */}
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 flex-1">
                    {model.coreMechanism}
                </p>

                {/* Meta row */}
                <div className="flex flex-wrap gap-3 mt-2 pt-4 border-t border-gray-50 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <Globe size={12} className="text-emerald-500 shrink-0" />
                        {model.region}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Layers size={12} className="text-emerald-500 shrink-0" />
                        {model.nativeScale.map((s) => t(`metamodels.nativeScales.${s}`, s)).join(' · ')}
                    </span>
                    {model.originYear !== null && (
                        <span className="flex items-center gap-1.5">
                            <span className="text-emerald-500">⌚</span>
                            {model.originYear < 0 ? `${Math.abs(model.originYear)} ${t('metamodels.bce')}` : model.originYear}
                        </span>
                    )}
                </div>

                {/* Domain tags */}
                <div className="flex flex-wrap gap-1.5">
                    {model.domains.slice(0, 3).map((d) => (
                        <span key={d} className="px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-600 rounded">
                            {t(`metamodels.domainLabels.${d}`, d)}
                        </span>
                    ))}
                </div>
            </div>

            {/* Footer CTA */}
            <div className="px-6 py-4 bg-gray-50/50 group-hover:bg-emerald-50 transition-colors">
                <span className="text-xs font-bold text-emerald-600 group-hover:text-emerald-700 flex items-center gap-1 transition-colors">
                    {t('metamodels.exploreModel')} <ArrowRight size={14} />
                </span>
            </div>
        </button>
    );
}
