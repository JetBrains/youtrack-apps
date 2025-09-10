#!/usr/bin/env bash
set -euo pipefail

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
PKG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PKG_DIR"

# Read current version from package.json (no jq dependency)
CURRENT_VERSION="$(node -p "require('./package.json').version")"

if [ "${NPM_DIST_TAG:-}" != "" ]; then
  TAG_RAW="$NPM_DIST_TAG"
  # Sanitize dist-tag for npm/version prerelease id compatibility
  # Keep alnum, dot and dash; convert slashes/underscores/spaces to dash
  TAG_SANITIZED="$(echo "$TAG_RAW" | tr '/_ ' '---' | tr -cd '[:alnum:].-')"
  PRERELEASE_ID="$TAG_SANITIZED"

  echo "Tagged release (NPM_DIST_TAG='${TAG_RAW}', prerelease id='${PRERELEASE_ID}')."
  echo "Creating prerelease and publishing under dist-tag '${TAG_SANITIZED}' (latest won't be affected)."

  npx commit-and-tag-version --prerelease "$PRERELEASE_ID"

  git push --follow-tags

  npm publish --tag "$TAG_SANITIZED"

else
  if [ "$BRANCH" = "main" ]; then
    echo "Main release (no NPM_DIST_TAG): bumping patch and publishing as 'latest'."
    npx commit-and-tag-version --release-as patch
    git push --follow-tags origin main
    npm publish
  else
    echo "Refusing to publish from non-main without NPM_DIST_TAG. Branch: '$BRANCH', version: '$CURRENT_VERSION'."
    echo "Set NPM_DIST_TAG (e.g., 'experimental') to create a tagged prerelease that won't move 'latest'."
    exit 1
  fi
fi
