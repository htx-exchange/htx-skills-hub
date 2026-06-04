#!/bin/sh
set -e

# ──────────────────────────────────────────────────────────────
# htx-cli cross-compile build script
#
# Builds release binaries for macOS, Linux, and Windows,
# then writes SHA256 checksums.txt alongside them.
#
# Usage:
#   ./build.sh                  # build all targets, version from git
#   ./build.sh v1.2.3           # build all targets with explicit version
#   VERSION=v1.2.3 ./build.sh   # same, via env
#
# Output layout:
#   dist/
#     htx-cli-x86_64-apple-darwin
#     htx-cli-aarch64-apple-darwin
#     htx-cli-x86_64-unknown-linux-gnu
#     htx-cli-aarch64-unknown-linux-gnu
#     htx-cli-armv7-unknown-linux-gnueabihf
#     htx-cli-i686-unknown-linux-gnu
#     htx-cli-x86_64-pc-windows-msvc.exe
#     htx-cli-aarch64-pc-windows-msvc.exe
#     checksums.txt
# ──────────────────────────────────────────────────────────────

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
SRC_DIR="$SCRIPT_DIR/agent-harness-go"
DIST_DIR="$SCRIPT_DIR/dist"
PKG="./cmd/htx-cli"
BIN_NAME="htx-cli"

# ── Resolve version ──────────────────────────────────────────
if [ -n "$1" ]; then
  VERSION="$1"
elif [ -n "$VERSION" ]; then
  :
elif command -v git >/dev/null 2>&1 && git -C "$SCRIPT_DIR" rev-parse --git-dir >/dev/null 2>&1; then
  VERSION=$(git -C "$SCRIPT_DIR" describe --tags --always --dirty 2>/dev/null || echo "dev")
else
  VERSION="dev"
fi

echo "Building htx-cli ${VERSION}"
echo "Source:  $SRC_DIR"
echo "Output:  $DIST_DIR"
echo ""

if [ ! -d "$SRC_DIR" ]; then
  echo "Error: source directory not found: $SRC_DIR" >&2
  exit 1
fi

# Locate `go`: PATH first, then a few common install locations.
GO_BIN="${GO_BIN:-}"
if [ -z "$GO_BIN" ]; then
  if command -v go >/dev/null 2>&1; then
    GO_BIN=$(command -v go)
  else
    for candidate in \
      "$HOME/go-sdk/go/bin/go" \
      "/usr/local/go/bin/go" \
      "/opt/homebrew/bin/go" \
      "/opt/homebrew/opt/go/bin/go"; do
      if [ -x "$candidate" ]; then GO_BIN="$candidate"; break; fi
    done
  fi
fi
if [ -z "$GO_BIN" ] || [ ! -x "$GO_BIN" ]; then
  echo "Error: 'go' not found. Install Go 1.23+ from https://go.dev/dl/ or set GO_BIN=/path/to/go" >&2
  exit 1
fi
echo "Using Go:  $("$GO_BIN" version)"
echo ""

mkdir -p "$DIST_DIR"
rm -f "$DIST_DIR"/${BIN_NAME}-* "$DIST_DIR/checksums.txt"

# Strip debug info for smaller release binaries.
LDFLAGS="-s -w"

# target_triple  GOOS   GOARCH  GOARM  extension
TARGETS="\
x86_64-apple-darwin|darwin|amd64||
aarch64-apple-darwin|darwin|arm64||
x86_64-unknown-linux-gnu|linux|amd64||
aarch64-unknown-linux-gnu|linux|arm64||
armv7-unknown-linux-gnueabihf|linux|arm|7|
i686-unknown-linux-gnu|linux|386||
x86_64-pc-windows-msvc|windows|amd64||.exe
aarch64-pc-windows-msvc|windows|arm64||.exe"

# ── Build loop ───────────────────────────────────────────────
cd "$SRC_DIR"

echo "$TARGETS" | while IFS='|' read -r target goos goarch goarm ext; do
  [ -z "$target" ] && continue
  out="${DIST_DIR}/${BIN_NAME}-${target}${ext}"
  printf "→ %-40s " "$target"

  env_prefix="CGO_ENABLED=0 GOOS=$goos GOARCH=$goarch"
  [ -n "$goarm" ] && env_prefix="$env_prefix GOARM=$goarm"

  # shellcheck disable=SC2086
  if env $env_prefix "$GO_BIN" build -trimpath -ldflags "$LDFLAGS" -o "$out" "$PKG"; then
    echo "ok"
  else
    echo "FAILED"
    exit 1
  fi
done

# ── Package archives for GitHub release ──────────────────────
# install.sh consumes the raw binaries + checksums.txt directly,
# but human downloads want .tar.gz / .zip with the README inside.
echo ""
echo "Packaging archives..."
cd "$DIST_DIR"

README_SRC="$SRC_DIR/README.md"

pack_archive() {
  target="$1"
  ext="$2"        # "" for unix, ".exe" for windows
  archive_ext="$3" # "tar.gz" or "zip"

  bin="${BIN_NAME}-${target}${ext}"
  [ -f "$bin" ] || return 0

  stage="pack-${target}"
  rm -rf "$stage"
  mkdir -p "$stage"
  cp "$bin" "$stage/${BIN_NAME}${ext}"
  [ -f "$README_SRC" ] && cp "$README_SRC" "$stage/README.md"

  case "$archive_ext" in
    tar.gz)
      tar -czf "${BIN_NAME}-${VERSION}-${target}.tar.gz" -C "$stage" .
      ;;
    zip)
      if command -v zip >/dev/null 2>&1; then
        rm -f "${BIN_NAME}-${VERSION}-${target}.zip"
        (cd "$stage" && zip -q -r "../${BIN_NAME}-${VERSION}-${target}.zip" .)
      else
        echo "  warn: 'zip' not found, skipping ${target}.zip" >&2
      fi
      ;;
  esac
  rm -rf "$stage"
}

pack_archive x86_64-apple-darwin               ""     tar.gz
pack_archive aarch64-apple-darwin              ""     tar.gz
pack_archive x86_64-unknown-linux-gnu          ""     tar.gz
pack_archive aarch64-unknown-linux-gnu         ""     tar.gz
pack_archive armv7-unknown-linux-gnueabihf     ""     tar.gz
pack_archive i686-unknown-linux-gnu            ""     tar.gz
pack_archive x86_64-pc-windows-msvc            ".exe" zip
pack_archive aarch64-pc-windows-msvc           ".exe" zip

# ── Generate checksums (binaries + archives) ─────────────────
echo ""
echo "Generating checksums..."

if command -v sha256sum >/dev/null 2>&1; then
  SHA_CMD="sha256sum"
elif command -v shasum >/dev/null 2>&1; then
  SHA_CMD="shasum -a 256"
else
  echo "Error: sha256sum or shasum required" >&2
  exit 1
fi

# Produce GNU-style "<hash>  <filename>" output, sorted.
# Covers both raw binaries (used by install.sh) and archives (human downloads).
: > checksums.txt
for f in ${BIN_NAME}-*; do
  [ -f "$f" ] || continue
  $SHA_CMD "$f" | awk '{print $1"  "$2}' >> checksums.txt
done

sort -k2 checksums.txt -o checksums.txt

echo ""
echo "Artifacts in $DIST_DIR:"
ls -lh "$DIST_DIR" | grep -v '^total'
echo ""
echo "checksums.txt:"
cat "$DIST_DIR/checksums.txt"
echo ""
echo "Done. Upload everything in $DIST_DIR to the GitHub release for tag ${VERSION}."
