# Release and publish an app with GitHub Actions

Three separate things, often confused:

| Action | What it changes | How |
| --- | --- | --- |
| **Deploy** | One YouTrack instance | `youtrack-app app upload --host … --token …` |
| **Release** | A GitHub tag and downloadable app zip | the manual `release.yml` workflow below |
| **Publish** | The [JetBrains Marketplace](https://plugins.jetbrains.com/youtrack_app) listing, so any instance can install and update it | First version through the UI; later versions through manual `publish-marketplace.yml` |

Release and publish are two distinct, manually triggered steps. **Release is independently useful and
does not imply publication.** Publish is optional, only consumes an already-released zip, and must
never be a side effect of a push, merge, or ordinary GitHub release. A Marketplace version cannot
be reused, and every submitted version waits for YouTrack-team moderation (normally 2–5 business days).

Version ownership is intentionally separate: `release.yml` accepts or bumps the version and records
it in `package.json` and `manifest.json`; `publish-marketplace.yml` never changes a version. It only
downloads `app-<version>.zip` from an existing GitHub release and uploads that exact artifact.

## When to propose setup

For a newly finished app, run `git remote get-url origin` and inspect
`.github/workflows/release.yml`; inspect `.github/workflows/publish-marketplace.yml` only if
Marketplace distribution is desired or already configured.

- If `origin` is a GitHub remote, or `origin` does not exist yet, and `release.yml` is missing,
  explain that release automation is available and offer to add it.
- If Marketplace distribution is in scope and `publish-marketplace.yml` is missing, offer that
  workflow separately. Its absence must not block or diminish a GitHub release.
- Do not create a GitHub repository, workflows, secret, Marketplace listing, release, or upload
  without the user's request.
- A non-GitHub remote is not a reason to add GitHub Actions unprompted; explain the option only if
  relevant.

## Prepare the project

Before creating a release:

| Item | Requirement |
| --- | --- |
| `manifest.json` `name` | Freeze it before the first publish. Renaming it orphans installations and stored data. |
| Version | `major.minor.patch`; it must match `package.json`. |
| `title`, `description`, `url` | Marketplace-facing metadata. The description accepts basic HTML. |
| `vendor` | `name` required; use real `url` and `email`, not template placeholders. |
| `icon` | Root-level SVG or PNG. An SVG should have explicit `width`/`height` as well as `viewBox`. |
| Packed zip | `manifest.json` must be at the zip root, not under a directory. |

The project needs a `pack` script that produces `app.zip`, for example:

```json
"pack": "rm -f app.zip && cd dist && npx --yes bestzip ../app.zip *"
```

Check the package before any upload:

```bash
unzip -l app.zip | grep ' manifest.json$'
```

## Add the release workflow

Create `.github/workflows/release.yml`. It is manual, accepts an explicit version or bumps the
patch, tests and packs the app, commits the synchronized `package.json` and `manifest.json`, tags
the commit, and attaches exactly that zip to a GitHub release.

```yaml
name: Release

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version as major.minor.patch. Leave empty to bump the patch.'
        required: false
        type: string
      notes:
        description: "What's new in this release"
        required: false
        type: string

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 24

      # Install from the lockfile: plain install can lose Rollup's platform binary.
      - run: npm ci --no-audit --no-fund

      - name: Set the version
        id: version
        env:
          INPUT_VERSION: ${{ inputs.version }}
        run: |
          set -e
          if [ -n "$INPUT_VERSION" ]; then
            case "$INPUT_VERSION" in
              [0-9]*.[0-9]*.[0-9]*) ;;
              *) echo "Version must be major.minor.patch, got '$INPUT_VERSION'" >&2; exit 1 ;;
            esac
            npm version "$INPUT_VERSION" --no-git-tag-version --allow-same-version >/dev/null
          else
            npm version patch --no-git-tag-version >/dev/null
          fi
          VERSION=$(node -p "require('./package.json').version")
          # Marketplace displays manifest.json's version, so synchronize it.
          node -e "
            const fs = require('fs');
            const m = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
            m.version = process.argv[1];
            fs.writeFileSync('manifest.json', JSON.stringify(m, null, 2) + '\\n');
          " "$VERSION"
          echo "version=$VERSION" >> "$GITHUB_OUTPUT"

      - run: npm test
      - run: npm run build

      - name: Pack
        env:
          VERSION: ${{ steps.version.outputs.version }}
        run: |
          npm run pack
          mv app.zip "app-$VERSION.zip"
          unzip -l "app-$VERSION.zip" | grep -q ' manifest.json$'

      - name: Commit and tag
        env:
          VERSION: ${{ steps.version.outputs.version }}
        run: |
          git config user.name 'github-actions[bot]'
          git config user.email 'github-actions[bot]@users.noreply.github.com'
          git commit -am "Release $VERSION" || echo 'Version unchanged, tagging the current commit'
          git tag "v$VERSION"
          # --follow-tags skips lightweight tags, so push this tag explicitly.
          git push origin HEAD "v$VERSION"

      - name: Publish the release
        env:
          GH_TOKEN: ${{ github.token }}
          VERSION: ${{ steps.version.outputs.version }}
          NOTES: ${{ inputs.notes }}
        run: |
          if [ -n "$NOTES" ]; then
            gh release create "v$VERSION" "app-$VERSION.zip" --title "$VERSION" --notes "$NOTES"
          else
            gh release create "v$VERSION" "app-$VERSION.zip" --title "$VERSION" --generate-notes
          fi
```

`permissions: contents: write` is necessary for the workflow token to push and create a release.
Attach only the app zip; an explicit `gh release create` file list prevents unwanted source archives.

## Optional Marketplace publication: first version is manual

The Marketplace upload API can only update an existing listing. The first version must be submitted
by a person:

1. Sign in to [plugins.jetbrains.com](https://plugins.jetbrains.com) with a JetBrains Account.
2. Choose **Build Plugins** → **Upload plugin** and select **YouTrack** under *Plugin For*.
3. Upload the zip from the GitHub release, fill in the listing details, and submit it.
4. After approval, copy the numeric plugin id from
   `https://plugins.jetbrains.com/plugin/<pluginId>-<slug>`.
5. Create a permanent [Marketplace token](https://plugins.jetbrains.com/author/me/tokens), then put
   it in the repository secret `MARKETPLACE_TOKEN`. This is not a YouTrack permanent token.

Never put a token in a command line, Git history, or agent transcript. If using `gh`, pipe a local
file into it rather than relying on an interactive prompt, which may silently save an empty secret:

```bash
gh secret set MARKETPLACE_TOKEN < token.txt && rm token.txt
```

The plugin id is public and belongs in the workflow. The token is secret and must not be committed.

## Add the optional Marketplace publishing workflow

Once the listing and its numeric id exist, create
`.github/workflows/publish-marketplace.yml`. It downloads the exact release asset rather than
building a fresh zip, then submits it to Marketplace.

```yaml
name: Publish to Marketplace

# Manual only: publish an already-released zip to JetBrains Marketplace.
on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Released version to publish, e.g. 1.0.0'
        required: true
        type: string
      channel:
        description: 'Marketplace channel. Stable if empty.'
        required: false
        type: string

env:
  # Public id from https://plugins.jetbrains.com/plugin/<pluginId>-<slug>.
  PLUGIN_ID: '00000'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Download the release asset
        env:
          GH_TOKEN: ${{ github.token }}
          GH_REPO: ${{ github.repository }}
          VERSION: ${{ inputs.version }}
        run: |
          gh release download "v$VERSION" --pattern "app-$VERSION.zip"
          unzip -l "app-$VERSION.zip" | grep -q ' manifest.json$'

      - name: Upload to Marketplace
        env:
          TOKEN: ${{ secrets.MARKETPLACE_TOKEN }}
          VERSION: ${{ inputs.version }}
          CHANNEL: ${{ inputs.channel }}
        run: |
          if [ -z "$TOKEN" ]; then
            echo 'MARKETPLACE_TOKEN secret is not set' >&2
            exit 1
          fi
          # Without --fail-with-body, curl treats an HTTP error as a successful job.
          curl -sS --fail-with-body \
            -H "Authorization: Bearer $TOKEN" \
            -F "pluginId=$PLUGIN_ID" \
            -F "file=@app-$VERSION.zip" \
            -F "channel=$CHANNEL" \
            https://plugins.jetbrains.com/api/updates/upload
          echo
          echo "Submitted $VERSION for moderation: https://plugins.jetbrains.com/plugin/$PLUGIN_ID"
```

Replace `00000` only with the listing's numeric id. An empty channel means Stable; another name
such as `eap` creates an opt-in pre-release channel. The upload API also accepts
`-F isHidden=true` to leave an approved update unreleased until a person exposes it.

## Run and check a release

Workflow-dispatch workflows appear in GitHub Actions only after their files are on the default
branch. Run a release whenever a versioned GitHub artifact is needed:

```bash
gh workflow run release.yml -f version=1.0.1 -f notes="- What changed."
gh run watch "$(gh run list --workflow=release.yml --limit 1 --json databaseId --jq '.[0].databaseId')" --exit-status
```

If, separately, the released version should go to Marketplace, run the optional publishing workflow
after the release has succeeded:

```bash
gh workflow run publish-marketplace.yml -f version=1.0.1

# Or send a pre-release to a channel.
gh workflow run publish-marketplace.yml -f version=1.0.1 -f channel=eap
```

Both workflows can instead be started from **Actions** → workflow → **Run workflow**. A successful
Marketplace upload means *accepted for moderation*, not live. Each version waits for review, and
YouTrack administrators install an approved update manually from **Administration → Apps** → the
app's actions → **Check for updates**.

## Troubleshooting

| Symptom | Cause and response |
| --- | --- |
| `MARKETPLACE_TOKEN secret is not set` but `gh secret list` shows it | The secret was set empty. Pipe the real value in and reset it. |
| `401 Unauthorized` | A YouTrack token was used, or the Marketplace token was rotated. Replace the repository secret. |
| Marketplace rejects the version | That version was already uploaded. Bump and release a new version; Marketplace versions are single-use. |
| Package rejected | `manifest.json` is not at the zip root. Fix the pack script and verify with `unzip -l`. |
| Manual trigger absent | Commit the workflow to the default branch first. |
| `gh release download` finds nothing | The release asset name and workflow pattern disagree. Keep `app-$VERSION.zip` consistent. |
| Upload workflow is green but the listing does not show the update | The version is in moderation; normal review is 2–5 business days. |

## Sources

- [Plugin upload API](https://plugins.jetbrains.com/docs/marketplace/plugin-upload.html)
- [Install an App from Marketplace](https://www.jetbrains.com/help/youtrack/devportal/install-apps-from-marketplace.html)
