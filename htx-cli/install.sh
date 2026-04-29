#!/bin/sh
set -e

# ──────────────────────────────────────────────────────────────
# htx-cli installer / updater (macOS / Linux)
#
# Usage:
#   curl -sSL https://raw.githubusercontent.com/flamez-hue/htx-skills-hub/main/htx-cli/install.sh | sh
#   curl -sSL https://raw.githubusercontent.com/flamez-hue/htx-skills-hub/main/htx-cli/install.sh | sh -s -- --beta
#
# Releases: https://github.com/flamez-hue/htx-skills-hub/releases
#   Initial release: https://github.com/flamez-hue/htx-skills-hub/releases/tag/v1.0.0
#
#   # Install from a local dist/ directory (built by ./build.sh):
#   HTX_LOCAL_DIST=./dist ./install.sh
#
# Behavior:
#   - Default (stable): fetches latest stable release from GitHub,
#     compares with local version, installs/upgrades if needed.
#   - --beta: fetches all tags, finds the latest version (including
#     pre-releases) by semver, and installs it.
#   - HTX_LOCAL_DIST=<path>: copies the matching binary from a local
#     dist directory instead of downloading. Useful for offline or
#     pre-release testing.
#   - Caches the last check timestamp. Skips GitHub API calls if
#     checked within the last 12 hours.
#
# Supported platforms:
#   macOS  : x86_64 (Intel), arm64 (Apple Silicon)
#   Linux  : x86_64, i686, aarch64, armv7l
#   Windows: see install.ps1 (PowerShell)
# ──────────────────────────────────────────────────────────────

REPO="${HTX_REPO:-flamez-hue/htx-skills-hub}"
BINARY="htx-cli"
INSTALL_DIR="$HOME/.local/bin"
CACHE_DIR="$HOME/.htx-cli"
CACHE_FILE="$CACHE_DIR/last_check"
CACHE_TTL=43200  # 12 hours in seconds

# ── Parse arguments ──────────────────────────────────────────
BETA_MODE=false
for arg in "$@"; do
  case "$arg" in
    --beta) BETA_MODE=true ;;
  esac
done

# ── Platform detection ───────────────────────────────────────
get_target() {
  os=$(uname -s)
  arch=$(uname -m)

  case "$os" in
    Darwin)
      case "$arch" in
        x86_64) echo "x86_64-apple-darwin" ;;
        arm64)  echo "aarch64-apple-darwin" ;;
        *) echo "Unsupported architecture: $arch" >&2; exit 1 ;;
      esac
      ;;
    Linux)
      case "$arch" in
        x86_64)  echo "x86_64-unknown-linux-gnu" ;;
        i686)    echo "i686-unknown-linux-gnu" ;;
        aarch64) echo "aarch64-unknown-linux-gnu" ;;
        armv7l)  echo "armv7-unknown-linux-gnueabihf" ;;
        *) echo "Unsupported architecture: $arch" >&2; exit 1 ;;
      esac
      ;;
    *) echo "Unsupported OS" >&2; exit 1 ;;
  esac
}

# ── Cache helpers ────────────────────────────────────────────
is_cache_fresh() {
  [ -f "$CACHE_FILE" ] || return 1
  cached_ts=$(head -1 "$CACHE_FILE" 2>/dev/null)
  [ -z "$cached_ts" ] && return 1
  now=$(date +%s)
  elapsed=$((now - cached_ts))
  [ "$elapsed" -lt "$CACHE_TTL" ]
}

write_cache() {
  mkdir -p "$CACHE_DIR"
  date +%s > "$CACHE_FILE"
}

# ── Version helpers ──────────────────────────────────────────
get_local_version() {
  if [ -x "$INSTALL_DIR/$BINARY" ]; then
    "$INSTALL_DIR/$BINARY" --version 2>/dev/null | awk '{print $NF}' | sed 's/^v//'
  fi
}

strip_prerelease() { echo "$1" | sed 's/-.*//'; }
_ver_field()       { echo "$1" | cut -d. -f"$2"; }

