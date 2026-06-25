import * as Sentry from "@sentry/nextjs";

/**
 * Next.js Server Instrumentation
 *
 * Runs when the Next.js server starts. Use for production startup validation,
 * Sentry initialization, and other server-side initialization that must happen
 * before handling requests.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");

    const { runProductionValidations } = await import("./lib/startup-validation");
    runProductionValidations();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
