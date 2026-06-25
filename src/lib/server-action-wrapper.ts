/**
 * Last-resort error boundary for Server Actions.
 *
 * Most action files validate inputs and return typed failures themselves;
 * this wrapper exists so an unexpected throw (database outage, Prisma
 * constraint violation, programming error) becomes a typed
 * `{ success: false }` response instead of crashing the request and leaving
 * the client with an opaque digest error.
 *
 * Usage — keep the exported declaration an async function so the
 * `'use server'` compiler contract holds, and delegate the body:
 *
 *   export async function createThing(input: Input): Promise<ApiResponse<Thing>> {
 *     return runAction('createThing', async () => {
 *       // original body
 *     });
 *   }
 *
 * Next.js control-flow exceptions (redirect/notFound) are re-thrown via
 * `unstable_rethrow`, so wrapped actions may still redirect safely.
 */
import { unstable_rethrow } from 'next/navigation';
import { logger } from '@/lib/logger';

export type ActionFailure = { success: false; error: string };

export const GENERIC_ACTION_ERROR = 'Something went wrong. Please try again.';

export async function runAction<T>(
  actionName: string,
  fn: () => Promise<T>,
): Promise<T | ActionFailure> {
  try {
    return await fn();
  } catch (error) {
    unstable_rethrow(error);
    logger.error({
      msg: 'Unhandled server action error',
      action: actionName,
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    });
    return { success: false, error: GENERIC_ACTION_ERROR };
  }
}
