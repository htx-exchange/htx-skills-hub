#!/usr/bin/env bash
# HTX CLI installer — downloads the correct binary for your platform and optionally installs a skill.
# Usage:
#   curl -fsSL https://github.com/htx-exchange/htx-skills-hub/releases/latest/download/install.sh | bash
#   curl -fsSL https://github.com/htx-exchange/htx-skills-hub/releases/latest/download/install.sh | bash -s -- spot-market

set -euo pipefail

REPO="htx-exchange/htx-skills-hub"
INSTALL_DIR="${HTX_INSTALL_DIR:-$HOME/.local/bin}"

detect_platform() {
  local os arch
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"

  case "$os" in
    darwin) os="darwin" ;;
    linux)  os="linux" ;;
    mingw*|msys*|cygwin*) os="windows" ;;
    *) echo "Unsupported OS: $os" >&2; exit 1 ;;
  esac

  case "$arch" in
    x86_64|amd64) arch="x64" ;;
    arm64|aarch64) arch="arm64" ;;
    *) echo "Unsupported architecture: $arch" >&2; exit 1 ;;
  esac

  echo "${os}-${arch}"
}

main() {
  local platform bin_name url skill_name="${1:-}"

  platform="$(detect_platform)"
  bin_name="htx-cli-${platform}"
  if [[ "$platform" == windows-* ]]; then
    bin_name="${bin_name}.exe"
  fi

  url="https://github.com/${REPO}/releases/latest/download/${bin_name}"

  echo "Detected platform: ${platform}"
  echo "Downloading htx-cli from ${url} ..."

  mkdir -p "$INSTALL_DIR"
  curl -fsSL "$url" -o "${INSTALL_DIR}/htx-cli"
  chmod +x "${INSTALL_DIR}/htx-cli"

  echo "Installed htx-cli to ${INSTALL_DIR}/htx-cli"

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
    "${INSTALL_DIR}/htx-cli" skill install "$skill_name"
  fi
}

main "$@"