# Semver greater-than: returns 0 (true) if $1 > $2.
semver_gt() {
  base1=$(strip_prerelease "$1")
  base2=$(strip_prerelease "$2")
  pre1=$(echo "$1" | sed -n 's/[^-]*-//p')
  pre2=$(echo "$2" | sed -n 's/[^-]*-//p')

  for i in 1 2 3; do
    f1=$(_ver_field "$base1" "$i")
    f2=$(_ver_field "$base2" "$i")
    f1=${f1:-0}
    f2=${f2:-0}
    [ "$f1" -gt "$f2" ] 2>/dev/null && return 0
    [ "$f1" -lt "$f2" ] 2>/dev/null && return 1
  done

  [ -z "$pre1" ] && [ -z "$pre2" ] && return 1
  [ -z "$pre1" ] && return 0
  [ -z "$pre2" ] && return 1

  num1=$(echo "$pre1" | grep -o '[0-9]*$')
  num2=$(echo "$pre2" | grep -o '[0-9]*$')
  num1=${num1:-0}
  num2=${num2:-0}
  [ "$num1" -gt "$num2" ] 2>/dev/null && return 0
  return 1
}

# ── GitHub API helpers ───────────────────────────────────────
get_latest_stable_version() {
  response=$(curl -sSL --max-time 10 "https://api.github.com/repos/${REPO}/releases/latest" 2>/dev/null) || true
  ver=$(echo "$response" | grep -o '"tag_name": *"v[^"]*"' | head -1 | sed 's/.*"v\([^"]*\)".*/\1/')
  if [ -z "$ver" ]; then
    echo "Error: could not fetch latest version from GitHub." >&2
    echo "Check your network connection or install manually from https://github.com/${REPO}" >&2
    exit 1
  fi
  echo "$ver"
}

get_latest_version_with_beta() {
  response=$(curl -sSL --max-time 10 "https://api.github.com/repos/${REPO}/tags?per_page=100" 2>/dev/null) || true
  versions=$(echo "$response" | grep -o '"name": *"v[^"]*"' | sed 's/.*"v\([^"]*\)".*/\1/')

  if [ -z "$versions" ]; then
    echo "Error: could not fetch tags from GitHub." >&2
    exit 1
  fi

  best=""
  for v in $versions; do
    if [ -z "$best" ]; then
      best="$v"
    elif semver_gt "$v" "$best"; then
      best="$v"
    fi
  done

  [ -z "$best" ] && { echo "Error: no valid versions found in tags." >&2; exit 1; }
  echo "$best"
}

# ── sha256 helper ────────────────────────────────────────────
sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  else
    echo "Error: sha256sum or shasum is required to verify download" >&2
    exit 1
  fi
}

# ── Binary installer (remote) ────────────────────────────────
install_binary_remote() {
  target=$(get_target)
  tag="$1"
  binary_name="${BINARY}-${target}"
  url="https://github.com/${REPO}/releases/download/${tag}/${binary_name}"
  checksums_url="https://github.com/${REPO}/releases/download/${tag}/checksums.txt"

  echo "Installing ${BINARY} ${tag} (${target})..."

  tmpdir=$(mktemp -d)
  trap 'rm -rf "$tmpdir"' EXIT

  curl -fsSL "$url" -o "$tmpdir/$binary_name"
  curl -fsSL "$checksums_url" -o "$tmpdir/checksums.txt"

  expected_hash=$(grep " $binary_name\$" "$tmpdir/checksums.txt" | awk '{print $1}')
  if [ -z "$expected_hash" ]; then
    echo "Error: no checksum found for $binary_name" >&2
    exit 1
  fi

  actual_hash=$(sha256_of "$tmpdir/$binary_name")
  if [ "$actual_hash" != "$expected_hash" ]; then
    echo "Error: checksum mismatch!" >&2
    echo "  Expected: $expected_hash" >&2
    echo "  Got:      $actual_hash" >&2
    exit 1
  fi
  echo "Checksum verified."

  mkdir -p "$INSTALL_DIR"
  mv "$tmpdir/$binary_name" "$INSTALL_DIR/$BINARY"
  chmod +x "$INSTALL_DIR/$BINARY"
  echo "Installed ${BINARY} ${tag} to ${INSTALL_DIR}/${BINARY}"
}

