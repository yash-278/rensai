> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Complete Slice 1: local-only runtime and dependency graph

Type: implementation  
Status: superseded — historical reference only
Label: superseded
Blocked by: 01, 02, 04, 05, 06, 07, 09, 10, 11

## Problem Statement

As Rensai's owner and first user, Yash needs the inherited Houdoku application reduced to a truthful local-only foundation before deeper modernization begins. The inherited runtime mixes the useful Local Content reader with automatic updates, Discord presence, manga trackers, Online Sources, executable Extensions, remote downloads and artwork, broad renderer privileges, duplicated or stale dependency state, and packages with known vulnerabilities. That makes it difficult to know which code is part of the Personal Alpha, creates network and credential behavior that the first milestone does not need, and prevents dependency upgrades from being measured against the product Rensai actually intends to ship.

Removing these capabilities must not erase their product history or silently declare them unwanted forever. It must also not break the recognizable local library-to-reader journey. The result of Slice 1 needs to remain buildable, auditable, reversible, and explicitly non-releasable while later security and persistence slices are still incomplete.

## Solution

Make the active Personal Alpha runtime and dependency graph local-only. Remove inherited executable and network capability clusters one bounded cluster at a time, including their UI, state, IPC, background behavior, credential storage, packages, lockfile trees, and documentation promises. Retain the first-party filesystem adapter only as a temporary bridge for Local Content and isolate every unsafe or inherited type dependency that cannot be removed until the successor domain and Electron-boundary slices.

Use one canonical root lockfile, supported package-manager behavior, explicit dependency ownership, and an advisory baseline after each cluster. Preserve the Local Content import, library, reader, and chapter read-state journey at every checkpoint. Record every removed user-visible capability in the deferred-capabilities register with its reason and the conditions for safely reintroducing it after the Modernization Baseline.

## User Stories

1. As Rensai's primary reader, I want the Personal Alpha to launch without contacting a network service, so that local reading works offline and predictably.
2. As Rensai's primary reader, I want to import manga from user-selected local folders, so that I can use content I already own.
3. As Rensai's primary reader, I want to import supported local comic archives, so that ZIP and CBZ libraries remain usable.
4. As Rensai's primary reader, I want my existing library-to-reader flow to remain recognizable, so that modernization does not make the application unusable between slices.
5. As Rensai's primary reader, I want Single, Double, and Long Strip reading modes to remain available, so that local-only scope does not remove core reader behavior.
6. As Rensai's primary reader, I want local chapter completion and read/unread state to continue working without trackers, so that reading progress is not coupled to an external account.
7. As Rensai's primary reader, I want application startup to avoid automatic update checks, so that the app never trusts Houdoku's inherited release channel.
8. As Rensai's primary reader, I want Discord presence disabled in the Personal Alpha, so that reading does not create an unnecessary background network connection.
9. As Rensai's primary reader, I want tracker authentication and progress sync absent from the Personal Alpha, so that no inherited tracker credential is loaded or transmitted.
10. As Rensai's primary reader, I want remote chapter downloads absent from the Personal Alpha, so that Local Content is not confused with cached Online Source content.
11. As Rensai's primary reader, I want remote cover and banner lookups absent, so that browsing my local library does not silently call third-party services.
12. As Rensai's primary reader, I want to select a local cover image where that remains part of local metadata editing, so that removing remote artwork does not unnecessarily remove local customization.
13. As Rensai's primary reader, I want Online Source search and browsing absent, so that the Personal Alpha's product boundary is explicit rather than partially broken.
14. As Rensai's primary reader, I want executable Extension installation, update, reload, and settings surfaces absent, so that untrusted third-party code cannot run in the Personal Alpha.
15. As Rensai's primary reader, I want Rensai never to scan or execute an inherited Houdoku plugin directory, so that opening the successor cannot activate old code.
16. As Rensai's primary reader, I want removed integrations reported as intentionally unavailable, so that their absence is understandable rather than appearing as a defect.
17. As Rensai's future user, I want deferred features to remain eligible for redesign, so that local-only Personal Alpha scope does not permanently constrain the Product Roadmap.
18. As Rensai's product owner, I want every removed capability recorded with re-entry conditions, so that future restoration decisions retain context.
19. As Rensai's product owner, I want reintroduced integrations designed against Rensai's secure architecture, so that inherited implementations are not copied back wholesale.
20. As Rensai's maintainer, I want one canonical workspace lockfile, so that clean installs resolve the same graph.
21. As Rensai's maintainer, I want deleted workspaces and redundant nested lockfiles removed, so that dependency tooling reports only active projects.
22. As Rensai's maintainer, I want direct dependencies to have an active owner, so that obsolete packages are not retained by habit.
23. As Rensai's maintainer, I want packages belonging only to removed capabilities pruned from the transitive graph, so that later upgrades operate on the smallest relevant surface.
24. As Rensai's maintainer, I want retained vulnerable packages patched when a compatible supported release exists, so that known advisories are not carried forward unnecessarily.
25. As Rensai's maintainer, I want remaining advisories mapped to reachable capability owners, so that later remediation is ordered by architecture rather than raw counts.
26. As Rensai's maintainer, I want a frozen clean installation to pass after every capability cluster, so that lockfile correctness is continuously demonstrated.
27. As Rensai's maintainer, I want lint, typecheck, and desktop production build results recorded after each cluster, so that regressions are found at the smallest reviewable boundary.
28. As Rensai's maintainer, I want inherited typecheck failures distinguished from new regressions, so that the slice improves the baseline without claiming false success.
29. As Rensai's maintainer, I want an inventory proving excluded capabilities are absent from source, package metadata, lockfile, and built output, so that removal is verifiable.
30. As Rensai's maintainer, I want the Local Content smoke journey exercised with network access denied, so that offline behavior is demonstrated rather than assumed.
31. As Rensai's maintainer, I want each removal cluster reversible as a reviewable change, so that an unexpected Local Content regression can return to the last green checkpoint.
32. As Rensai's maintainer, I want release and publishing workflows to remain blocked, so that an intermediate unsafe build cannot be mistaken for a distributable Personal Alpha.
33. As Rensai's maintainer, I want the retained filesystem adapter visibly marked as temporary, so that inherited Extension terminology does not become the successor domain model.
34. As Rensai's maintainer, I want renderer Node polyfills removed when their active imports have been replaced, so that they do not hide privileged browser code indefinitely.
35. As Rensai's maintainer, I want the chosen reader-first landing/docs direction preserved independently of the old documentation implementation, so that dependency cleanup does not discard approved product work.

