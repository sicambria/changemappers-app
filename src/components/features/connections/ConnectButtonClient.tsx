'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConnectionType } from '@/lib/prisma-shared';
import { ConnectModal } from './ConnectModal';

interface ConnectButtonClientProps {
    targetId: string;
    targetName: string;
    relationshipCategory: string; // From MatchResult: MENTOR_MENTEE, COMPLEMENTARY, FELLOW_TRAVELLER, PEER
}

export function ConnectButtonClient({ targetId, targetName, relationshipCategory }: Readonly<ConnectButtonClientProps>) {
    const { t } = useTranslation('common');
    const [isHovered, setIsHovered] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Map the Matchmaking category to a DB ConnectionType mapping
    let connectionType: ConnectionType = 'GENERAL';
    let label = t('connections.sendNomination');

    switch (relationshipCategory) {
        case 'MENTOR_MENTEE':
            connectionType = 'MENTORING';
            label = t('connections.requestMentor');
            break;
        case 'FELLOW_TRAVELLER':
        case 'PEER':
            connectionType = 'PEER_LEARNING';
            label = t('connections.addAsCompanion');
            break;
        case 'COMPLEMENTARY':
            connectionType = 'SUPPORT';
            label = t('connections.supportiveLink');
            break;
    }

    return (
        <>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    setIsModalOpen(true);
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`w-full py-2.5 px-4 text-sm font-semibold rounded-xl border transition-all duration-200 
                    ${isHovered
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md transform -translate-y-0.5'
                        : 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:border-emerald-300'
                    }`}
            >
                {label}
            </button>

            <ConnectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                targetId={targetId}
                targetName={targetName}
                connectionType={connectionType}
            />
        </>
    );
}
