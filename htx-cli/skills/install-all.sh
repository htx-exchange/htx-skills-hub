#!/bin/sh
set -e

# ──────────────────────────────────────────────────────────────
# Install (or uninstall) all six HTX Skills Hub skills in one shot.
#
# Each skill's bin/install.js does the real work — this script just
# loops over them with a consistent set of options.
#
# Usage:
#   ./install-all.sh                             # install all 6 from local repo
#   ./install-all.sh --dest ./my-skills          # custom target dir
#   ./install-all.sh --force                     # overwrite existing files
#   ./install-all.sh --uninstall                 # remove all 6
#   ./install-all.sh --only spot-market,spot-account   # subset
#   ./install-all.sh --registry                  # use npm registry (@htx-skills/*)
#                                                # instead of local filesystem
#
# Environment:
#   CLAUDE_SKILLS_DIR  default install dir (honored by each install.js)
# ──────────────────────────────────────────────────────────────

SKILLS="spot-market spot-account spot-trading futures-market futures-account futures-trading"

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
HTX_DIR="$SCRIPT_DIR/htx"

COMMAND="install"
DEST=""
FORCE=false
ONLY=""
USE_REGISTRY=false

# ── Parse arguments ──────────────────────────────────────────
while [ $# -gt 0 ]; do
  case "$1" in
    --uninstall|-u)
      COMMAND="uninstall"
      shift
      ;;
    --dest|-d)
      [ $# -lt 2 ] && { echo "Error: --dest requires a path" >&2; exit 1; }
      DEST="$2"
      shift 2
      ;;
    --dest=*)
      DEST="${1#--dest=}"
      shift
      ;;
    --force|-f)
      FORCE=true
      shift
      ;;
    --only)
      [ $# -lt 2 ] && { echo "Error: --only requires a comma-separated list" >&2; exit 1; }
      ONLY="$2"
      shift 2
      ;;
    --only=*)
      ONLY="${1#--only=}"
      shift
      ;;
    --registry|-r)
      USE_REGISTRY=true
      shift
      ;;
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

# ── Pre-flight checks ────────────────────────────────────────
if ! command -v npx >/dev/null 2>&1; then
  echo "Error: 'npx' not found. Install Node.js >= 18." >&2
  exit 1
fi

if [ "$USE_REGISTRY" = false ] && [ ! -d "$HTX_DIR" ]; then
  echo "Error: $HTX_DIR not found (did the skills/ layout change?)" >&2
  exit 1
fi

# ── Filter skills by --only ──────────────────────────────────
selected=""
if [ -n "$ONLY" ]; then
  # Split ONLY on commas and validate each entry.
  old_ifs=$IFS
  IFS=','
  for name in $ONLY; do
    case " $SKILLS " in
      *" $name "*) selected="$selected $name" ;;
      *) echo "Error: unknown skill '$name'. Valid: $SKILLS" >&2; IFS=$old_ifs; exit 1 ;;
    esac
  done
  IFS=$old_ifs
else
  selected="$SKILLS"
fi

# ── Build npx argument tail (shared across skills) ───────────
extra=""
[ -n "$DEST" ] && extra="$extra --dest $DEST"
[ "$FORCE" = true ] && extra="$extra --force"

# ── Action banner ────────────────────────────────────────────
echo "HTX Skills Hub — bulk ${COMMAND}"
echo "  source   : $( [ "$USE_REGISTRY" = true ] && echo 'npm registry (@htx-skills/*)' || echo "local: $HTX_DIR" )"
[ -n "$DEST" ]   && echo "  dest     : $DEST"
[ -n "$ONLY" ]   && echo "  only     : $ONLY"
[ "$FORCE" = true ] && echo "  force    : yes"
echo ""

# ── Loop ─────────────────────────────────────────────────────
failed=""
succeeded=""
for skill in $selected; do
  printf "→ %-18s " "$skill"

  if [ "$USE_REGISTRY" = true ]; then
    pkg="@htx-skills/$skill"
  else
    pkg="$HTX_DIR/$skill"
    if [ ! -d "$pkg" ]; then
      echo "MISSING ($pkg not found)"
      failed="$failed $skill"
      continue
    fi
  fi

  # shellcheck disable=SC2086
  if output=$(npx -y "$pkg" "$COMMAND" $extra 2>&1); then
    # Print a compact success line — last line of npx output is usually the "installed ..." message.
    echo "ok"
    echo "$output" | sed 's/^/     /'
    succeeded="$succeeded $skill"
  else
    echo "FAILED"
    echo "$output" | sed 's/^/     /' >&2
    failed="$failed $skill"
  fi
done

# ── Summary ──────────────────────────────────────────────────
echo ""
echo "Summary:"
echo "  succeeded: $(echo $succeeded | wc -w | tr -d ' ')${succeeded:+  [$(echo $succeeded | sed 's/^ //')]}"
if [ -n "$failed" ]; then
  echo "  failed   : $(echo $failed | wc -w | tr -d ' ')  [$(echo $failed | sed 's/^ //')]"
  exit 1
fi

echo ""
echo "Done."