## Implementation Decisions

- Execute the work as bounded capability clusters. A cluster includes all of its main-process services, renderer UI, settings, state, persistence keys, IPC channels, background startup behavior, direct dependencies, and orphaned transitive packages.
- Treat automatic updates, Discord presence, and manga trackers as completed removal clusters. Verify their absence rather than reimplementing them in this slice.
- Remove remote chapter download behavior, downloaded-content management, and remote cover/banner fetching as the next bounded cluster. Preserve explicitly selected local cover images if they can be represented without a network path.
- Remove Online Source browsing/search and executable Extension management, installation, update, reload, settings, and plugin discovery from the active runtime.
- Retain the filesystem implementation as the only temporary content-source adapter. It may continue using inherited source/domain types until Slice 2, but it must not load external packages or discover an inherited plugin directory.
- Delete the spoof browser window when external Extension execution no longer owns it.
- Remove generic network helpers and dependencies when their final active owner disappears.
- Remove renderer Node polyfills and their vulnerable crypto chain only when the remaining renderer imports no longer require them. Do not make a premature Electron sandbox/configuration flip in Slice 1; the atomic privilege boundary belongs to Slice 3.
- Keep local folder/archive reading, local metadata editing, categories, search/sort/filter, reader modes, keyboard navigation, and chapter read-state behavior functioning throughout the slice.
- Do not introduce SQLite, Jotai, React/UI-stack modernization, or roadmap features while completing this graph-cleanup slice.
- Use one root lockfile. Remove nested lockfiles, deleted workspace importers, and package entries without an active code owner.
- Use the repository-pinned package manager for Slice 1 reproducibility. The Node 24, pnpm 11, Electron 44, and wider supported-toolchain migration remains Slice 4.
- Patch a retained dependency to a current compatible release when that independently removes a known advisory and does not expand the slice into a major toolchain migration.
- Do not use broad automated audit fixes, advisory suppression, or dependency overrides to conceal ownership. Every remaining finding must be attributable to retained code and carried into the next responsible slice.
- Maintain a canonical deferred-capabilities register. Each removed user-visible feature records why it was excluded from the Personal Alpha and concrete product, security, privacy, architecture, and testing gates for reintroduction.
- Preserve inherited code history in Git rather than keeping dormant runtime code in the active tree.
- Keep publishing manual/disabled and do not introduce a Rensai update endpoint, public binary, signing, or notarization work in this slice.
- Keep the active landing/docs workspace only if it is independent of the desktop runtime graph and aligned with the approved reader-first Rensai direction. Remove stale deleted documentation importers.

