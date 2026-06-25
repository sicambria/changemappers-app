#!/usr/bin/env node
/**
 * @description Cross-platform replacement for with-perf.sh — runs a workload under the Linux CPU `performance` power profile (restored on exit incl. failure/SIGINT/SIGTERM), and as a plain passthrough on Windows/macOS where `powerprofilesctl` does not exist.
 * @usage node scripts/dev/with-perf.mjs --seq "cmd1" "cmd2" ...   (or: npm run perf -- <cmd> [args])
 *
 * The Linux power-profile logic is NOT reimplemented here: it is reused verbatim
 * from scripts/dev/perf-profile.sh (which the git hooks also source), so the
 * ownership / restore-trap model stays single-sourced and cannot drift.
 *
 * Forms:
 *   node scripts/dev/with-perf.mjs --seq "cmd1" "cmd2" ...   # fail-fast sequence
 *   node scripts/dev/with-perf.mjs <cmd> [args...]           # single passthrough
 *
 * With --seq, pass each command as ONE argv element WITHOUT shell operators
 * (`&&`/`;`/pipes) — sequencing is handled here. A step may contain
 * `cross-env VAR=value cmd` for portable env vars.
 */

import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isLinux, runSeq } from '../lib/platform.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const perfProfileSh = join(scriptDir, 'perf-profile.sh');

const argv = process.argv.slice(2);

// Build the list of command strings to run, in order.
let steps;
if (argv[0] === '--seq') {
  steps = argv.slice(1);
} else if (argv.length > 0) {
  // Single passthrough: join into one command string. Callers use this form for
  // simple commands (the `perf` npm script passes none); --seq is the robust path.
  steps = [argv.join(' ')];
} else {
  steps = [];
}

let exitCode;
if (isLinux) {
  // Reuse perf-profile.sh verbatim: source it, take ownership, then run the steps
  // joined with `&&` (fail-fast). The EXIT/INT/TERM trap installed by
  // perf_profile_begin restores the profile when this sh process ends.
  const joined = steps.filter((s) => s && s.trim()).join(' && ');
  const inner = `. "${perfProfileSh}"; perf_profile_begin; ${joined || ':'}`;
  const r = spawnSync('sh', ['-c', inner], { stdio: 'inherit' });
  if (r.error) {
    process.stderr.write(`[with-perf] failed to launch shell: ${r.error.message}\n`);
    exitCode = 1;
  } else {
    exitCode = r.status == null ? 1 : r.status;
  }
} else {
  // Windows / macOS: no power-profile management — just run the workload.
  exitCode = runSeq(steps);
}

process.exit(exitCode);
