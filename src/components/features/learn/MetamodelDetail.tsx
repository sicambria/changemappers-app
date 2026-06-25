'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    X, Globe, Layers, Tag, Users, Lightbulb, AlertTriangle,
    MessageSquare, ArrowRight, BookOpen, Zap
} from 'lucide-react';
import { type Metamodel, getCategoryColors, CATEGORY_SLUG } from './metamodels.config';

// --------------------------------------------------------------------------
// Section within detail view
// --------------------------------------------------------------------------
function DetailSection({ icon, label, children }: Readonly<{
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
}>) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-emerald-600">{icon}</span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</h4>
            </div>
            <div className="text-sm text-gray-700 leading-relaxed pl-6">{children}</div>
        </div>
    );
}

// --------------------------------------------------------------------------
// Expanded detail panel
// --------------------------------------------------------------------------
export function MetamodelDetail({ model, onClose }: Readonly<{ model: Metamodel; onClose: () => void }>) {
    const { t } = useTranslation('common');
    const colors = getCategoryColors(model.category);
    const categoryLabel = t(`metamodels.categories.${CATEGORY_SLUG[model.category] ?? 'cosmic'}`, model.category);

    return (
        <div // NOSONAR(S6848) — backdrop convenience mouse-dismiss; keyboard users close via the dialog's own close control — a native element here is a bogus tab stop
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-100">
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>

                {/* Header strip */}
                <div className={`${colors.bg} ${colors.border} border-b px-8 pt-8 pb-6`}>
                    <span className={`inline-block px-3 py-1 mb-3 text-xs font-bold uppercase tracking-wider rounded-full ${colors.bg} ${colors.text} ${colors.border} border`}>
                        {categoryLabel}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2 leading-tight">{model.name}</h2>
                    <p className="text-sm text-gray-500">{model.origin}</p>
                </div>

                {/* Key quote */}
                <div className="px-8 py-5 bg-gray-50 border-b border-gray-100">
                    <blockquote className="text-base italic text-gray-600 border-l-4 border-emerald-400 pl-4 leading-relaxed">
                        &ldquo;{model.keyQuote}&rdquo;
                    </blockquote>
                </div>

                {/* Body */}
                <div className="px-8 py-6 flex flex-col gap-6">
                    {/* Meta tags */}
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <Globe size={14} className="text-emerald-500" />
                            <span>{model.region}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <Layers size={14} className="text-emerald-500" />
                            <span>{model.nativeScale.map((s) => t(`metamodels.nativeScales.${s}`, s)).join(' · ')}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <BookOpen size={14} className="text-emerald-500" />
                            <span>{model.originTradition}</span>
                        </div>
                        {model.originYear !== null && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                                <span className="text-emerald-500 font-bold text-xs">⌚</span>
                                <span>{model.originYear < 0 ? `${Math.abs(model.originYear)} ${t('metamodels.bce')}` : model.originYear}</span>
                            </div>
                        )}
                    </div>

                    <DetailSection icon={<Zap size={15} />} label={t('metamodels.coreMechanism')}>
                        {model.coreMechanism}
                    </DetailSection>

                    <DetailSection icon={<Globe size={15} />} label={t('metamodels.applicability')}>
                        {model.applicability}
                    </DetailSection>

                    <DetailSection icon={<AlertTriangle size={15} />} label={t('metamodels.limitations')}>
                        {model.limitations}
                    </DetailSection>

                    <DetailSection icon={<MessageSquare size={15} />} label={t('metamodels.critics')}>
                        {model.critics}
                    </DetailSection>

                    <DetailSection icon={<Lightbulb size={15} />} label={t('metamodels.changemakerApplications')}>
                        {model.changemakerUse}
                    </DetailSection>

                    {/* Pairs with */}
                    {model.pairsWith.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <ArrowRight size={15} className="text-emerald-600" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('metamodels.pairsWith')}</h4>
                            </div>
                            <div className="flex flex-wrap gap-2 pl-6">
                                {model.pairsWith.map((p) => (
                                    <span key={p} className="px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Applicable for */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Users size={15} className="text-emerald-600" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('metamodels.applicableFor')}</h4>
                        </div>
                        <div className="flex flex-wrap gap-2 pl-6">
                            {model.applicableFor.map((a) => (
                                <span key={a} className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">
                                    {t(`metamodels.applicableForLabels.${a}`, a)}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Tag size={15} className="text-emerald-600" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('metamodels.tags')}</h4>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pl-6">
                            {model.tags.map((tag) => (
                                <span key={tag} className="px-2 py-0.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Domains */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Layers size={15} className="text-emerald-600" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('metamodels.domains')}</h4>
                        </div>
                        <div className="flex flex-wrap gap-2 pl-6">
                            {model.domains.map((d) => (
                                <span key={d} className="px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                                    {t(`metamodels.domainLabels.${d}`, d)}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
