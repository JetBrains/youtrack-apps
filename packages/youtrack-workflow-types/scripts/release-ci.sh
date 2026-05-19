#!/usr/bin/env bash
set -euo pipefail

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
PKG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PKG_DIR"

# Read current version from package.json (no jq dependency).
CURRENT_VERSION="$(node -p "require('./package.json').version")"

if [ "${NPM_DIST_TAG:-}" != "" ]; then
  TAG_RAW="$NPM_DIST_TAG"
  TAG_SANITIZED="$(echo "$TAG_RAW" | tr '/_ ' '---' | tr -cd '[:alnum:].-')"

  echo "Publishing version '$CURRENT_VERSION' under dist-tag '${TAG_SANITIZED}' (latest won't be affected)."

  npm publish --tag "$TAG_SANITIZED"
else
  if [ "$BRANCH" = "main" ]; then
    echo "Publishing version '$CURRENT_VERSION' as 'latest'."
    npm publish
  else
    echo "Refusing to publish from non-main without NPM_DIST_TAG. Branch: '$BRANCH', version: '$CURRENT_VERSION'."
    echo "Set NPM_DIST_TAG (e.g., 'experimental') to publish the checked-in version under that dist-tag without moving 'latest'."
    exit 1
  fi
fi
