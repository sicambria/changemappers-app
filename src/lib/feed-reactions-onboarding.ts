export function getFeedReactionsOnboardingStorageKey(userId: string): string {
  return `cm:feed-reactions-onboarding:dismissed:${userId}`;
}
