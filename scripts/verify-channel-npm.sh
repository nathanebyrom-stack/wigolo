#!/usr/bin/env bash
# Channel verification — npm (npx / npm i -g) — slice S-P1-MATRIX.
#
# Builds a local tarball with `npm pack`, installs it globally into a THROWAWAY
# prefix (NPM_CONFIG_PREFIX pointed at a temp dir — never touches the real global
# tree), and asserts the packed CLI is healthy:
#
#   1. <prefix>/bin/wigolo --version == package.json version
#   2. <prefix>/bin/wigolo doctor exits 0 (fresh temp WIGOLO_DATA_DIR)
#
# Then uninstalls and removes every temp dir. Exits 0 only if both asserts pass.
#
# A `prepack` script runs the full build on every `npm pack`, so the tarball
# always carries dist/ with declarations. This pre-builds only to keep the pack
# step from repeating the work, and to fail loudly here if the build is broken.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

PKG_VERSION="$(node -p "require('./package.json').version")"
PKG_NAME="$(node -p "require('./package.json').name")"

WORK_DIR="$(mktemp -d)"
PREFIX_DIR="$(mktemp -d)"
DATA_DIR="$(mktemp -d)"

cleanup() {
  # Best-effort uninstall from the throwaway prefix, then wipe every temp dir.
  NPM_CONFIG_PREFIX="$PREFIX_DIR" npm uninstall -g "$PKG_NAME" >/dev/null 2>&1 || true
  rm -rf "$WORK_DIR" "$PREFIX_DIR" "$DATA_DIR"
}
trap cleanup EXIT

log() { printf '[verify-npm] %s\n' "$*" >&2; }
fail() { printf '[verify-npm] FAIL: %s\n' "$*" >&2; exit 1; }

log "package: $PKG_NAME@$PKG_VERSION"
log "throwaway prefix: $PREFIX_DIR"
log "fresh data dir:   $DATA_DIR"

# Build up front so a failure surfaces here rather than inside npm pack. The
# prepack hook would build anyway; this keeps it from running twice.
if [ ! -f "$REPO_ROOT/dist/index.js" ]; then
  log "dist/ missing — building"
  npm run build:all >&2
fi

log "npm pack -> $WORK_DIR"
TARBALL="$(cd "$WORK_DIR" && npm pack "$REPO_ROOT" 2>/dev/null | tail -n1)"
[ -n "$TARBALL" ] || fail "npm pack produced no tarball"
TARBALL_PATH="$WORK_DIR/$TARBALL"
[ -f "$TARBALL_PATH" ] || fail "tarball not found at $TARBALL_PATH"
log "packed: $TARBALL"

log "npm i -g into throwaway prefix (real global untouched)"
NPM_CONFIG_PREFIX="$PREFIX_DIR" npm install -g "$TARBALL_PATH" >&2

BIN="$PREFIX_DIR/bin/wigolo"
[ -x "$BIN" ] || fail "installed shim not executable at $BIN"

# Assertion 1: --version reports the package.json version.
# `wigolo --version` prints "wigolo <version>", so assert the version substring
# (the 0.0.0 fallback would surface a build/depth-shim regression).
GOT_VERSION="$("$BIN" --version 2>/dev/null)"
case "$GOT_VERSION" in
  *"$PKG_VERSION"*) log "PASS --version reports $PKG_VERSION ('$GOT_VERSION')" ;;
  *) fail "--version mismatch: got '$GOT_VERSION', want to contain '$PKG_VERSION'" ;;
esac

# Assertion 2: doctor exits 0 against a fresh, isolated data dir.
if WIGOLO_DATA_DIR="$DATA_DIR" "$BIN" doctor >&2; then
  log "PASS doctor exit 0 (fresh WIGOLO_DATA_DIR)"
else
  fail "doctor exited non-zero"
fi

log "ALL CHECKS PASS (npm channel, $PKG_NAME@$PKG_VERSION)"
