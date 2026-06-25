'use client';

// i18n configuration for Changemappers
// Supports English (default), Hungarian and Spanish

import i18n from 'i18next';

// Hungarian translations
import huCommon from '@/locales/hu/common.json';
import huAuth from '@/locales/hu/auth.json';
import huProfiles from '@/locales/hu/profiles.json';
import huCommunities from '@/locales/hu/communities.json';
import huFeedback from '@/locales/hu/feedback.json';
import huMap from '@/locales/hu/map.json';
import huEvents from '@/locales/hu/events.json';
import huRoadmap from '@/locales/hu/roadmap.json';
import huStories from '@/locales/hu/stories.json';
import huReflect from '@/locales/hu/reflect.json';
import huAbout from '@/locales/hu/about.json';
import huAdmin from '@/locales/hu/admin.json';
import huFeed from '@/locales/hu/feed.json';
import huTraining from '@/locales/hu/training.json';
import huMentor from '@/locales/hu/mentor.json';
import huPeer from '@/locales/hu/peer.json';
import huCoaching from '@/locales/hu/coaching.json';
import huContribute from '@/locales/hu/contribute.json';
import huCanvas from '@/locales/hu/canvas.json';
import huCoordinate from '@/locales/hu/coordinate.json';
import huModalities from '@/locales/hu/modalities.json';
import huGrowth from '@/locales/hu/growth.json';
import huVolunteer from '@/locales/hu/volunteer.json';
import huScheduling from '@/locales/hu/scheduling.json';
import huValidation from '@/locales/hu/validation.json';
import huEnergy from '@/locales/hu/energy.json';
import huSocialIssues from '@/locales/hu/social-issues.json';
import huCoachme from '@/locales/hu/coachme.json';
import huGlossary from '@/locales/hu/glossary.json';
import huKanban from '@/locales/hu/kanban.json';
import huMeet from '@/locales/hu/meet.json';
import huGraph from '@/locales/hu/graph.json';
import huHealth from '@/locales/hu/health.json';
import huTools from '@/locales/hu/tools.json';
import huLearning from '@/locales/hu/learning.json';
import huSignals from '@/locales/hu/signals.json';
import huOnboardingJourney from '@/locales/hu/onboardingJourney.json';
import huRegister from '@/locales/hu/register.json';
import huDashboard from '@/locales/hu/dashboard.json';
import huQuestionnaires from '@/locales/hu/questionnaires.json';
import huPitch from '@/locales/hu/pitch.json';
import huLegal from '@/locales/hu/legal.json';
import huActions from '@/locales/hu/actions.json';

// English translations
import enCommon from '@/locales/en/common.json';
import enAuth from '@/locales/en/auth.json';
import enProfiles from '@/locales/en/profiles.json';
import enCommunities from '@/locales/en/communities.json';
import enFeedback from '@/locales/en/feedback.json';
import enMap from '@/locales/en/map.json';
import enEvents from '@/locales/en/events.json';
import enRoadmap from '@/locales/en/roadmap.json';
import enStories from '@/locales/en/stories.json';
import enReflect from '@/locales/en/reflect.json';
import enAbout from '@/locales/en/about.json';
import enAdmin from '@/locales/en/admin.json';
import enFeed from '@/locales/en/feed.json';
import enTraining from '@/locales/en/training.json';
import enMentor from '@/locales/en/mentor.json';
import enPeer from '@/locales/en/peer.json';
import enCoaching from '@/locales/en/coaching.json';
import enContribute from '@/locales/en/contribute.json';
import enCanvas from '@/locales/en/canvas.json';
import enCoordinate from '@/locales/en/coordinate.json';
import enModalities from '@/locales/en/modalities.json';
import enGrowth from '@/locales/en/growth.json';
import enVolunteer from '@/locales/en/volunteer.json';
import enScheduling from '@/locales/en/scheduling.json';
import enValidation from '@/locales/en/validation.json';
import enEnergy from '@/locales/en/energy.json';
import enSocialIssues from '@/locales/en/social-issues.json';
import enCoachme from '@/locales/en/coachme.json';
import enGlossary from '@/locales/en/glossary.json';
import enKanban from '@/locales/en/kanban.json';
import enMeet from '@/locales/en/meet.json';
import enGraph from '@/locales/en/graph.json';
import enHealth from '@/locales/en/health.json';
import enTools from '@/locales/en/tools.json';
import enLearning from '@/locales/en/learning.json';
import enSignals from '@/locales/en/signals.json';
import enOnboardingJourney from '@/locales/en/onboardingJourney.json';
import enRegister from '@/locales/en/register.json';
import enDashboard from '@/locales/en/dashboard.json';
import enQuestionnaires from '@/locales/en/questionnaires.json';
import enPitch from '@/locales/en/pitch.json';
import enLegal from '@/locales/en/legal.json';
import enActions from '@/locales/en/actions.json';