## Testing Decisions

- Use one highest-level behavioral seam: the offline Local Content journey from launch through import, library, reader, chapter completion, close, and reopen. Run it with network access denied so an unexpected request fails the checkpoint.
- Materialize the existing synthetic Local Content corpus for the smoke journey. Cover a representative Unicode folder and ZIP/CBZ content without using private user data or copyrighted pages.
- Assert externally visible behavior rather than internal function calls: content imports, appears in the library, opens in the reader, changes page/mode, marks read, and survives the existing persistence lifecycle.
- Exercise the smoke journey after every capability cluster. A cluster is not complete if local reading only builds but cannot run.
- Add a static excluded-capability inventory across active source, package manifests, the canonical lockfile, and production bundle/package contents. It must fail when updater, Discord, tracker, Online Source, executable Extension, remote download/cover, or their known package owners remain.
- Verify that startup and the smoke journey produce no network request when DNS/network access is denied.
- Verify that no inherited plugin directory is scanned, imported, copied, or executed during startup or Local Content import.
- Verify a clean frozen installation with the pinned package manager and only one root lockfile.
- Run root lint, explicit desktop typecheck, and desktop production build. New type errors are regressions; inherited failures must be enumerated and reduced or assigned to the responsible later slice rather than silently ignored.
- Run the production dependency audit after each cluster and record severity counts plus owning paths for every remaining high or critical advisory.
- Prefer the existing build/lint commands and synthetic fixture blueprints as prior art. The repository currently has no automated test suite, so the Local Content smoke harness is the one new behavioral seam rather than a collection of low-level unit seams.
- Keep full root/docs build evidence separate from desktop runtime evidence when the docs build requires release-network access. The Local Content checkpoint must not depend on a documentation-site fetch.
- Require `git diff` whitespace validation and a clean inventory of intentional changes before handoff.
- Do not call Slice 1 complete until updater, Discord, trackers, Online Sources, executable plugin behavior, remote downloads/covers, and their package owners are absent while the offline Local Content smoke remains green.

## Out of Scope

- Reintroducing automatic updates, Discord presence, manga trackers, Online Sources, or executable Extensions.
- Permanently rejecting any deferred capability; product re-entry decisions belong after the Modernization Baseline.
- The successor-owned domain model and repository/use-case ports planned for Slice 2, except for the minimum isolation needed to retain the temporary filesystem adapter.
- The atomic Node-free, context-isolated, sandboxed Electron boundary planned for Slice 3.
- Node 24, pnpm 11, Electron 44, Vite/electron-vite, TypeScript, React, Biome, Tailwind, router, and state-library major upgrades.
- SQLite persistence, snapshots, restore/import, exact-page durable progress, or Houdoku data migration.
- A broad visual redesign, feature expansion, web reader, public binaries, signing, notarization, or public release automation.
- Manual final Personal Alpha UAT, which remains Yash-owned at the final Modernization Baseline gate.

## Further Notes

- Partial implementation already exists in an isolated implementation worktree: updater, Discord presence, and all three tracker integrations have been removed end to end; the canonical lockfile has been regenerated; and a retained multipart dependency has been patched.
- The recorded production advisory count fell from 160 in the inherited baseline to 110 after those changes. Four critical advisories remain in the executable-plugin package path and renderer Node-polyfill crypto path; this is progress evidence, not Slice 1 completion.
- Frozen installation, root lint, and desktop production build are green at the current checkpoint. The inherited explicit typecheck baseline is not green because duplicate React 16/18 test typings and two local errors remain; the implementing agent must not misreport build success as typecheck success.
- Removed product behavior is recorded in the deferred-capabilities register. Reintroduction should be a new optional vertical slice against Rensai's later hardened architecture.
- The planning checkout contains user-owned documentation changes. Continue implementation in the isolated worktree and preserve unrelated dirty state.
