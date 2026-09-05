> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# 06 — Remove Online Sources and executable Extensions

**What to build:** Contract the inherited content architecture to the verified Local Content adapter by removing Online Source browsing and the complete executable Extension lifecycle. Rensai must not discover, install, load, reload, configure, update, or execute third-party source code.

**Blocked by:** 05 — Isolate Local Content from the Extension runtime.

**Status:** superseded

- [ ] Online Source search, directory browsing, filters, previews, and add-series flows are absent from the Personal Alpha UI.
- [ ] Extension installation, uninstallation, update checks, reload actions, and settings surfaces are absent.
- [ ] Plugin discovery, package loading, dynamic evaluation, external Extension dispatch, and Extension-owned network/image helpers are deleted from the active runtime.
- [ ] Startup never scans, copies, imports, or executes an inherited Houdoku plugin directory.
- [ ] The spoof browser window and every handler or dependency owned only by external Extension execution are absent.
- [ ] The executable plugin manager and its transitive package tree are absent from manifests, canonical lockfile, built output, and package inventory.
- [ ] The first-party Local Content adapter remains functional and is the only active content-source implementation.
- [ ] The offline Local Content checkpoint, frozen installation, lint, explicit desktop typecheck baseline, and desktop production build pass.
- [ ] Online Sources and executable Extensions are added separately to the deferred-capabilities register with reintroduction gates.
