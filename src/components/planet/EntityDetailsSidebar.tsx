'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, X } from 'lucide-react';
import type { MapEntity } from '@/app/actions/map';
import { safeAvatarCssUrl } from '@/lib/safe-avatar-url';
import {
    ARCHETYPE_LABELS,
    availabilityGroups,
    compactList,
    entityDetailActionLabel,
    entityDetailHref,
    entityTypeLabel,
    formatCoordinate,
    rdgLabel,
} from '@/lib/planet-entity-helpers';
import { ChipList, DetailRow, DetailSection, EntityTypeIcon } from './PlanetDetailPrimitives';

export function EntityDetailsSidebar({ entity, onClose }: Readonly<{ entity: MapEntity; onClose: () => void }>) {
    const { t } = useTranslation('map');
    const avatar = safeAvatarCssUrl(entity.avatar);
    const initials = entity.name.charAt(0).toUpperCase();
    const latitude = formatCoordinate(entity.latitude);
    const longitude = formatCoordinate(entity.longitude);
    const archetypes = compactList(entity.archetypes).map((item) => ARCHETYPE_LABELS[item] ?? item);
    const rdgs = compactList(entity.rdgAreas).map(rdgLabel);
    const skills = compactList(entity.skills);
    const offers = compactList(entity.offers);
    const needs = compactList(entity.needs);
    const values = compactList(entity.values);
    const tags = compactList(entity.tags);
    const availability = availabilityGroups(entity.availabilityDetails).flatMap(([group, items]) =>
        compactList(items, 4).map((item) => `${group}: ${item}`),
    );

    return (
        <aside
            className="absolute bottom-0 right-0 top-0 z-20 w-full max-w-sm overflow-y-auto border-l border-white/15 bg-white shadow-2xl pointer-events-auto dark:bg-slate-950 sm:right-4 sm:top-4 sm:bottom-4 sm:rounded-lg sm:border"
            data-testid="planet-details-sidebar"
        >
            <div className="bg-slate-950 p-4 text-white">
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div
                            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-white/80 bg-sky-500 text-lg font-bold shadow"
                            style={{ background: avatar ? `url('${avatar}') center/cover no-repeat, #38bdf8` : '#38bdf8' }}
                        >
                            {!avatar && initials}
                        </div>
                        <div className="min-w-0">
                            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-sky-200">
                                <EntityTypeIcon type={entity.type} />
                                {entityTypeLabel(entity, t)}
                            </p>
                            <h2 className="truncate text-lg font-semibold">{entity.name}</h2>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label={t('planet.closePopup')}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <Link
                    href={entityDetailHref(entity)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-600"
                >
                    {entityDetailActionLabel(entity, t)}
                    <ArrowUpRight className="h-4 w-4" />
                </Link>
            </div>

            <div className="space-y-5 p-4">
                {entity.description && (
                    <DetailSection title={t('planet.detailsAbout')}>
                        <p className="text-sm leading-6 text-slate-700 dark:text-white/75">{entity.description}</p>
                    </DetailSection>
                )}

                <DetailSection title={t('planet.detailsLocation')}>
                    <div className="rounded-md border border-slate-200 px-3 dark:border-white/10">
                        <DetailRow label={t('planet.latitude')} value={latitude} />
                        <DetailRow label={t('planet.longitude')} value={longitude} />
                    </div>
                </DetailSection>

                <DetailSection title={t('planet.detailsProfile')}>
                    <div className="rounded-md border border-slate-200 px-3 dark:border-white/10">
                        <DetailRow label={t('planet.changemakeLevel')} value={entity.changemakeLevel} />
                        <DetailRow label={t('planet.communityType')} value={entity.communityType} />
                        <DetailRow label={t('planet.eventType')} value={entity.eventType} />
                        <DetailRow label={t('planet.issueCategory')} value={entity.issueCategory} />
                        <DetailRow label={t('planet.issueSeverity')} value={entity.issueSeverity} />
                        <DetailRow label={t('planet.signalDomain')} value={entity.signalDomain} />
                        <DetailRow label={t('planet.signalConfidence')} value={entity.signalConfidence} />
                        <DetailRow label={t('planet.signalNovelty')} value={entity.signalNovelty} />
                    </div>
                </DetailSection>

                <DetailSection title={t('planet.detailsArchetypes')}>
                    <ChipList values={archetypes} tone="sky" />
                </DetailSection>
                <DetailSection title={t('planet.detailsRdgs')}>
                    <ChipList values={rdgs} tone="emerald" />
                </DetailSection>
                <DetailSection title={t('planet.detailsSkills')}>
                    <ChipList values={skills} tone="slate" />
                </DetailSection>
                <DetailSection title={t('planet.detailsOffers')}>
                    <ChipList values={offers} tone="amber" />
                </DetailSection>
                <DetailSection title={t('planet.detailsNeeds')}>
                    <ChipList values={needs} tone="rose" />
                </DetailSection>
                <DetailSection title={t('planet.detailsValues')}>
                    <ChipList values={values} tone="emerald" />
                </DetailSection>
                <DetailSection title={t('planet.detailsAvailability')}>
                    <ChipList values={availability} tone="slate" />
                </DetailSection>
                <DetailSection title={t('planet.detailsTags')}>
                    <ChipList values={tags} tone="slate" />
                </DetailSection>
            </div>
        </aside>
    );
}
