> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# 03 — Remove remote chapter downloads

**What to build:** Remove the inherited remote chapter-download product path end to end while keeping direct reading of user-owned local folders and archives intact. The Personal Alpha should no longer expose or maintain a separate downloaded Online Source library.

**Blocked by:** 02 — Prove the updater, Discord, and tracker-free checkpoint.

**Status:** superseded

- [ ] Download actions, download dialogs, queue/progress UI, downloaded-content navigation, and deletion controls are absent.
- [ ] Download queue/state services and startup initialization are absent.
- [ ] Download-specific IPC, default/custom download-directory settings, path helpers, and downloaded-chapter bookkeeping are absent when they have no Local Content owner.
- [ ] The reader resolves pages from the selected Local Content source without consulting a downloaded-chapter cache.
- [ ] Removing a series or chapter state never deletes or modifies the user's source folder/archive.
- [ ] Packages and lockfile entries owned only by remote chapter downloads are removed.
- [ ] The offline Local Content checkpoint, frozen installation, lint, typecheck baseline, and desktop production build pass.
- [ ] Remote chapter downloads are added to the deferred-capabilities register with reintroduction gates.
