'use client';

import { useTranslation } from 'react-i18next';
import { XIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Z_CLASS } from '@/lib/z-index';

// Layers panel component
export function LayersPanel({
    isOpen,
    onClose,
    layers,
    onToggleLayer
}: Readonly<{
    isOpen: boolean;
    onClose: () => void;
    layers: { id: string; label: string; enabled: boolean; icon: React.ReactNode }[];
    onToggleLayer: (layerId: string) => void;
}>) {
    const { t } = useTranslation('map');

    if (!isOpen) return null;

    return (
        <Card className={`absolute left-4 top-16 md:top-4 ${Z_CLASS.mapOverlay} w-64 shadow-lg top-[60px]`}>
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t('layers.title')}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                        <XIcon className="h-4 w-4" />
                    </button>
                </div>
                <div className="space-y-2">
                    {layers.map((layer) => (
                        <label
                            key={layer.id}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={layer.enabled}
                                onChange={() => onToggleLayer(layer.id)}
                                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                            />
                            {layer.icon}
                            <span className="text-sm text-gray-700 dark:text-gray-300">{layer.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        </Card>
    );
}
