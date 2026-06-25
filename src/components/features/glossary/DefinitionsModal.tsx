'use client';

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { XIcon, BookOpenIcon } from 'lucide-react';
import { Z_CLASS } from '@/lib/z-index';

interface DefinitionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTerm?: string;
}

export function DefinitionsModal({ isOpen, onClose, initialTerm }: Readonly<DefinitionsModalProps>) {
    const { t } = useTranslation('common');

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 ${Z_CLASS.modalOverlay} flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm`}>
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                    aria-label={t('actions.close')}
                >
                    <XIcon className="h-5 w-5" />
                </button>

                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <BookOpenIcon className="h-6 w-6 text-emerald-600" />
                        {t('definitions.title')}
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-8">

                    {/* Okoarc */}
                    <section id="okoarc" className={`scroll-mt-4 ${initialTerm === 'OKOARC' ? 'bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg' : ''}`}>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <span className="text-2xl">🌱</span> {t('definitions.okoarc.title')}
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            {t('definitions.okoarc.description')}
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                            <li><strong>{t('definitions.labels.focus')}:</strong> {t('definitions.okoarc.focus')}</li>
                            <li><strong>{t('definitions.labels.goal')}:</strong> {t('definitions.okoarc.goal')}</li>
                            <li><strong>{t('definitions.labels.characteristics')}:</strong> {t('definitions.okoarc.characteristics')}</li>
                        </ul>
                    </section>

                    <hr className="border-gray-200 dark:border-gray-800" />

                    {/* Koma */}
                    <section id="koma" className={`scroll-mt-4 ${initialTerm === 'KOMA' ? 'bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg' : ''}`}>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <span className="text-2xl">🌳</span> {t('definitions.koma.title')}
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            {t('definitions.koma.description')}
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                            <li><strong>{t('definitions.labels.focus')}:</strong> {t('definitions.koma.focus')}</li>
                            <li><strong>{t('definitions.labels.goal')}:</strong> {t('definitions.koma.goal')}</li>
                            <li><strong>{t('definitions.labels.characteristics')}:</strong> {t('definitions.koma.characteristics')}</li>
                        </ul>
                    </section>

                    <div className="pt-6">
                        <Button onClick={onClose} className="w-full">{t('actions.close')}</Button>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
