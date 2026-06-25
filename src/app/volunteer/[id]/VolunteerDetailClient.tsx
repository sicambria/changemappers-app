'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  getVolunteerOpportunityAction,
  createVolunteerApplicationAction,
} from '@/app/actions/volunteer';
import { useValidationErrors } from '@/hooks/useValidationErrors';

interface Opportunity {
  id: string;
  title: string;
  summary: string;
  description: string | null;
  primaryRdgs: string[];
  additionalRdgs: string[];
  socialCauseTopics: string[];
  impactScale: string | null;
  format: string;
  location: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  isRemoteCapable: boolean;
  commitmentType: string;
  startDate: Date | null;
  endDate: Date | null;
  eventDate: Date | null;
  applicationDeadline: Date | null;
  rollingApplications: boolean;
  moreInfoUrl: string | null;
  weeklyHours: number | null;
  totalHours: number | null;
  shiftLength: string | null;
  timePreference: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  experienceLevel: string;
  beginnerFriendly: boolean;
  trainingProvided: boolean;
  ageSuitability: string | null;
  languageRequirements: string[];
  volunteersNeeded: number;
  teamBased: boolean;
  physicalEffort: string;
  physicalRequirements: string[];
  accessibilitySupported: string[];
  indoorOutdoor: string;
  weatherExposed: boolean;
  travelRequired: boolean;
  transportProvided: boolean;
  equipmentNeeded: string | null;
  dressCode: string | null;
  expectedImpact: string | null;
  impactMeasurement: string | null;
  backgroundCheckRequired: boolean;
  referencesRequired: boolean;
  codeOfConduct: boolean;
  workingWithVulnerable: boolean;
  supervisionLevel: string;
  riskLevel: string;
  requesterId: string;
  requesterType: string;
  organizationName: string | null;
  status: string;
  visibility: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  closedAt: Date | null;
  requester: { id: string; name: string; displayName: string | null; profilePhoto: string | null };
  applicationCount: number;
  applications: Array<{ id: string; status: string; volunteerId: string }>;
}