# ── Binary installer (local dist/) ───────────────────────────
install_binary_local() {
  dist_dir="$1"
  target=$(get_target)
  binary_name="${BINARY}-${target}"
  src="$dist_dir/$binary_name"

  if [ ! -f "$src" ]; then
    echo "Error: $src not found. Run ./build.sh first." >&2
    exit 1
  fi

  echo "Installing ${BINARY} from ${dist_dir} (${target})..."

  # Optional checksum verification if checksums.txt is present.
  if [ -f "$dist_dir/checksums.txt" ]; then
    expected_hash=$(grep " $binary_name\$" "$dist_dir/checksums.txt" | awk '{print $1}')
    if [ -n "$expected_hash" ]; then
      actual_hash=$(sha256_of "$src")
      if [ "$actual_hash" != "$expected_hash" ]; then
        echo "Error: checksum mismatch for $binary_name" >&2
        exit 1
      fi
      echo "Checksum verified."
    fi
  fi

  mkdir -p "$INSTALL_DIR"
  cp "$src" "$INSTALL_DIR/$BINARY"
  chmod +x "$INSTALL_DIR/$BINARY"
  echo "Installed ${BINARY} to ${INSTALL_DIR}/${BINARY}"
}

# ── PATH setup ───────────────────────────────────────────────
ensure_in_path() {
  case ":$PATH:" in
    *":$INSTALL_DIR:"*) return 0 ;;
  esac

  EXPORT_LINE="export PATH=\"\$HOME/.local/bin:\$PATH\""

  shell_name=$(basename "$SHELL" 2>/dev/null || echo "sh")
  case "$shell_name" in
    zsh)  profile="$HOME/.zshrc" ;;
    bash)
      if   [ -f "$HOME/.bash_profile" ]; then profile="$HOME/.bash_profile"
      elif [ -f "$HOME/.bashrc" ];       then profile="$HOME/.bashrc"
      else profile="$HOME/.profile"; fi
      ;;
    *)    profile="$HOME/.profile" ;;
  esac

  if [ -f "$profile" ] && grep -qF '$HOME/.local/bin' "$profile" 2>/dev/null; then
    return 0
  fi

  echo "" >> "$profile"
  echo "# Added by htx-cli installer" >> "$profile"
  echo "$EXPORT_LINE" >> "$profile"

  export PATH="$INSTALL_DIR:$PATH"

  echo ""
  echo "Added $INSTALL_DIR to PATH in $profile"
  echo "To start using '${BINARY}' now, run:"
  echo ""
  echo "  source $profile"
  echo ""
  echo "Or simply open a new terminal window."
}

# ── Main ─────────────────────────────────────────────────────
main() {
  # Local dist path shortcut — skip GitHub entirely.
  if [ -n "$HTX_LOCAL_DIST" ]; then
    install_binary_local "$HTX_LOCAL_DIST"
    ensure_in_path
    return 0
  fi

  local_ver=$(get_local_version)

  if [ "$BETA_MODE" = true ]; then
    target_ver=$(get_latest_version_with_beta)
    if [ "$local_ver" = "$target_ver" ]; then
      write_cache
      return 0
    fi
  else
    if [ -n "$local_ver" ] && is_cache_fresh; then
      return 0
    fi

    latest_stable=$(get_latest_stable_version)

    if [ -z "$local_ver" ]; then
      target_ver="$latest_stable"
    elif [ "$local_ver" = "$latest_stable" ]; then
      write_cache
      return 0
    else
      if semver_gt "$latest_stable" "$local_ver"; then
        target_ver="$latest_stable"
      else
        write_cache
        return 0
      fi
    fi
  fi

  if [ -n "$local_ver" ]; then
    echo "Updating ${BINARY} from ${local_ver} to ${target_ver}..."
  fi

  install_binary_remote "v${target_ver}"
  write_cache
  ensure_in_path
}

main