// Spanish translations
import esCommon from '@/locales/es/common.json';
import esAuth from '@/locales/es/auth.json';
import esProfiles from '@/locales/es/profiles.json';
import esCommunities from '@/locales/es/communities.json';
import esFeedback from '@/locales/es/feedback.json';
import esMap from '@/locales/es/map.json';
import esEvents from '@/locales/es/events.json';
import esRoadmap from '@/locales/es/roadmap.json';
import esStories from '@/locales/es/stories.json';
import esReflect from '@/locales/es/reflect.json';
import esAbout from '@/locales/es/about.json';
import esAdmin from '@/locales/es/admin.json';
import esFeed from '@/locales/es/feed.json';
import esTraining from '@/locales/es/training.json';
import esMentor from '@/locales/es/mentor.json';
import esPeer from '@/locales/es/peer.json';
import esCoaching from '@/locales/es/coaching.json';
import esContribute from '@/locales/es/contribute.json';
import esCanvas from '@/locales/es/canvas.json';
import esCoordinate from '@/locales/es/coordinate.json';
import esModalities from '@/locales/es/modalities.json';
import esGrowth from '@/locales/es/growth.json';
import esVolunteer from '@/locales/es/volunteer.json';
import esScheduling from '@/locales/es/scheduling.json';
import esValidation from '@/locales/es/validation.json';
import esEnergy from '@/locales/es/energy.json';
import esSocialIssues from '@/locales/es/social-issues.json';
import esGlossary from '@/locales/es/glossary.json';
import esCoachme from '@/locales/es/coachme.json';
import esKanban from '@/locales/es/kanban.json';
import esMeet from '@/locales/es/meet.json';
import esGraph from '@/locales/es/graph.json';
import esHealth from '@/locales/es/health.json';
import esTools from '@/locales/es/tools.json';
import esLearning from '@/locales/es/learning.json';
import esSignals from '@/locales/es/signals.json';
import esOnboardingJourney from '@/locales/es/onboardingJourney.json';
import esRegister from '@/locales/es/register.json';
import esDashboard from '@/locales/es/dashboard.json';
import esQuestionnaires from '@/locales/es/questionnaires.json';
import esPitch from '@/locales/es/pitch.json';
import esLegal from '@/locales/es/legal.json';
import esActions from '@/locales/es/actions.json';

