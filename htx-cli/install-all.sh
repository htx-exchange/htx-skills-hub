#!/bin/sh
set -e

# ──────────────────────────────────────────────────────────────
# htx-cli + skills unified installer
#
# Releases: https://github.com/htx-exchange/htx-skills-hub/releases
#   Initial release: https://github.com/htx-exchange/htx-skills-hub/releases/tag/v1.0.0
#
# Runs two independent installers in sequence:
#   1. ./install.sh             — the htx-cli binary (GitHub release).
#   2. ./skills/install-all.sh  — all 6 Claude Code skills.
#
# Usage:
#   ./install-all.sh                        # binary (remote) + all skills (local)
#   ./install-all.sh --beta                 # binary: latest pre-release
#   ./install-all.sh --skills-only          # skip binary, install skills only
#   ./install-all.sh --binary-only          # install binary only, skip skills
#   ./install-all.sh --uninstall            # remove skills (binary left in place)
#   ./install-all.sh --only spot-market,spot-account
#   ./install-all.sh --force                # force skills overwrite
#   ./install-all.sh --registry             # skills from npm registry
#
# Flags are forwarded to the delegated scripts where applicable.
# ──────────────────────────────────────────────────────────────

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
BIN_REMOTE_SCRIPT="$SCRIPT_DIR/install.sh"
SKILLS_SCRIPT="$SCRIPT_DIR/skills/install-all.sh"

BETA_MODE=false
SKIP_BINARY=false
SKIP_SKILLS=false
UNINSTALL=false
FORCE=false
USE_REGISTRY=false
ONLY=""
DEST=""

# ── Parse arguments ──────────────────────────────────────────
while [ $# -gt 0 ]; do
  case "$1" in
    --beta)           BETA_MODE=true; shift ;;
    --skills-only)    SKIP_BINARY=true; shift ;;
    --binary-only)    SKIP_SKILLS=true; shift ;;
    --uninstall|-u)   UNINSTALL=true; shift ;;
    --force|-f)       FORCE=true; shift ;;
    --registry|-r)    USE_REGISTRY=true; shift ;;
    --only)
      [ $# -lt 2 ] && { echo "Error: --only requires a list" >&2; exit 1; }
      ONLY="$2"; shift 2
      ;;
    --only=*)         ONLY="${1#--only=}"; shift ;;
    --dest|-d)
      [ $# -lt 2 ] && { echo "Error: --dest requires a path" >&2; exit 1; }
      DEST="$2"; shift 2
      ;;
    --dest=*)         DEST="${1#--dest=}"; shift ;;
    -h|--help)
      sed -n '3,22p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Error: unknown argument: $1" >&2
      echo "Run '$0 --help' for usage." >&2
      exit 1
      ;;
  esac
done

# ── Uninstall path (skills only; keep binary) ────────────────
if [ "$UNINSTALL" = true ]; then
  echo "==> Uninstalling skills"
  [ -x "$SKILLS_SCRIPT" ] || { echo "Error: $SKILLS_SCRIPT not found or not executable" >&2; exit 1; }
  extra="--uninstall"
  [ -n "$ONLY" ]        && extra="$extra --only $ONLY"
  [ -n "$DEST" ]        && extra="$extra --dest $DEST"
  [ "$USE_REGISTRY" = true ] && extra="$extra --registry"
  # shellcheck disable=SC2086
  "$SKILLS_SCRIPT" $extra
  echo ""
  echo "Note: the htx-cli binary was NOT removed."
  exit 0
fi

# ── Step 1: install the binary ───────────────────────────────
if [ "$SKIP_BINARY" = false ]; then
  echo "==> [1/2] Installing htx-cli binary"

  [ -x "$BIN_REMOTE_SCRIPT" ] || { echo "Error: $BIN_REMOTE_SCRIPT not found or not executable" >&2; exit 1; }
  bin_extra=""
  [ "$BETA_MODE" = true ] && bin_extra="$bin_extra --beta"
  # shellcheck disable=SC2086
  "$BIN_REMOTE_SCRIPT" $bin_extra
  echo ""
else
  echo "==> [1/2] Skipping binary install (--skills-only)"
  echo ""
fi

# ── Step 2: install the skills ───────────────────────────────
if [ "$SKIP_SKILLS" = false ]; then
  echo "==> [2/2] Installing Claude Code skills"
  [ -x "$SKILLS_SCRIPT" ] || { echo "Error: $SKILLS_SCRIPT not found or not executable" >&2; exit 1; }

  if ! command -v npx >/dev/null 2>&1; then
    echo "Warning: 'npx' not found. Install Node.js >= 18 to install skills." >&2
    echo "Binary install (if any) completed; skipping skills." >&2
    exit 0
  fi

  sk_extra=""
  [ -n "$ONLY" ]             && sk_extra="$sk_extra --only $ONLY"
  [ -n "$DEST" ]              && sk_extra="$sk_extra --dest $DEST"
  [ "$FORCE" = true ]         && sk_extra="$sk_extra --force"
  [ "$USE_REGISTRY" = true ]  && sk_extra="$sk_extra --registry"
  # shellcheck disable=SC2086
  "$SKILLS_SCRIPT" $sk_extra
else
  echo "==> [2/2] Skipping skills install (--binary-only)"
fi

echo ""
echo "All done."
