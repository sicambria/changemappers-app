import { safeCompare } from './security-utils';

export function isDockerBuildPlaceholderDatabaseUrl(connectionString: string | undefined): boolean {
  if (!connectionString) {
    return false;
  }

  try {
    const parsed = new URL(connectionString);
    return (
      (parsed.protocol === 'postgresql:' || parsed.protocol === 'postgres:') &&
      parsed.username === 'changemappers' &&
      safeCompare(parsed.password, 'build-placeholder') &&
      parsed.hostname === 'localhost' &&
      parsed.port === '5432' &&
      parsed.pathname === '/changemappers'
    );
  } catch {
    return false;
  }
}

export function shouldSuppressPrismaErrorLogForBuild(
  connectionString: string | undefined,
  nodeEnv = process.env.NODE_ENV,
): boolean {
  return nodeEnv === 'production' && isDockerBuildPlaceholderDatabaseUrl(connectionString);
}
