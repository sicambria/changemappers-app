'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import { saveArchetypeAction } from '@/app/actions/onboarding';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';

const ROLE_LABEL_TO_ENUM: Record<string, string> = {
  WEAVER: 'WEAVER',
  BUILDER: 'BUILDER',
  CAREGIVER: 'CAREGIVER',
  EXPERIMENTER: 'EXPERIMENTER',
  CATALYST: 'CATALYST',
};

const PRESENCE_LABEL_TO_ENUM: Record<string, string> = {
  PERMANENT_RESIDENT: 'PERMANENT_RESIDENT',
  LONG_TERM_STAY: 'LONG_TERM_STAY',
  PROJECT_BASED: 'PROJECT_BASED',
  VIRTUAL: 'VIRTUAL',
  OPEN: 'OPEN',
};

const ROLE_OPTIONS = ['WEAVER', 'BUILDER', 'CAREGIVER', 'EXPERIMENTER', 'CATALYST'];
const PRESENCE_OPTIONS = ['PERMANENT_RESIDENT', 'LONG_TERM_STAY', 'PROJECT_BASED', 'VIRTUAL', 'OPEN'];

interface Props {
  userId: string;
  cmapLevel: number;
  onSuccess: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

export default function Stage45Archetype({ userId, cmapLevel, onSuccess, onBack, onSkip }: Readonly<Props>) {
    const { t } = useTranslation(['auth', 'common']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [_error, setError] = useState<string | null>(null);
    const [revealedArchetype, setRevealedArchetype] = useState<string | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [archetypeAnswers, setArchetypeAnswers] = useState<Record<string, any>>({
        roles: [],
        internalExternal: 5,
        secularSpiritual: 5,
        decisionMaking: null,
        resourceSharing: null,
        comfortLevel: 5,
        socialIntimacy: null,
        communityPresence: [],
        communitySize: null,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleArchetypeUpdate = (key: string, value: any) => {
        setArchetypeAnswers(prev => ({ ...prev, [key]: value }));
    };

  const handleStage4_5 = async () => {
    // No mandatory validation — all fields in this stage are optional at registration.
    // These fields are deferred to later flows (finding allies, mentoring, volunteering).
    setIsSubmitting(true);
    setError(null);
    try {
      const enumRoles = (archetypeAnswers.roles as string[]).map(
        role => ROLE_LABEL_TO_ENUM[role] || role
      );
      const enumPresence = (archetypeAnswers.communityPresence as string[]).map(
        presence => PRESENCE_LABEL_TO_ENUM[presence] || presence
      );

      const res = await saveArchetypeAction({
        roles: enumRoles,
        internalExternal: archetypeAnswers.internalExternal,
        secularSpiritual: archetypeAnswers.secularSpiritual,
        decisionMaking: archetypeAnswers.decisionMaking,
        resourceSharing: archetypeAnswers.resourceSharing,
        comfortLevel: archetypeAnswers.comfortLevel,
        socialIntimacy: archetypeAnswers.socialIntimacy,
        communityPresence: enumPresence,
        communitySize: archetypeAnswers.communitySize,
      }, userId);
      if (res.success) {
        // Only reveal archetype if roles were actually filled in
        if (res.calculatedArchetype && enumRoles.length > 0) {
          setRevealedArchetype(res.calculatedArchetype);
        } else {
          onSuccess();
        }
      } else {
        setError(res.error || t('onboarding.errors.saveFailed'));
      }
    } catch {
      setError(t('onboarding.errors.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

    if (revealedArchetype) {
        return (
            <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500 py-8">
                <div className="mx-auto w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                </div>
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">{t('onboarding.stage4_5.revealLabel')}</h2>
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">{revealedArchetype}</h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                        {t('onboarding.stage4_5.revealDescription')}
                    </p>
                </div>
                <Button onClick={onSuccess} data-testid="onboarding-stage45-reveal-next" className="w-full sm:w-auto px-8 py-6 text-lg mt-8 shadow-xl shadow-emerald-500/20">
                    {t('onboarding.stage4_5.revealNextButton')} <ArrowRightIcon className="h-5 w-5 ml-2" />
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('onboarding.stage4_5.title')}</h2>
                <p className="text-sm text-gray-500 mt-1">{t('onboarding.stage4_5.subtitle')}</p>
                {onSkip && (
                    <p className="text-xs text-gray-400 mt-2 italic">
                        {t('onboarding.stage4_5.optionalHint')}
                    </p>
                )}
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">{t('onboarding.stage4_5.q1_roles')}</label>
                    <div className="flex flex-wrap gap-2">
                        {ROLE_OPTIONS.map(role => (
                            <button key={role} type="button"
                                data-testid={`onboarding-stage45-role-${role}`}
                                onClick={() => {
                                    const current = archetypeAnswers.roles as string[];
                                    if (current.includes(role)) {
                                        handleArchetypeUpdate('roles', current.filter(r => r !== role));
                                    } else if (current.length < 2) {
                                        handleArchetypeUpdate('roles', [...current, role]);
                                    }
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${archetypeAnswers.roles.includes(role) ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                                {t(`onboarding.stage4_5.rolesList.${role}`)}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">{t('onboarding.stage4_5.q2_internalExternal')}</label>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500 w-24 text-right">{t('onboarding.stage4_5.q2_low')}</span>
                        <input type="range" min="1" max="10" value={archetypeAnswers.internalExternal} onChange={e => handleArchetypeUpdate('internalExternal', Number.parseInt(e.target.value))}className="flex-1 accent-emerald-500" />
                        <span className="text-xs text-gray-500 w-24">{t('onboarding.stage4_5.q2_high')}</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">{t('onboarding.stage4_5.q3_secularSpiritual')}</label>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500 w-24 text-right">{t('onboarding.stage4_5.q3_low')}</span>
                        <input type="range" min="1" max="10" value={archetypeAnswers.secularSpiritual} onChange={e => handleArchetypeUpdate('secularSpiritual', Number.parseInt(e.target.value))}className="flex-1 accent-emerald-500" />
                        <span className="text-xs text-gray-500 w-24">{t('onboarding.stage4_5.q3_high')}</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">{t('onboarding.stage4_5.q4_decisionMaking')}</label>
                    <select value={archetypeAnswers.decisionMaking || ''} onChange={e => handleArchetypeUpdate('decisionMaking', e.target.value)} className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm">
                        <option value="">{t('onboarding.stage4_5.q4_placeholder')}</option>
                        <option value="hierarchical">{t('onboarding.stage4_5.q4_hierarchical')}</option>
                        <option value="sociocratic">{t('onboarding.stage4_5.q4_sociocratic')}</option>
                        <option value="consensus">{t('onboarding.stage4_5.q4_consensus')}</option>
                        <option value="anarchy">{t('onboarding.stage4_5.q4_anarchy')}</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">{t('onboarding.stage4_5.q5_comfort')}</label>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500 w-24 text-right">{t('onboarding.stage4_5.q5_low')}</span>
                        <input type="range" min="1" max="10" value={archetypeAnswers.comfortLevel} onChange={e => handleArchetypeUpdate('comfortLevel', Number.parseInt(e.target.value))}className="flex-1 accent-emerald-500" />
                        <span className="text-xs text-gray-500 w-24">{t('onboarding.stage4_5.q5_high')}</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">{t('onboarding.stage4_5.resourceSharing.label')}</label>
                    <select value={archetypeAnswers.resourceSharing || ''} onChange={e => handleArchetypeUpdate('resourceSharing', e.target.value)} className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm">
                        <option value="">{t('onboarding.stage4_5.resourceSharing.placeholder')}</option>
                        <option value="SHARED_TREASURY">{t('onboarding.stage4_5.resourceSharing.sharedTreasury')}</option>
                        <option value="CONTRIBUTION">{t('onboarding.stage4_5.resourceSharing.contribution')}</option>
                        <option value="PRIVATE">{t('onboarding.stage4_5.resourceSharing.private')}</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">{t('onboarding.stage4_5.socialIntimacy.label')}</label>
                    <select value={archetypeAnswers.socialIntimacy || ''} onChange={e => handleArchetypeUpdate('socialIntimacy', e.target.value)} className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm">
                        <option value="">{t('onboarding.stage4_5.socialIntimacy.placeholder')}</option>
                        <option value="RADICAL_TRANSPARENCY">{t('onboarding.stage4_5.socialIntimacy.radicalTransparency')}</option>
                        <option value="CAMARADERIE">{t('onboarding.stage4_5.socialIntimacy.camaraderie')}</option>
                        <option value="PROFESSIONAL">{t('onboarding.stage4_5.socialIntimacy.professional')}</option>
                    </select>
                </div>

                {cmapLevel >= 3 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">{t('onboarding.stage4_5.q6_presence')}</label>
                        <div className="flex flex-wrap gap-2">
                            {PRESENCE_OPTIONS.map(opt => (
                                <button key={opt} type="button"
                                    onClick={() => {
                                        const current = archetypeAnswers.communityPresence as string[];
                                        handleArchetypeUpdate('communityPresence', current.includes(opt) ? current.filter(o => o !== opt) : [...current, opt]);
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${archetypeAnswers.communityPresence.includes(opt) ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-white border-gray-300 text-gray-700'}`}
                                >
                                    {t(`onboarding.stage4_5.presenceList.${opt}`)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={onBack} className="flex-1">
                    <ArrowLeftIcon className="h-4 w-4 mr-2" /> {t('onboarding.stage4_5.backButton')}
                </Button>
                <Button onClick={handleStage4_5} isLoading={isSubmitting} className="flex-1" data-testid="onboarding-stage45-submit">
                    {t('onboarding.stage4_5.nextButton')} <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
            </div>
            {onSkip && (
                <button type="button" onClick={onSkip} className="w-full text-center text-xs text-gray-400 hover:text-emerald-500 mt-2">
                    {t('onboarding.stage4_5.skipButton')}
                </button>
            )}
        </div>
    );
}
