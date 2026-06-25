'use client';

// ReportUserDialog - Modal for reporting users/content
// Uses the createReportAction server action

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createReportAction } from '@/app/actions/report';
import { ActionRequirements } from '@/components/ui/ActionRequirements';
import { Button } from '@/components/ui';
import { AlertTriangleIcon, XIcon } from 'lucide-react';

type ReportCategory = 'SPAM' | 'HARASSMENT' | 'MISINFORMATION' | 'SAFETY_CONCERN' | 'GREENWASHING' | 'OTHER';
type ReportTargetType = 'USER' | 'COMMUNITY' | 'EVENT' | 'MESSAGE';

interface ReportUserDialogProps {
    targetId: string;
    targetType: ReportTargetType;
    targetName?: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const REPORT_CATEGORIES: ReportCategory[] = [
    'SPAM',
    'HARASSMENT',
    'MISINFORMATION',
    'SAFETY_CONCERN',
    'GREENWASHING',
    'OTHER'
];

export function ReportUserDialog({
    targetId,
    targetType,
    targetName,
    isOpen,
    onClose,
    onSuccess
}: Readonly<ReportUserDialogProps>) {
    const { t } = useTranslation(['common']);
    const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!selectedCategory) {
            setError(t('moderation.errors.categoryRequired'));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const result = await createReportAction(
                targetId,
                targetType,
                selectedCategory,
                description || undefined
            );

            if (result.success) {
                onSuccess?.();
                onClose();
                // Reset state
                setSelectedCategory(null);
                setDescription('');
            } else {
                setError(result.error || t('errors.generic'));
            }
        } catch {
            setError(t('errors.generic'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const reportRequirementsId = 'report-submit-requirements';
    const reportRequirements = [!selectedCategory ? t('common:actionRequirements.selectCategory') : null];

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
            setSelectedCategory(null);
            setDescription('');
            setError(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div // NOSONAR(S6848) — backdrop convenience mouse-dismiss; keyboard users close via the dialog's own close control — a native element here is a bogus tab stop
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Dialog */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {t('moderation.reportTitle')}
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <XIcon className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Target Info */}
                {targetName && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {targetType === 'USER' ? t('moderation.targetUser') : t('moderation.targetContent')}
                        <span className="font-medium text-gray-900 dark:text-white">{targetName}</span>
                    </p>
                )}

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t('moderation.reportDescription')}
                </p>

                {/* Category Selection */}
                <div className="space-y-2 mb-4">
                    {REPORT_CATEGORIES.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            disabled={isSubmitting}
                            className={`w-full p-3 text-left rounded-lg border transition-colors ${selectedCategory === category
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            {t(`categories.${category}`)}
                        </button>
                    ))}
                </div>

                {/* Additional Description */}
                <div className="mb-4">
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isSubmitting}
                        placeholder={t('moderation.reportPlaceholder')}
                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows={3}
                    />
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                        {error}
                    </div>
                )}

                <ActionRequirements id={reportRequirementsId} requirements={reportRequirements} className="mb-4" />

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="flex-1"
                    >
                        {t('actions.cancel')}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedCategory}
                        disabledReasonId={reportRequirements.some(Boolean) ? reportRequirementsId : undefined}
                        className="flex-1"
                    >
                        {isSubmitting ? t('actions.loading') : t('actions.submit')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
