> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# 01 — Add the offline Local Content checkpoint

**What to build:** Create one reusable, highest-level checkpoint that proves Rensai can launch, import representative Local Content, browse it, read it, mark progress, close, and reopen without any network access. This is the behavioral safety net used after every remaining Slice 1 removal.

**Blocked by:** None — can start immediately.

**Status:** superseded

- [ ] The committed synthetic corpus includes a representative Unicode folder, ZIP, and CBZ with non-copyrighted generated page images.
- [ ] One documented command launches the desktop application in a controlled test profile and exercises import, library display, and reader opening.
- [ ] The checkpoint exercises Single, Double, and Long Strip modes plus local chapter completion/read state.
- [ ] Closing and reopening the tested journey preserves the inherited persistence behavior expected at this slice.
- [ ] Network access is denied or intercepted for the entire run, and any unexpected request fails the checkpoint.
- [ ] The test uses no private user paths, credentials, real manga pages, or existing Houdoku/Rensai application data.
- [ ] Failure output is actionable and does not expose private absolute paths.
- [ ] Existing frozen install, lint, and desktop production build remain green.
