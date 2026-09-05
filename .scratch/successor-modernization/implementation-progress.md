> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Rensai Modernization Baseline implementation progress

Updated: 2026-08-29  
Status: superseded — historical reference only

Removed product behavior is tracked in [`deferred-capabilities.md`](deferred-capabilities.md). Removal from the Personal Alpha is not a permanent product rejection.
The remaining Slice 1 work is specified in [`issues/12-complete-slice-1-local-only-runtime-graph.md`](issues/12-complete-slice-1-local-only-runtime-graph.md) and labeled `ready-for-agent` in the local tracker.

## Working state

- Isolated worktree: `/private/tmp/rensai-slice1`
- Branch: `implementation/local-only-graph`
- Starting commit: `712563077fbc8ceea6b6f586cc1aec407b507cb6`
- Changes are intentionally uncommitted pending review. The planning checkout at `/Users/yash/Personal/houdoku` remains untouched apart from planning documentation.

## Completed capability clusters

### App updater and Discord presence

- Deleted the updater and Discord main-process services.
- Removed their IPC channels, startup hooks, dialogs, manual actions, settings, state, and renderer event listeners.
- Removed `electron-updater`, `discord-rpc`, and `@types/discord-rpc` from the active graph.
- Automatic publishing remains disabled and no replacement update channel was introduced.

### Manga trackers

- Deleted the AniList, MyAnimeList, and MangaUpdates clients and shared tracker interfaces/metadata.
- Removed tracker IPC, credential loading, stored token keys, authentication/settings screens, series-linking UI, and automatic reader progress synchronization.
- Removed `node-fetch`, `@types/node-fetch`, `pkce-challenge`, `formdata-node`, `jsdom`, and `@types/jsdom` because they had no remaining active owner.
- Chapter completion still updates the local library; it no longer performs a network side effect.

### Dependency graph corrections

- Deleted the redundant `apps/desktop/pnpm-lock.yaml`; the repository now has one canonical root lockfile.
- Regenerated the root graph with the repository-pinned pnpm 9. The regeneration also pruned stale deleted `apps/docs-new` and `apps/docs-old` workspace importers and their orphaned trees. The active `apps/docs` landing/docs workspace is retained.
- Upgraded the still-retained `form-data` dependency from `4.0.1` to the current patched `4.0.6` release.

## Checkpoint evidence

- `pnpm@9.0.0 install --frozen-lockfile`: passed; 847 packages in the post-tracker graph.
- Root `pnpm lint`: passed; desktop checked 94 files and UI checked 37 files.
- Desktop production build: passed for main, preload, and renderer.
- A full root build passed after the updater/Discord cluster. The later tracker cluster does not change the docs workspace; its desktop build passed independently.
- `git diff --check`: passed.
- Production audit: 160 advisories at the inherited baseline; 110 now (`12 low`, `52 moderate`, `42 high`, `4 critical`). No broad audit fix or suppression was used.

Inherited warnings remain visible rather than being treated as success: executable-plugin `eval`, stale Browserslist data, ignored `use client` directives/sourcemap warnings, and a roughly 1.64 MB renderer bundle. An explicit desktop `tsc --noEmit` is not yet a green gate because the inherited graph has duplicate React 16/18 type packages plus two local errors; the repository has no typecheck script yet.

## Remaining critical advisory ownership

- `tar` is owned by `aki-plugin-manager`; removing it requires separating first-party Local Content from the executable extension runtime.
- `pbkdf2` and `sha.js` are owned by the renderer Node-polyfill chain.

## Next bounded cluster

Remove remote download and remote cover/banner behavior while preserving local folder/archive reading. This should delete required network UI/state and make the later first-party Local Content adapter split smaller. Do not delete the executable extension runtime until the filesystem implementation has a successor-owned port to move behind; the Personal Alpha must not lose its only Local Content path between checkpoints.
