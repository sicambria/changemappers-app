#!/usr/bin/env node
/**
 * @description Shared cross-platform (Linux ↔ Windows ↔ macOS) helpers for the npm-layer orchestration scripts — `isWindows`/`isLinux`, `findPython()`, and `runSeq()` — keeping platform branching in ONE place so it never leaks into package.json as POSIX-only (`sh -c`, env-prefix) or cmd-only (`set X=1&&`) idioms.
 * @usage import { isWindows, findPython, runSeq } from '../lib/platform.mjs'
 */

import { spawnSync } from 'node:child_process';

export const isWindows = process.platform === 'win32';
export const isLinux = process.platform === 'linux';
export const isMac = process.platform === 'darwin';

/**
 * Resolve the Python interpreter name for this platform. Linux/macOS ship
 * `python3`; Windows ships `python` (and `python3` is often a Store stub that
 * errors). Probe in preference order and return the first that runs.
 * @returns {string} the working interpreter command (defaults to 'python3').
 */
export function findPython() {
  const candidates = isWindows ? ['python', 'python3', 'py'] : ['python3', 'python'];
  for (const cmd of candidates) {
    const probe = spawnSync(cmd, ['--version'], { stdio: 'ignore', shell: isWindows });
    if (probe.status === 0) return cmd;
  }
  // Nothing found — return the platform default so the caller surfaces a clear
  // "command not found" rather than us throwing an opaque error here.
  return isWindows ? 'python' : 'python3';
}

/**
 * Run a list of shell command strings sequentially, fail-fast. Each step runs in
 * its own shell (`shell: true`), so PATH resolution and platform builtins work on
 * both `sh` and `cmd`. NOTE: pass each step WITHOUT shell operators (`&&`, `;`,
 * pipes) — the sequencing/short-circuit is done here, in Node, so it behaves
 * identically on every platform. A step may still contain `cross-env VAR=… cmd`.
 * @param {string[]} steps
 * @returns {number} the exit code of the first failing step, or 0 if all pass.
 */
export function runSeq(steps) {
  for (const step of steps) {
    if (!step || !step.trim()) continue;
    const r = spawnSync(step, { stdio: 'inherit', shell: true });
    if (r.error) {
      process.stderr.write(`[platform] failed to launch: ${step}\n${r.error.message}\n`);
      return 1;
    }
    // A signal (e.g. SIGINT) leaves status null — treat as non-zero.
    if (r.status !== 0) return r.status == null ? 1 : r.status;
  }
  return 0;
}
