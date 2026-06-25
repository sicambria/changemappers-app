export function isNextProductionBuildPhase(
  nodeEnv = process.env.NODE_ENV,
  nextPhase = process.env.NEXT_PHASE,
): boolean {
  return nodeEnv === 'production' && nextPhase === 'phase-production-build';
}

