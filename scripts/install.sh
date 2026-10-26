#!/usr/bin/env bash
# HTX CLI installer — downloads the correct binary for your platform, verifies its
# SHA256 against the release's SHA256SUMS, then installs it and optionally installs a skill.
# Verification is mandatory: any failure aborts before the binary is made executable.
#
# Usage:
#   curl -fsSL https://github.com/htx-exchange/htx-skills-hub/releases/latest/download/install.sh | bash
#   curl -fsSL https://github.com/htx-exchange/htx-skills-hub/releases/latest/download/install.sh | bash -s -- spot-market
#
# Pin a version (recommended):
#   HTX_VERSION=v0.1.0 bash install.sh
#
# Env:
#   HTX_VERSION      release tag to install (default: latest)
#   HTX_INSTALL_DIR  install directory (default: $HOME/.local/bin)

set -euo pipefail

REPO="htx-exchange/htx-skills-hub"
INSTALL_DIR="${HTX_INSTALL_DIR:-$HOME/.local/bin}"
VERSION="${HTX_VERSION:-latest}"

die() { echo "ERROR: $*" >&2; exit 1; }

detect_platform() {
  local os arch
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"

  case "$os" in
    darwin) os="darwin" ;;
    linux)  os="linux" ;;
    mingw*|msys*|cygwin*) os="windows" ;;
    *) die "Unsupported OS: $os" ;;
  esac

  case "$arch" in
    x86_64|amd64) arch="x64" ;;
    arm64|aarch64) arch="arm64" ;;
    *) die "Unsupported architecture: $arch" ;;
  esac

  echo "${os}-${arch}"
}

sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  else
    die "Neither sha256sum nor shasum found; cannot verify download"
  fi
}

main() {
  local platform bin_name base_url tmp expected actual target skill_name="${1:-}"

  platform="$(detect_platform)"
  bin_name="htx-cli-${platform}"
  target="${INSTALL_DIR}/htx-cli"
  if [[ "$platform" == windows-* ]]; then
    bin_name="${bin_name}.exe"
    target="${target}.exe"
  fi

  if [[ "$VERSION" == "latest" ]]; then
    base_url="https://github.com/${REPO}/releases/latest/download"
    echo "WARNING: HTX_VERSION not set, installing 'latest'. Pin a version for reproducible installs." >&2
  else
    base_url="https://github.com/${REPO}/releases/download/${VERSION}"
  fi

  tmp="$(mktemp -d)"
  trap "rm -rf '${tmp}'" EXIT

  echo "Detected platform: ${platform}"
  echo "Downloading ${bin_name} (${VERSION}) from ${base_url} ..."

  curl -fsSL "${base_url}/${bin_name}" -o "${tmp}/${bin_name}" \
    || die "Failed to download ${bin_name}"
  curl -fsSL "${base_url}/SHA256SUMS" -o "${tmp}/SHA256SUMS" \
    || die "Failed to download SHA256SUMS; refusing to install an unverified binary"

  expected="$(awk -v f="$bin_name" '{n=$2; sub(/^\*/, "", n)} n==f {print $1; exit}' "${tmp}/SHA256SUMS")"
  [[ -n "$expected" ]] || die "No checksum entry for ${bin_name} in SHA256SUMS"

  actual="$(sha256_of "${tmp}/${bin_name}")"
  if [[ "$actual" != "$expected" ]]; then
    die "SHA256 mismatch for ${bin_name}
  expected: ${expected}
  actual:   ${actual}
Aborting; nothing was installed."
  fi
  echo "SHA256 verified: ${actual}"

  # Optional out-of-band check: SHA256SUMS ships in the same release as the binary, so it
  # cannot detect a compromised release. A build-provenance attestation can.
  if [[ "${HTX_REQUIRE_ATTESTATION:-0}" == "1" ]]; then
    command -v gh >/dev/null 2>&1 \
      || die "HTX_REQUIRE_ATTESTATION=1 needs the GitHub CLI (gh); install it or unset the variable"
    gh attestation verify "${tmp}/${bin_name}" --repo "$REPO" \
      || die "Build provenance attestation verification failed for ${bin_name}"
    echo "Attestation verified"
  fi

  mkdir -p "$INSTALL_DIR"
  chmod +x "${tmp}/${bin_name}"
  mv -f "${tmp}/${bin_name}" "$target"

  echo "Installed htx-cli to ${target}"

  # Ensure INSTALL_DIR is in PATH hint
  if ! echo "$PATH" | tr ':' '\n' | grep -qx "$INSTALL_DIR"; then
    echo ""
    echo "Add to your PATH:"
    echo "  export PATH=\"${INSTALL_DIR}:\$PATH\""
    echo ""
  fi

  # If a skill name was passed, install it
  if [[ -n "$skill_name" ]]; then
    echo ""
    "$target" skill install "$skill_name"
  fi
}

main "$@"
