#!/usr/bin/env node

/**
 * @description Runs Prisma CLI commands with MIGRATION_DATABASE_URL as DATABASE_URL when configured.
 * @usage node scripts/db/run-prisma-with-migration-url.mjs migrate deploy
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse as parseDotenv } from 'dotenv';

const requireFromHere = createRequire(import.meta.url);

export function loadDotenvValues(cwd = process.cwd()) {
  const envPath = path.join(cwd, '.env');
  if (!fs.existsSync(envPath)) return {};
  return parseDotenv(fs.readFileSync(envPath));
}

export function createPrismaCommand(args, sourceEnv = process.env, { cwd = process.cwd() } = {}) {
  const env = { ...loadDotenvValues(cwd), ...sourceEnv };
  if (env.MIGRATION_DATABASE_URL) {
    env.DATABASE_URL = env.MIGRATION_DATABASE_URL;
  }

  return {
    command: process.execPath,
    args: [requireFromHere.resolve('prisma/build/index.js'), ...args],
    env,
  };
}

export function runPrismaWithMigrationUrl({
  args = process.argv.slice(2),
  env = process.env,
  spawnSyncFn = spawnSync,
  stdio = 'inherit',
} = {}) {
  if (args.length === 0) {
    console.error('Usage: node scripts/db/run-prisma-with-migration-url.mjs <prisma args...>');
    return 1;
  }

  const command = createPrismaCommand(args, env);
  const result = spawnSyncFn(command.command, command.args, {
    stdio,
    env: command.env,
    windowsHide: true,
  });

  if (result.error) {
    console.error(`${result.error.name}: ${result.error.message}`);
    return 1;
  }

  return result.status ?? 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(runPrismaWithMigrationUrl());
}
