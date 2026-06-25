export const ONBOARDING_JOURNEY_STEPS = [
  {
    id: 'welcome',
    href: '/map',
    actionKey: 'browseMap',
  },
  {
    id: 'inner_condition',
    href: '/reflect',
    actionKey: 'openReflection',
  },
  {
    id: 'pitch',
    href: '/pitch',
    actionKey: 'writePitch',
  },
  {
    id: 'regenerative_practice',
    href: '/energy',
    actionKey: 'mapEnergy',
  },
  {
    id: 'failure_learning',
    href: '/stories',
    actionKey: 'shareStory',
  },
  {
    id: 'working_group',
    href: '/tasks',
    actionKey: 'findGroup',
  },
  {
    id: 'mutual_aid',
    href: '/contribute',
    actionKey: 'postAsk',
  },
  {
    id: 'energy_alignment',
    href: '/energy',
    actionKey: 'reviewEnergy',
  },
  {
    id: 'systems_connection',
    href: '/map',
    actionKey: 'findIntersection',
  },
  {
    id: 'friction_grace',
    href: '/glossary',
    actionKey: 'reviewLanguage',
  },
  {
    id: 'boundaries',
    href: '/profile?tab=settings',
    actionKey: 'reviewBoundaries',
  },
  {
    id: 'cycle_of_joy',
    href: '/reflect',
    actionKey: 'reflectJoy',
  },
] as const;

export type OnboardingJourneyStep = (typeof ONBOARDING_JOURNEY_STEPS)[number];
export type OnboardingJourneyStepId = OnboardingJourneyStep['id'];

export const ONBOARDING_JOURNEY_STEP_IDS = ONBOARDING_JOURNEY_STEPS.map((step) => step.id) as [
  OnboardingJourneyStepId,
  ...OnboardingJourneyStepId[],
];

export type OnboardingJourneyProgress = {
  totalSteps: number;
  completedCount: number;
  percentage: number;
  nextStep: OnboardingJourneyStep | null;
};

export function getOnboardingJourneyProgress(completedStepIds: readonly string[]): OnboardingJourneyProgress {
  const completedSet = new Set(completedStepIds);
  const completedCount = ONBOARDING_JOURNEY_STEPS.filter((step) => completedSet.has(step.id)).length;
  const nextStep = ONBOARDING_JOURNEY_STEPS.find((step) => !completedSet.has(step.id)) ?? null;

  return {
    totalSteps: ONBOARDING_JOURNEY_STEPS.length,
    completedCount,
    percentage: Math.round((completedCount / ONBOARDING_JOURNEY_STEPS.length) * 100),
    nextStep,
  };
}

export function isOnboardingJourneyStepId(stepId: string): stepId is OnboardingJourneyStepId {
  return ONBOARDING_JOURNEY_STEP_IDS.includes(stepId as OnboardingJourneyStepId);
}
