// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const sentryDsn = process.env.SENTRY_DSN;
const tracesSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1");
const enableLogs = process.env.SENTRY_ENABLE_LOGS === "true";

Sentry.init({
  dsn: sentryDsn,
  enabled: Boolean(sentryDsn),

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.1,

  // Server/edge log shipping is opt-in because error events already cover operational telemetry.
  enableLogs,

  // Do not send default PII unless a later privacy review explicitly enables it.
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false,
});
