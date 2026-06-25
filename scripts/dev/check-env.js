/**
 * @description Validates that all required environment variables are set before starting the dev server.
 * @usage npx tsx scripts/dev/check-env.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', '..');
const envPath = path.join(root, '.env');
const isCi = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

function envFileContainsVar(envContent, variableName) {
  const escaped = variableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^\\s*${escaped}\\s*=`, 'm');
  return pattern.test(envContent);
}

function checkNodeVersion() {
  const nvmrcPath = path.join(root, '.nvmrc');
  if (!fs.existsSync(nvmrcPath)) return;
  const expectedVersion = fs.readFileSync(nvmrcPath, 'utf8').trim();
  const currentVersion = process.version.replace('v', '');
  const expectedPrefix = expectedVersion.split('.').slice(0, 2).join('.');
  if (!currentVersion.startsWith(expectedPrefix)) {
    console.warn(`⚠️ Warning: Node version mismatch. Expected ${expectedVersion}, got ${currentVersion}`);
  } else {
    console.log(`✅ Node version: ${currentVersion}`);
  }
}

function checkEnvFile() {
  const envExists = fs.existsSync(envPath);
  const envContent = envExists ? fs.readFileSync(envPath, 'utf8') : '';
  if (!envExists) {
    if (!isCi) {
      console.error('❌ Error: .env file missing. Please copy .env.example to .env');
      process.exit(1);
    }
    console.log('ℹ️ CI environment detected; .env file not found, using injected environment variables');
  } else {
    console.log('✅ .env file found');
  }
  return envContent;
}

function checkCriticalVars(envContent) {
  const skipDbValidation = process.env.CHECK_ENV_SKIP_DB === '1';
  if (skipDbValidation) {
    console.log('ℹ️ Skipping DATABASE_URL check for bootstrap skip mode.');
    return;
  }
  const requiredVars = ['DATABASE_URL'];
  for (const v of requiredVars) {
    if (!process.env[v] && !envFileContainsVar(envContent, v)) {
      console.error(`❌ Error: Required environment variable ${v} is missing${isCi ? ' from injected CI environment variables' : ''}.`);
      process.exit(1);
    }
  }
  console.log('✅ Critical environment variables checked');
}

async function checkEnv() {
  console.log('🔍 Checking environment...');
  checkNodeVersion();
  const envContent = checkEnvFile();
  checkCriticalVars(envContent);
}

try {
  await checkEnv();
} catch (err) {
  console.error('❌ Environment check failed:', err);
  process.exit(1);
}
