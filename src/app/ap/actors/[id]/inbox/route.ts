import { NextResponse } from 'next/server';

/**
 * ActivityPub inbox — explicit publish-only stub (2026-06-18 audit C6).
 *
 * The actor document advertises an `inbox` endpoint
 * (`src/lib/federation/activitypub.ts`), but no handler existed, so a remote
 * server delivering an activity (Follow, Like, Announce, …) received a silent
 * 404 — indistinguishable from "wrong URL." This instance is currently
 * **publish-only**: it exposes the actor, outbox, followers and following as
 * read surfaces but does not yet process inbound delivery (no signature
 * verification, no side effects). Until a real signed inbox lands (tracked in
 * `docs/plans/todo/` federation work), respond with an explicit `405 Method Not
 * Allowed` so federating peers get a correct, machine-readable signal.
 */
function publishOnly(): NextResponse {
  return NextResponse.json(
    {
      error: 'method_not_allowed',
      detail: 'This instance is publish-only and does not accept inbound ActivityPub delivery yet.',
    },
    {
      status: 405,
      headers: {
        // No methods are accepted on the inbox; an empty Allow communicates that
        // explicitly per RFC 9110 §10.2.1 while keeping the 405 unambiguous.
        Allow: '',
        'Content-Type': 'application/activity+json; charset=utf-8',
      },
    },
  );
}

export function POST(): NextResponse {
  return publishOnly();
}

export function GET(): NextResponse {
  return publishOnly();
}
