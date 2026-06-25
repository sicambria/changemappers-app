/**
 * @description Cleans up Next.js dev types before typecheck/build to prevent false-positive TS errors.
 * @usage npx tsx scripts/dev/clean-next-dev-types.js
 */

import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const nextDevTypesDir = resolve(process.cwd(), '.next', 'dev', 'types');

if (!existsSync(nextDevTypesDir)) {
  process.exit(0);
}

rmSync(nextDevTypesDir, { recursive: true, force: true });
console.log(`Removed stale Next dev type artifacts from ${nextDevTypesDir}`);
