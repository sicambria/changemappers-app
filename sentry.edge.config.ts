// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const sentryDsn = process.env.SENTRY_DSN;
const tracesSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.05");
const enableLogs = process.env.SENTRY_ENABLE_LOGS === "true";

Sentry.init({
  dsn: sentryDsn,
  enabled: Boolean(sentryDsn),

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.05,

  // Server/edge log shipping is opt-in because error events already cover operational telemetry.
  enableLogs,

  // Do not send default PII unless a later privacy review explicitly enables it.
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false,
});
