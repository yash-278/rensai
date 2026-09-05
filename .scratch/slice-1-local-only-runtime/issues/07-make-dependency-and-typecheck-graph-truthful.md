> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# 07 — Make the dependency and typecheck graph truthful

**What to build:** Finish Slice 1's mechanical cleanup after capability removal: make dependency ownership accurate, establish a green typecheck command, remove unused test and polyfill remnants, and leave every retained advisory or privileged compatibility layer explicitly owned by a later slice.

**Blocked by:** 06 — Remove Online Sources and executable Extensions.

**Status:** superseded

- [ ] One root typecheck command covers the desktop main, preload, renderer, shared packages, and relevant build configuration and passes without errors.
- [ ] Duplicate React 16/18 test typings and unused Enzyme-era remnants are removed unless a current executable test owns them.
- [ ] The existing local type errors are fixed without weakening compiler settings or adding blanket suppressions.
- [ ] Renderer Node polyfills with no remaining import owner are removed from configuration, manifests, canonical lockfile, and built output.
- [ ] Any polyfill or privileged renderer import that must wait for the atomic Slice 3 boundary is named, justified, and linked to that slice rather than silently accepted.
- [ ] Every direct production dependency has an active code owner; orphaned direct and transitive packages are removed.
- [ ] The canonical lockfile contains only active workspaces and resolves through a clean frozen installation with the repository-pinned package manager.
- [ ] Retained packages use current compatible patched releases where that does not begin the major toolchain migration reserved for Slice 4.
- [ ] Production and full-graph audit results are recorded with every remaining high/critical path mapped to its owning later slice; no broad audit fix, suppression, or unexplained override is used.
- [ ] Root lint, root typecheck, and desktop production build pass.
