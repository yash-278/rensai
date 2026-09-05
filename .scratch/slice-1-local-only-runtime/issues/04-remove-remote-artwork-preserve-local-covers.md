> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# 04 — Remove remote artwork while preserving local covers

**What to build:** Make library artwork local-only: remove third-party cover/banner lookup and caching while retaining an explicitly selected local cover image and a stable placeholder when no usable local cover exists.

**Blocked by:** 02 — Prove the updater, Discord, and tracker-free checkpoint.

**Status:** superseded

- [ ] Opening the library or series details performs no AniList or other remote artwork request.
- [ ] Remote cover/banner lookup services, cache download/delete handlers, and network-only artwork dependencies are absent.
- [ ] A reader can explicitly select a supported local image as a series cover without a network request.
- [ ] Legacy metadata containing an HTTP(S) artwork value renders a safe placeholder and never fetches that value.
- [ ] Missing, moved, corrupt, or unsupported local cover images fall back safely without breaking library or series views.
- [ ] Local cover handling cannot escape the user-selected source/grant behavior expected at this slice and never modifies the source image.
- [ ] The offline Local Content checkpoint, frozen installation, lint, typecheck baseline, and desktop production build pass.
- [ ] Remote artwork is added to the deferred-capabilities register with reintroduction gates.
