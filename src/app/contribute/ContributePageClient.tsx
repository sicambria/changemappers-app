'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Gift, HandHeart, HeartHandshake, LinkIcon, PlusCircle, Search, type LucideIcon } from 'lucide-react';
import { VolunteerBrowseClient, type VolunteerOpportunityListItem } from '@/app/volunteer/VolunteerBrowseClient';
import type { VolunteerOpportunityFilterInput } from '@/lib/validations/volunteer';

interface HubAction {
  href: string;
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
}

interface ContributePageClientProps {
  initialVolunteerOpportunities: VolunteerOpportunityListItem[];
  initialVolunteerTotal: number;
  initialVolunteerFilters: VolunteerOpportunityFilterInput;
}

const contributionActions: HubAction[] = [
  {
    href: '/contribute/offer/new',
    icon: Gift,
    titleKey: 'landing.offerCard.title',
    descriptionKey: 'landing.offerCard.description',
  },
  {
    href: '/contribute/request/new',
    icon: HandHeart,
    titleKey: 'landing.requestCard.title',
    descriptionKey: 'landing.requestCard.description',
  },
  {
    href: '/contribute/find',
    icon: Search,
    titleKey: 'landing.browseCard.title',
    descriptionKey: 'landing.browseCard.description',
  },
  {
    href: '/contribute/connections',
    icon: LinkIcon,
    titleKey: 'landing.connectionsCard.title',
    descriptionKey: 'landing.connectionsCard.description',
  },
  {
    href: '/contribute/my-requests',
    icon: HeartHandshake,
    titleKey: 'landing.myRequestsCard.title',
    descriptionKey: 'landing.myRequestsCard.description',
  },
];

const volunteerActions: HubAction[] = [
  {
    href: '/volunteer',
    icon: HeartHandshake,
    titleKey: 'landing.volunteerBrowseCard.title',
    descriptionKey: 'landing.volunteerBrowseCard.description',
  },
  {
    href: '/volunteer/new',
    icon: PlusCircle,
    titleKey: 'landing.volunteerPostCard.title',
    descriptionKey: 'landing.volunteerPostCard.description',
  },
];

function ActionCard({ action }: Readonly<{ action: HubAction }>) {
  const { t } = useTranslation('contribute');
  const Icon = action.icon;

  return (
    <Link
      href={action.href}
      className="block rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors bg-white dark:bg-gray-900"
    >
      <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mb-3" aria-hidden="true" />
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{t(action.titleKey)}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t(action.descriptionKey)}
      </p>
    </Link>
  );
}

export default function ContributePageClient({
  initialVolunteerOpportunities,
  initialVolunteerTotal,
  initialVolunteerFilters,
}: Readonly<ContributePageClientProps>) {
  const { t } = useTranslation('contribute');

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-12">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            {t('landing.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {t('landing.subtitle')}
          </p>
        </header>

        <section aria-labelledby="contribution-actions-heading">
          <div className="mb-5">
            <h2 id="contribution-actions-heading" className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t('landing.contributionSection.title')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {t('landing.contributionSection.subtitle')}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {contributionActions.map((action) => (
              <ActionCard key={action.href} action={action} />
            ))}
          </div>
        </section>

        <section aria-labelledby="volunteer-actions-heading">
          <div className="mb-5">
            <h2 id="volunteer-actions-heading" className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t('landing.volunteerSection.title')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {t('landing.volunteerSection.subtitle')}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {volunteerActions.map((action) => (
              <ActionCard key={action.href} action={action} />
            ))}
          </div>
        </section>

        <VolunteerBrowseClient
          embedded
          initialOpportunities={initialVolunteerOpportunities}
          initialTotal={initialVolunteerTotal}
          initialFilters={initialVolunteerFilters}
        />
      </div>
    </main>
  );
}
