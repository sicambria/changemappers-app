# Localization Backlog

Last updated: 2026-05-30

This is the central backlog for known remaining localization work. The audit finding `docs/audits/findings/2026-05/AUDIT-20260530-001-server-action-result-i18n-backlog.md` is now resolved.

## Current Status

The normal fail-closed i18n audit is green for registered locale keys, auth-generated emails/pages, registration/login/magic-link/password-reset flows, legal/privacy pages, onboarding questionnaire copy, App Router page/component visible copy, and non-auth Server Action result/generated messages under `src/app/actions/**`.

The action-result remediation added a shared server-side action result localization helper backed by `src/locales/{en,hu,es}/actions.json`. Action files now return localized result strings resolved from the active UI language. The normal i18n audit now includes `src/app/actions/**` by default. `src/app/actions/admin/seed.ts` remains explicitly classified as intentional demo/fixture data for seed records, while its action status/error messages are localized.

## Closed Backlog

| Area | Status | Scope | Source |
|---|---|---:|---|
| Non-auth Server Action result and generated content messages | Done | 609 findings across 15 files | AUDIT-20260530-001 |

## File Inventory

| File | Findings | Status |
|---|---:|---|
| `src/app/actions/admin.ts` | 5 | Done |
| `src/app/actions/admin/invite.ts` | 24 | Done |
| `src/app/actions/admin/seed.ts` | 383 | Done; fixture data exempted, action results localized |
| `src/app/actions/admin/settings.ts` | 11 | Done |
| `src/app/actions/community.ts` | 37 | Done |
| `src/app/actions/connection.ts` | 31 | Done |
| `src/app/actions/event.ts` | 23 | Done |
| `src/app/actions/feedback.ts` | 7 | Done |
| `src/app/actions/graph.ts` | 1 | Done |
| `src/app/actions/invite.ts` | 20 | Done |
| `src/app/actions/onboarding.ts` | 3 | Done |
| `src/app/actions/profile.ts` | 6 | Done |
| `src/app/actions/proximity.ts` | 4 | Done |
| `src/app/actions/report.ts` | 17 | Done |
| `src/app/actions/user.ts` | 37 | Done |

## Closure Evidence

```text
npm run i18n:audit
npx tsx scripts/audits/i18n-audit.ts --path src/app --json
npm run test -- src/__tests__/lib/server-i18n.test.ts
npm run typecheck
npm run lint
```

Both the normal and app-wide i18n audits report zero actionable localization issues after remediation.