export const SUPPORTED_LANGUAGES = ['hu', 'en', 'es'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

declare global {
  interface Window {
    __INITIAL_LANGUAGE__?: SupportedLanguage;
  }
}

export function resolveSupportedLanguage(raw: string | null | undefined): SupportedLanguage {
  if (raw && (SUPPORTED_LANGUAGES as readonly string[]).includes(raw)) {
    return raw as SupportedLanguage;
  }
  return 'en';
}

const resources = {
hu: {
    common: huCommon,
    auth: huAuth,
    profiles: huProfiles,
    communities: huCommunities,
    feedback: huFeedback,
    map: huMap,
    events: huEvents,
    roadmap: huRoadmap,
    stories: huStories,
    reflect: huReflect,
    about: huAbout,
    admin: huAdmin,
    feed: huFeed,
    training: huTraining,
    mentor: huMentor,
    peer: huPeer,
    coaching: huCoaching,
    contribute: huContribute,
    canvas: huCanvas,
    coordinate: huCoordinate,
    modalities: huModalities,
    growth: huGrowth,
    volunteer: huVolunteer,
    scheduling: huScheduling,
    validation: huValidation,
    energy: huEnergy,
    'social-issues': huSocialIssues,
    coachme: huCoachme,
    glossary: huGlossary,
    kanban: huKanban,
    meet: huMeet,
    graph: huGraph,
    onboardingJourney: huOnboardingJourney,
    health: huHealth,
    tools: huTools,
    learning: huLearning,
    signals: huSignals,
    register: huRegister,
    dashboard: huDashboard,
    questionnaires: huQuestionnaires,
    pitch: huPitch,
    legal: huLegal,
    actions: huActions,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    profiles: enProfiles,
    communities: enCommunities,
    feedback: enFeedback,
    map: enMap,
    events: enEvents,
    roadmap: enRoadmap,
    stories: enStories,
    reflect: enReflect,
    about: enAbout,
    admin: enAdmin,
    feed: enFeed,
    training: enTraining,
    mentor: enMentor,
    peer: enPeer,
    coaching: enCoaching,
    contribute: enContribute,
    canvas: enCanvas,
    coordinate: enCoordinate,
    modalities: enModalities,
    growth: enGrowth,
    volunteer: enVolunteer,
    scheduling: enScheduling,
    validation: enValidation,
    energy: enEnergy,
    'social-issues': enSocialIssues,
    coachme: enCoachme,
    glossary: enGlossary,
    kanban: enKanban,
    meet: enMeet,
    graph: enGraph,
    health: enHealth,
    onboardingJourney: enOnboardingJourney,
    tools: enTools,
    learning: enLearning,
    signals: enSignals,
    register: enRegister,
    dashboard: enDashboard,
    questionnaires: enQuestionnaires,
    pitch: enPitch,
    legal: enLegal,
    actions: enActions,
  },
  es: {
    common: esCommon,
    auth: esAuth,
    profiles: esProfiles,
    communities: esCommunities,
    feedback: esFeedback,
    map: esMap,
    events: esEvents,
    roadmap: esRoadmap,
    stories: esStories,
    reflect: esReflect,
    about: esAbout,
    admin: esAdmin,
    feed: esFeed,
    training: esTraining,
    mentor: esMentor,
    peer: esPeer,
    coaching: esCoaching,
    contribute: esContribute,
    canvas: esCanvas,
    coordinate: esCoordinate,
    modalities: esModalities,
    growth: esGrowth,
    volunteer: esVolunteer,
    scheduling: esScheduling,
    validation: esValidation,
    energy: esEnergy,
    'social-issues': esSocialIssues,
    glossary: esGlossary,
    coachme: esCoachme,
    kanban: esKanban,
    meet: esMeet,
    graph: esGraph,
    health: esHealth,
    tools: esTools,
    onboardingJourney: esOnboardingJourney,
    learning: esLearning,
    signals: esSignals,
    register: esRegister,
    dashboard: esDashboard,
    questionnaires: esQuestionnaires,
    pitch: esPitch,
    legal: esLegal,
    actions: esActions,
  },
};

type I18nLanguageState = {
  language: SupportedLanguage;
  resolvedLanguage: SupportedLanguage;
  languages: SupportedLanguage[];
};

i18n
  .init({
    resources,
    lng: (typeof document !== 'undefined' && document.documentElement.lang) || 
         globalThis.window?.__INITIAL_LANGUAGE__ ||
         'en',
    fallbackLng: 'en',
    defaultNS: 'common',
  ns: [
    'common', 'auth', 'profiles', 'communities', 'feedback', 'map', 'events', 'admin', 'roadmap',
    'stories', 'reflect', 'about', 'feed',
    'training', 'mentor', 'peer', 'coaching', 'contribute',
    'canvas', 'coordinate', 'modalities', 'growth', 'volunteer', 'scheduling', 'validation', 'energy', 'social-issues', 'coachme', 'glossary', 'kanban', 'meet', 'graph', 'health', 'tools', 'learning', 'signals', 'register', 'dashboard', 'onboardingJourney', 'questionnaires', 'pitch', 'legal', 'actions'
  ],

    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

export function ensureI18nLanguage(raw: string | null | undefined, silent = false): SupportedLanguage {
  const language = resolveSupportedLanguage(raw);
  const currentLanguage = i18n.resolvedLanguage || i18n.language;

  if (currentLanguage !== language) {
    if (silent) {
      // Manually set language properties without triggering 'languageChanged' events
      // that would cause React components to re-render during hydration.
      const i18nState = i18n as typeof i18n & I18nLanguageState;
      i18nState.language = language;
      i18nState.resolvedLanguage = language;
      i18nState.languages = [language, ...SUPPORTED_LANGUAGES.filter((supportedLanguage) => supportedLanguage !== language)];
    } else {
      void i18n.changeLanguage(language);
    }
  }

  return language;
}

export default i18n;
