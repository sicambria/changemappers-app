'use client';

import Link from 'next/link';
import { ArrowRight, Globe, Info, Route, ShieldCheck, Sparkles, Sprout, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AboutPage() {
    const { t } = useTranslation('about');

    return (
        <div className="min-h-screen overflow-x-hidden bg-white">
            {/* Hero Section */}
            <header className="relative py-20 overflow-hidden">
                <div className="absolute inset-0 bg-emerald-50/50" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-sm font-medium mb-6 animate-fade-in">
                            <Info className="h-4 w-4" />
                            <span>{t('hero.badge')}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
                            {t('hero.title')}
                        </h1>
                        <p className="text-xl text-gray-600 leading-relaxed mb-8">
                            {t('hero.description')}
                        </p>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 space-y-24">
                {/* Core Pillar Links */}
                <section>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Internal Navigation */}
                        <div className="group p-8 rounded-2xl border border-gray-100 bg-white hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('pillars.stories.title')}</h2>
                            <p className="text-gray-600 mb-6">
                                {t('pillars.stories.description')}
                            </p>
                            <Link
                                href="/stories"
                                className="inline-flex items-center gap-2 font-semibold text-emerald-600 hover:text-emerald-700 hover:translate-x-1 transition-all"
                            >
                                {t('pillars.stories.link')} <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>

                        <div className="group p-8 rounded-2xl border border-gray-100 bg-white hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                                <Route className="h-6 w-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('pillars.roadmap.title')}</h2>
                            <p className="text-gray-600 mb-6">
                                {t('pillars.roadmap.description')}
                            </p>
                            <Link
                                href="/roadmap"
                                className="inline-flex items-center gap-2 font-semibold text-emerald-600 hover:text-emerald-700 hover:translate-x-1 transition-all"
                            >
                                {t('pillars.roadmap.link')} <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>

                        <div className="group p-8 rounded-2xl border border-gray-100 bg-white hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('pillars.governance.title')}</h2>
                            <p className="text-gray-600 mb-6">
                                {t('pillars.governance.description')}
                            </p>
                            <Link
                                href="/about/governance"
                                className="inline-flex items-center gap-2 font-semibold text-emerald-600 hover:text-emerald-700 hover:translate-x-1 transition-all"
                            >
                                {t('pillars.governance.link')} <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>

                        {/* External Links */}
                        <div className="group p-8 rounded-2xl border border-emerald-100 bg-emerald-50/30 hover:shadow-xl transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 mb-6 group-hover:rotate-12 transition-transform">
                                <Globe className="h-6 w-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('pillars.mainSite.title')}</h2>
                            <p className="text-gray-600 mb-6">
                                {t('pillars.mainSite.description')}
                            </p>
                            <a
                                href="https://changemappers.org/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 font-semibold text-emerald-600 hover:text-emerald-700 hover:translate-x-1 transition-all"
                            >
                                {t('pillars.mainSite.link')} <ArrowRight className="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                </section>

                {/* More About Us */}
                <section className="bg-gray-50 rounded-3xl p-8 md:p-12 border border-gray-100">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('moreAbout.sectionTitle')}</h2>
                        <p className="text-lg text-gray-600">
                            {t('moreAbout.sectionDescription')}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="flex gap-6">
                            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-500">
                                <Sprout className="h-7 w-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('moreAbout.story.title')}</h3>
                                <p className="text-gray-600 mb-4">
                                    {t('moreAbout.story.description')}
                                </p>
                                <a
                                    href="https://changemappers.org/about/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-600 font-medium hover:underline flex items-center gap-1"
                                >
                                    {t('moreAbout.story.link')} <ArrowRight className="h-3.5 w-3.5" />
                                </a>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-500">
                                <Users className="h-7 w-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('moreAbout.getInvolved.title')}</h3>
                                <p className="text-gray-600 mb-4">
                                    {t('moreAbout.getInvolved.description')}
                                </p>
                                <a
                                    href="https://changemappers.org/contribute/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-600 font-medium hover:underline flex items-center gap-1"
                                >
                                    {t('moreAbout.getInvolved.link')} <ArrowRight className="h-3.5 w-3.5" />
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* CTA Footer */}
            <footer className="py-20 bg-white border-t border-gray-100 text-center">
                <div className="mx-auto max-w-3xl px-4">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('cta.title')}</h2>
                    <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                        {t('cta.description')}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/register"
                            className="w-full sm:w-auto px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 hover:shadow-lg transition-all"
                        >
                            {t('cta.register')}
                        </Link>
                        <Link
                            href="/login"
                            className="w-full sm:w-auto px-8 py-3 text-gray-700 font-bold border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                        >
                            {t('cta.login')}
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
