import * as Sentry from "@sentry/nextjs";
import { timingSafeEqual } from "node:crypto";
export const dynamic = "force-dynamic";

class SentryExampleAPIError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryExampleAPIError";
  }
}

// A faulty API route to test Sentry's error monitoring.
// SEC-M4: gated by CRON_SECRET to prevent unauthenticated quota exhaustion.
export function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${secret}`;
  const authBuf = authHeader ? Buffer.from(authHeader) : null;
  const expectedBuf = Buffer.from(expected);
  if (!authBuf || authBuf.length !== expectedBuf.length || !timingSafeEqual(authBuf, expectedBuf)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  Sentry.logger.info("Sentry example API called");
  const error = new SentryExampleAPIError(
    "This error is raised on the backend called by the example page.",
  );
  Sentry.captureException(error);

  return Response.json(
    { error: "Sentry example API error captured." },
    { status: 500 },
  );
}
