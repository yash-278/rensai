> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# 02 — Prove the updater, Discord, and tracker-free checkpoint

**What to build:** Turn the existing updater, Discord presence, and manga tracker removals into a fully verified product checkpoint: local reading works, those integrations cannot start or appear in the UI, their credentials are not loaded, and their dependency trees are absent.

**Blocked by:** 01 — Add the offline Local Content checkpoint.

**Status:** superseded

- [ ] Application startup performs no automatic update, Discord, AniList, MyAnimeList, or MangaUpdates operation.
- [ ] Update actions/dialogs, Discord settings, tracker authentication/settings, series-linking controls, and automatic progress sync are absent from the active UI.
- [ ] Tracker tokens and removed integration settings are never read, logged, transmitted, or included in normal runtime initialization.
- [ ] Source, package manifests, the canonical lockfile, and built output contain no removed updater, Discord, or tracker runtime/package owner.
- [ ] Local chapter completion still updates the local library without an external side effect.
- [ ] The offline Local Content checkpoint passes.
- [ ] Frozen installation, root lint, explicit desktop typecheck baseline capture, and desktop production build results are recorded.
- [ ] The deferred-capabilities register contains automatic updates, Discord presence, and manga trackers with clear reintroduction gates.
