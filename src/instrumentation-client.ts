// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const tracesSampleRate = Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0");

Sentry.init({
  dsn: sentryDsn,
  enabled: Boolean(sentryDsn),

  // Keep browser reporting opt-in until telemetry consent/privacy copy explicitly covers it.
  integrations: [],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0,
  // Enable logs to be sent to Sentry
  enableLogs: Boolean(sentryDsn),

  // Do not send default PII unless a later privacy review explicitly enables it.
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
