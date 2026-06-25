#!/usr/bin/env sh
# @description Sourceable helper that switches the CPU power profile to `performance`
#              for the duration of the current process and restores the previous
#              profile on exit (incl. failure, SIGINT, SIGTERM). Strict POSIX sh:
#              it is sourced into git hooks which husky runs via `sh -e`.
# @usage  . "$(git rev-parse --show-toplevel)/scripts/dev/perf-profile.sh" && perf_profile_begin
#
# Ownership model (CM_PERF_ACTIVE):
#   The FIRST process in a tree to call perf_profile_begin becomes the owner: it
#   exports CM_PERF_ACTIVE=1, switches to `performance`, and installs the restore
#   trap. Nested calls (e.g. pre-push -> wrapped `npm run build`) inherit the var
#   and no-op, so only the owner restores — exactly once.
#
# Restore rule:
#   Restore the captured previous profile, EXCEPT if it was already `performance`
#   restore `balanced` instead. This self-heals a hard-kill residue (a later
#   independent run sees `performance`, owns it, and drops back to `balanced`),
#   preserves `power-saver` on battery, and honours the "back to balanced" default.

perf_profile_begin() {
  command -v powerprofilesctl >/dev/null 2>&1 || return 0   # tool absent -> no-op
  [ -n "${CI:-}" ] && return 0                              # CI -> no-op
  [ -n "${CM_PERF_ACTIVE:-}" ] && return 0                  # ancestor owns it -> no-op

  CM_PERF_PREV=$(powerprofilesctl get 2>/dev/null || echo "")
  [ -n "$CM_PERF_PREV" ] || return 0                        # could not read -> bail safe

  case "$CM_PERF_PREV" in
    performance) CM_PERF_RESTORE=balanced ;;
    *)           CM_PERF_RESTORE=$CM_PERF_PREV ;;
  esac
  export CM_PERF_ACTIVE=1

  # If the switch itself fails (daemon down / no permission), run the workload
  # anyway and install NO trap (nothing to restore).
  powerprofilesctl set performance >/dev/null 2>&1 || return 0

  # EXIT: restore, preserving the original exit status (do NOT call exit here).
  trap 'powerprofilesctl set "$CM_PERF_RESTORE" >/dev/null 2>&1 || true' EXIT
  # INT/TERM: restore AND terminate — a restore-only trap would swallow Ctrl-C.
  trap 'powerprofilesctl set "$CM_PERF_RESTORE" >/dev/null 2>&1 || true; trap - EXIT; exit 130' INT
  trap 'powerprofilesctl set "$CM_PERF_RESTORE" >/dev/null 2>&1 || true; trap - EXIT; exit 143' TERM
}
