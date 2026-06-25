import { GOVERNANCE_ROUTES } from '@/lib/cmap2';

type GovernanceSection = {
  heading: string;
  body: string[];
};

type GovernancePage = {
  title: string;
  summary: string;
  sections: GovernanceSection[];
};

export type { GovernanceSection, GovernancePage };

export const governancePages: Record<string, GovernancePage> = {
  charter: {
    title: 'governance.pages.charter.title',
    summary: 'governance.pages.charter.summary',
    sections: [
      {
        heading: 'governance.pages.charter.sections.0.heading',
        body: [
          'governance.pages.charter.sections.0.body.0',
          'governance.pages.charter.sections.0.body.1',
        ],
      },
      {
        heading: 'governance.pages.charter.sections.1.heading',
        body: [
          'governance.pages.charter.sections.1.body.0',
          'governance.pages.charter.sections.1.body.1',
        ],
      },
    ],
  },
  'refusal-register': {
    title: 'governance.pages.refusal-register.title',
    summary: 'governance.pages.refusal-register.summary',
    sections: [
      {
        heading: 'governance.pages.refusal-register.sections.0.heading',
        body: [
          'governance.pages.refusal-register.sections.0.body.0',
          'governance.pages.refusal-register.sections.0.body.1',
          'governance.pages.refusal-register.sections.0.body.2',
          'governance.pages.refusal-register.sections.0.body.3',
          'governance.pages.refusal-register.sections.0.body.4',
        ],
      },
    ],
  },
  'challenge-path': {
    title: 'governance.pages.challenge-path.title',
    summary: 'governance.pages.challenge-path.summary',
    sections: [
      {
        heading: 'governance.pages.challenge-path.sections.0.heading',
        body: [
          'governance.pages.challenge-path.sections.0.body.0',
          'governance.pages.challenge-path.sections.0.body.1',
          'governance.pages.challenge-path.sections.0.body.2',
          'governance.pages.challenge-path.sections.0.body.3',
        ],
      },
    ],
  },
  'what-we-cannot-yet-hold': {
    title: 'governance.pages.what-we-cannot-yet-hold.title',
    summary: 'governance.pages.what-we-cannot-yet-hold.summary',
    sections: [
      {
        heading: 'governance.pages.what-we-cannot-yet-hold.sections.0.heading',
        body: [
          'governance.pages.what-we-cannot-yet-hold.sections.0.body.0',
          'governance.pages.what-we-cannot-yet-hold.sections.0.body.1',
          'governance.pages.what-we-cannot-yet-hold.sections.0.body.2',
          'governance.pages.what-we-cannot-yet-hold.sections.0.body.3',
          'governance.pages.what-we-cannot-yet-hold.sections.0.body.4',
        ],
      },
    ],
  },
  'defederation-protocol': {
    title: 'governance.pages.defederation-protocol.title',
    summary: 'governance.pages.defederation-protocol.summary',
    sections: [
      {
        heading: 'governance.pages.defederation-protocol.sections.0.heading',
        body: [
          'governance.pages.defederation-protocol.sections.0.body.0',
          'governance.pages.defederation-protocol.sections.0.body.1',
          'governance.pages.defederation-protocol.sections.0.body.2',
        ],
      },
    ],
  },
  'governance-roster': {
    title: 'governance.pages.governance-roster.title',
    summary: 'governance.pages.governance-roster.summary',
    sections: [
      {
        heading: 'governance.pages.governance-roster.sections.0.heading',
        body: [
          'governance.pages.governance-roster.sections.0.body.0',
          'governance.pages.governance-roster.sections.0.body.1',
        ],
      },
    ],
  },
  'tk-bc-labels': {
    title: 'governance.pages.tk-bc-labels.title',
    summary: 'governance.pages.tk-bc-labels.summary',
    sections: [
      {
        heading: 'governance.pages.tk-bc-labels.sections.0.heading',
        body: [
          'governance.pages.tk-bc-labels.sections.0.body.0',
          'governance.pages.tk-bc-labels.sections.0.body.1',
        ],
      },
    ],
  },
  'term-limits-successors': {
    title: 'governance.pages.term-limits-successors.title',
    summary: 'governance.pages.term-limits-successors.summary',
    sections: [
      {
        heading: 'governance.pages.term-limits-successors.sections.0.heading',
        body: [
          'governance.pages.term-limits-successors.sections.0.body.0',
          'governance.pages.term-limits-successors.sections.0.body.1',
          'governance.pages.term-limits-successors.sections.0.body.2',
        ],
      },
    ],
  },
};

export function localizeGovernancePage(
  slug: string,
  page: GovernancePage,
  t: (key: string, params?: Record<string, string | number | boolean | null | undefined>) => string,
) {
  const localizedText = (key: string, fallback: string) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  return {
    title: localizedText(`governance.pages.${slug}.title`, page.title),
    summary: localizedText(`governance.pages.${slug}.summary`, page.summary),
    sections: page.sections.map((section, sectionIndex) => ({
      heading: localizedText(`governance.pages.${slug}.sections.${sectionIndex}.heading`, section.heading),
      body: section.body.map((paragraph, paragraphIndex) => {
        const paragraphKey = `governance.pages.${slug}.sections.${sectionIndex}.body.${paragraphIndex}`;
        const translatedParagraph = t(paragraphKey);
        return translatedParagraph === paragraphKey ? paragraph : translatedParagraph;
      }),
    })),
  };
}

export const governanceIndex = GOVERNANCE_ROUTES.map((route) => ({ ...route, ...governancePages[route.slug] }));