export function VolunteerDetailClient({ id }: Readonly<{ id: string }>) {
  const { t, i18n } = useTranslation('volunteer');
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }); // §1B: mirror latest t for effects/callbacks below; no deps array on purpose
  const dateLocale = i18n.resolvedLanguage || 'en';
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { formError, setErrors, clearErrors, getFieldError } = useValidationErrors();
  const [applying, setApplying] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [message, setMessage] = useState('');
  const [availability, setAvailability] = useState('');
  const [experience, setExperience] = useState('');

  useEffect(() => {
    async function loadOpportunity() {
      const result = await getVolunteerOpportunityAction(id);
      if (result.success) {
        setOpportunity(result.data);
      } else {
        const errorMsg = result.error ?? tRef.current('errors.notFound');
        setError(errorMsg);
      }
      setLoading(false);
    }
    loadOpportunity();
  }, [id]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplying(true);
    clearErrors();
    const result = await createVolunteerApplicationAction({
      opportunityId: id,
      message: message || undefined,
      availabilityDetails: availability || undefined,
      relevantExperience: experience || undefined,
    });
    setApplying(false);
    if (result.success) {
      setShowApplicationForm(false);
      const updated = await getVolunteerOpportunityAction(id);
      if (updated.success) setOpportunity(updated.data);
    } else {
      setErrors(result);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-400 dark:text-gray-500 text-center py-16">
            {t('browse.loading')}
          </p>
        </div>
      </main>
    );
  }

  if (error || !opportunity) {
    return (
      <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <p className="text-red-500 text-center py-16">{error || t('errors.notFound')}</p>
          <div className="text-center">
            <Link href="/volunteer" className="text-teal-600 hover:underline">
              {t('nav.browse')}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const spotsRemaining = opportunity.volunteersNeeded - opportunity.applicationCount;
  const displayName = opportunity.requester.displayName || opportunity.requester.name;

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <Link href="/volunteer" className="text-teal-600 hover:underline text-sm">
          &larr; {t('nav.browse')}
        </Link>

        <article className="mt-6">
          <header className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {opportunity.title}
              </h1>
              <span className="shrink-0 px-3 py-1 rounded-full text-sm font-medium bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300">
                {t(`format.${opportunity.format}`)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {opportunity.primaryRdgs.map((rdg) => (
                <span
                  key={rdg}
                  className="text-xs bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
                >
                  {rdg}
                </span>
              ))}
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {opportunity.summary}
            </p>

        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
          <span>
            {t('card.location')}: {opportunity.location || t('card.remote')}
          </span>
          <span>
            {t('card.timeCommitment')}: {t(`commitmentType.${opportunity.commitmentType}`)}
          </span>
          {opportunity.rollingApplications && (
            <span className="text-blue-600 dark:text-blue-400">
              {t('card.rollingApplications')}
            </span>
          )}
        </div>
          </header>

          {opportunity.description && (
            <section className="prose dark:prose-invert max-w-none mb-8">
              <h2>{t('request.basicInfo.descriptionLabel')}</h2>
              <p>{opportunity.description}</p>
            </section>
          )}

          <section className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('request.time.title')}
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {opportunity.startDate && (
                  <li>
                    {t('request.time.startDateLabel')}: {new Date(opportunity.startDate).toLocaleDateString(dateLocale)}
                  </li>
                )}
                {opportunity.endDate && (
                  <li>
                    {t('request.time.endDateLabel')}: {new Date(opportunity.endDate).toLocaleDateString(dateLocale)}
                  </li>
                )}
                {opportunity.eventDate && (
                  <li>
                    {t('request.time.eventDateLabel')}: {new Date(opportunity.eventDate).toLocaleDateString(dateLocale)}
                  </li>
                )}
                {opportunity.applicationDeadline && (
                  <li>
                    {t('request.time.deadlineLabel')}: {new Date(opportunity.applicationDeadline).toLocaleDateString(dateLocale)}
                  </li>
                )}
                {opportunity.weeklyHours && (
                  <li>
                    {t('request.time.weeklyHoursLabel')}: {t('card.hoursPerWeek', { count: opportunity.weeklyHours })}
                  </li>
                )}
                {opportunity.shiftLength && (
                  <li>
                    {t('request.time.shiftLengthLabel')}: {opportunity.shiftLength}
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('request.requirements.title')}
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  {t('request.requirements.experienceLevelLabel')}: {t(`experienceLevel.${opportunity.experienceLevel}`)}
                </li>
                {opportunity.beginnerFriendly && (
                  <li className="text-green-600 dark:text-green-400">{t('card.beginnerFriendly')}</li>
                )}
                {opportunity.trainingProvided && (
                  <li>{t('request.requirements.trainingProvidedLabel')}</li>
                )}
                {opportunity.requiredSkills.length > 0 && (
                  <li>
                    {t('request.requirements.requiredSkillsLabel')}: {opportunity.requiredSkills.join(', ')}
                  </li>
                )}
                {opportunity.languageRequirements.length > 0 && (
                  <li>
                    {t('request.requirements.languageRequirementsLabel')}: {opportunity.languageRequirements.join(', ')}
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('request.physical.title')}
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  {t('request.physical.effortLevelLabel')}: {t(`physicalEffort.${opportunity.physicalEffort}`)}
                </li>
                <li>
                  {t('request.physical.indoorOutdoorLabel')}: {t(`indoorOutdoor.${opportunity.indoorOutdoor}`)}
                </li>
                {opportunity.physicalRequirements.length > 0 && (
                  <li>
                    {t('request.physical.requirementsLabel')}: {opportunity.physicalRequirements.join(', ')}
                  </li>
                )}
                {opportunity.accessibilitySupported.length > 0 && (
                  <li>
                    {t('request.physical.accessibilityLabel')}: {opportunity.accessibilitySupported.join(', ')}
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('request.trust.title')}
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {opportunity.backgroundCheckRequired && <li>{t('request.trust.backgroundCheckLabel')}</li>}
                {opportunity.referencesRequired && <li>{t('request.trust.referencesLabel')}</li>}
                {opportunity.codeOfConduct && <li>{t('request.trust.codeOfConductLabel')}</li>}
                {opportunity.workingWithVulnerable && <li>{t('request.trust.vulnerableLabel')}</li>}
                <li>
                  {t('request.trust.supervisionLabel')}: {t(`supervisionLevel.${opportunity.supervisionLevel}`)}
                </li>
                <li>
                  {t('request.trust.riskLevelLabel')}: {t(`urgency.${opportunity.riskLevel}`)}
                </li>
              </ul>
            </div>
          </section>

          <section className="border-t border-gray-200 dark:border-gray-800 pt-6 mb-8">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {t('request.basicInfo.requesterTypeLabel')}
            </h3>
            <div className="flex items-center gap-4">
              {opportunity.requester.profilePhoto && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={opportunity.requester.profilePhoto}
                  alt={displayName || ''}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {opportunity.organizationName || displayName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t(`requesterType.${opportunity.requesterType}`)}
                </p>
              </div>
            </div>
          </section>

          <section className="border-t border-gray-200 dark:border-gray-800 pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {spotsRemaining > 0 ? (
                  <>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {spotsRemaining}
                    </span>{' '}
                    {t('card.spotsRemaining')}
                  </>
                ) : (
                  <span className="text-red-600 dark:text-red-400">{t('status.FULL')}</span>
                )}
              </div>

              {opportunity.status === 'PUBLISHED' && spotsRemaining > 0 && !showApplicationForm && (
                <button
                  onClick={() => setShowApplicationForm(true)}
                  className="px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium"
                >
                  {t('card.apply')}
                </button>
              )}
            </div>

            {showApplicationForm && (
              <form onSubmit={handleApply} className="mt-6 space-y-4 bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {t('application.title')}
                </h3>
                {formError && (
                  <p className="text-sm text-red-500">{formError}</p>
                )}
                {getFieldError('message') && (
                  <p className="text-xs text-red-400">{getFieldError('message')}</p>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('application.messageLabel')}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                    placeholder={t('application.messagePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('application.availabilityLabel')}
                  </label>
                  <input
                    type="text"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                    placeholder={t('application.availabilityPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('application.experienceLabel')}
                  </label>
                  <textarea
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                    placeholder={t('application.experiencePlaceholder')}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={applying}
                    className="px-6 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium"
                  >
                    {applying ? '...' : t('application.submit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowApplicationForm(false)}
                    className="px-6 py-2 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
                  >
                    {t('application.cancel')}
                  </button>
                </div>
              </form>
            )}
          </section>
        </article>
      </div>
    </main>
  );
}
