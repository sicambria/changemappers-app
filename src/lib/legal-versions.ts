export const LEGAL_VERSIONS = {
  terms: '2026-05-21',
  privacy: '2026-06-04',
  communityAgreements: '2026-05-20',
  charter: '2026-05-26',
  impressum: '2026-06-13',
} as const;

export type LegalVersionKey = keyof typeof LEGAL_VERSIONS;
