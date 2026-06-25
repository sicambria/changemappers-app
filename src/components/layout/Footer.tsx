'use client';

// Footer component with links and copyright

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export function Footer() {
    const { t } = useTranslation('common');

  const footerLinks = [
    { href: 'https://changemappers.org/', label: t('footer.mission') },
    { href: 'https://changemappers.org/about', label: t('footer.about') },
    { href: 'https://changemappers.org/contribute', label: t('footer.contribute') },
    { href: '/privacy', label: t('footer.privacy') },
    { href: '/legal/terms', label: t('footer.terms') },
    { href: '/legal/impressum', label: t('footer.impressum') },
    { href: 'https://changemappers.org/opendata', label: t('footer.openData') },
    { href: 'https://changemappers.substack.com/', label: t('footer.newsletter') },
    { href: '/help', label: t('footer.help') },
  ];

    return (
        <footer className="border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    {/* Logo and tagline */}
                    <div className="flex flex-col items-center sm:items-start">
                        <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            {t('appName')}
                        </span>
                        <span className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {t('appTagline')}
                        </span>
                    </div>

                    {/* Links */}
                    <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                        {footerLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                target={link.href.startsWith('http') ? '_blank' : undefined}
                                rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                                className="text-sm text-gray-600 hover:text-emerald-600 transition-colors dark:text-gray-400 dark:hover:text-emerald-400"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Copyright */}
                <div className="mt-6 border-t border-gray-200 pt-6 text-center dark:border-gray-800">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('footer.copyright', { year: new Date().getFullYear() })}
                    </p>
                </div>
            </div>
        </footer>
    );
}
