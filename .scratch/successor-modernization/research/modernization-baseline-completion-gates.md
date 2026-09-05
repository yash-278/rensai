> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Modernization Baseline completion gates

Status: superseded — historical reference only
Captured: 2026-08-29

## Completion rule

The Modernization Baseline is complete only when every mandatory gate below passes against the same clean commit and packaged macOS arm64 artifact. A green development server, inherited smoke test, dependency update, audit alone, or partially working local reader is not completion.

Evidence must record the commit, exact locked versions, commands, date, architecture, package checksum, and any environment prerequisites. There are no silent waivers. An allowed temporary dependency exception keeps the result conditional; Product Roadmap work remains blocked until the final baseline attestation has no active exception.

Public publishing, signing/notarization, updater, and general distribution remain disabled after baseline completion. The result is a Personal Alpha, not a Public Release.

## Gate 1 — Identity, lineage, and scope

- Product/application metadata uses Rensai and the selected app ID `io.github.yash278.rensai`.
- Runtime, data directory, package metadata, logs, exports, window titles, icons, and About view no longer present the app as Houdoku.
- The Rensai profile is separate and never opens Houdoku's profile during normal startup.
- About/license documentation clearly credits Houdoku and preserves required license notices without making Houdoku the public product story.
- Repository/publish/update metadata cannot release to upstream or an inherited channel.
- The active packaged tree contains no Online Source, executable Extension, tracker, Discord, telemetry, account/sync, updater, remote cover/download, or web-reader runtime.
- RAR/CBR appears as supported only if its conditional safety gate passed; otherwise docs/UI report it as unsupported.

Evidence: metadata/package inspection, clean-profile launch, About/license review, and explicit excluded-capability inventory.

## Gate 2 — Reproducible supported dependency graph

- Node 24 LTS, pnpm 11, Electron 44, electron-vite 5/Vite 7, TypeScript 6, React 19, Biome 2, Tailwind 4, and retained packages are on the frozen maintained compatible lines selected at implementation time.
- One root lockfile and no nested/stale lockfiles or deleted workspace importers.
- A clean checkout installs with the pinned package manager and frozen lockfile; no post-install manual repair.
- Runtime, development, optional, native, override, and patch ownership is truthful and documented.
- Unused/deferred packages and transitive trees are absent from lockfile and package.
- Production graph has zero known advisories at every severity.
- Full graph has zero high/critical and zero unreviewed moderate/low advisories.
- Final baseline has no active temporary exception.
- Package-manager audit plus an independent lockfile-aware scan agree after deduplication or discrepancies are resolved.

Evidence: version/support matrix, frozen install log, lockfile/workspace check, two scan reports, patch/override inventory, and packaged dependency/SBOM-style inventory.

## Gate 3 — Canonical automated verification

The root defines one documented baseline verification entry point that runs, or links immutable outputs for:

- Formatting/lint with zero errors and no blanket ignored source areas.
- Typecheck for main, preload, renderer, shared domain, tests, and build configuration.
- Unit tests for domain rules, repositories, progress sequencing, schemas, path checks, archive limits, settings, migrations, backup/import/export.
- Integration tests for typed IPC sender/payload enforcement, SQLite transactions, migration/restore, source grants, reader sessions/page protocol, and offline behavior.
- Renderer critical-path tests through the fake typed bridge.
- Desktop production build and arm64 package.
- Package-content/security/dependency attestation.

The verification starts from a clean checkout with no generated dependency/build artifacts and leaves no unexplained working-tree changes. Warnings are either eliminated or explicitly classified with code-linked rationale; inherited warning noise is not accepted as baseline evidence.

Evidence: one command transcript plus individual machine-readable reports retained outside the source tree or in the agreed evidence location.

## Gate 4 — Electron runtime boundary

Automated runtime assertions on the packaged app prove:

- Main window has Node integration off, context isolation on, sandbox on, and web security on.
- The preload exposes exactly the versioned allowlisted `window.rensai` surface—no `ipcRenderer`, raw channel, path, SQL, shell, Electron, Node, or native binding.
- Every handler rejects unexpected windows, webContents, subframes, origins, unknown keys, malformed types, oversized arrays/strings/files, invalid enums/ranges, stale session IDs, and canceled jobs.
- Production loads only the packaged application origin with restrictive CSP and no `unsafe-eval`/remote script allowance.
- Navigation, frame navigation, new windows, Chromium permissions, and packaged network requests are denied.
- Any allowed attribution link is exact, HTTPS-only, compile-time allowlisted, and requires a direct user action.
- Reader page URLs contain opaque expiring tokens, not filesystem paths; tokens are window/chapter/session-bound and unreadable after close/restart.
- A renderer-compromise harness cannot read an ungranted file, enumerate paths, modify/delete source data, execute a plugin, open arbitrary external schemes, reach network, or issue generic IPC.

Evidence: packaged runtime security report and negative-case results.

## Gate 5 — Bounded Local Content ingestion

The materialized synthetic corpus proves:

- Single-series and collection import from user-selected roots.
- Case-insensitive PNG/JPEG/WebP page matching, Unicode paths, natural numeric ordering, and inherited chapter/volume/group parsing.
- Folder plus ZIP/CBZ support on valid content.
- Preview before commit, cancellation, and no partial DB mutation.
- Relink after source move and a clear missing/permission-denied state.
- Source files are never modified/deleted.
- Symlink cycle/escape, path traversal/absolute entry, duplicate Unicode/case-normalized archive names, encrypted/special/link entries, corrupt signatures/payloads, nested archives, concurrent jobs, changed-under-read input, and temp cleanup are handled safely.
- Exact below/above tests for recursive depth, discovery count, archive entry count, compressed/expanded bytes, expansion ratio, page bytes/pixels, and time limits.
- Temp cleanup owns only its unique job directory on success, failure, cancel, and startup recovery.

RAR/CBR gate, if attempted: every same assertion passes with the maintained parser in the packaged macOS arm64 app. Failure leaves the format explicitly unsupported and its parser absent from the graph/package.

Evidence: corpus manifest, automated hostile-case report, and package inventory.

## Gate 6 — Durable data, migration, and recovery

- Exactly one SQLite binding is present; its clean install/rebuild/package/launch proof is attached.
- Database lives in the documented Rensai data directory; renderer/browser storage is not canonical.
- Foreign keys, WAL, durability, application/schema version, migration checksums, and required indexes are asserted.
- Fresh launch, second launch, app close/reopen, and macOS window recreation retain identical records/settings/progress.
- Multi-record failure, stale progress sequence, busy/interrupt, and failed migration roll back completely.
- Every migration creates/verifies a safety snapshot; older app/newer schema stops without modification.
- `integrity_check`, `foreign_key_check`, application relationships/counts, and source-grant invariants pass after migration/restore/import.
- Daily snapshot occurs only after changes, uses a consistent database snapshot, retains 14 deterministically, and reports unwritable/failure state.
- Five safety snapshots are retained independently before migration/restore/import.
- Portable export is versioned, bounded, documented, and excludes canonical paths/access material, credentials, caches, pages, and logs.
- Malformed, truncated, oversized, wrong-format, wrong-version, corrupt, and referentially invalid restore artifacts leave live data unchanged.
- Successful restore replaces data only after snapshot and validation.
- Final package contains no Recoil, localStorage persistence adapter, multiple SQLite bindings, or accidental dual-write path.

Evidence: repository/migration test report, snapshot/restore artifacts using synthetic data, integrity output, and package scan.

## Gate 7 — Houdoku backup compatibility

Using the committed empty, representative, malformed, and generated-large fixtures:

- Import is explicit, previewed, replace-confirmed, read-only against the source, bounded, transactional, and repeatable.
- Valid filesystem series/chapter/category IDs, metadata, Unicode, chapter read state, and allowlisted preferences map as documented.
- Source paths are hints only and require a new user grant.
- Unread values are recomputed; exact page initializes unset.
- Online-source entries, tracker keys/tokens, extension settings/plugins, updater/Discord values, downloads, covers, logs, caches, unknown keys, and malformed records are counted/reported and not imported/executed.
- Safe reports never contain the synthetic secret or private absolute paths.
- Repeating replacement import produces the same logical rows/counts.
- Failure at any stage leaves the prior Rensai database active and the recovery snapshot valid.

A real redacted fixture is desirable but not mandatory because no profile was found. Documentation must say compatibility is fixture-proven, not claim universal Houdoku-profile migration. Personal Alpha imports JSON backups only.

Evidence: deterministic import reports and before/after database assertions.

## Gate 8 — Personal Alpha library and reader journey

On a clean macOS arm64 user profile with network denied:

1. Launch Rensai and import the Unicode folder/CBZ corpus.
2. Preview counts; edit metadata; commit; create/rename/assign/delete a category.
3. Verify grid/list, search, title/unread sort, status/category filters, and derived unread counts.
4. Refresh and relink while preserving chapter IDs/read/exact-page progress.
5. Read in Single, Double, and Long Strip; LTR and RTL; portrait pairs and landscape spreads; `All`/`First`/`None` offsets; fit/gap/max-width/scrollbar/contrast/sidebar/fullscreen controls.
6. Exercise click zones, wheel/scroll, page/chapter selectors, configurable keyboard shortcuts, next/previous boundary behavior, and actionable corrupt/missing errors.
7. Cross the 80% threshold, explicitly mark read/unread, close mid-chapter, quit, relaunch, and resume the clamped exact page with correct unread state.
8. Remove a series and prove source files remain unchanged.
9. Export, mutate, restore, and verify the replacement plus recovery snapshot.
10. Import the representative Houdoku fixture and verify the compatibility report.

All steps work without DNS/network access and without a development server.

Evidence: automated critical-path output plus Yash's bounded manual UAT checklist/result. Manual UAT remains user-owned unless separately requested.

## Gate 9 — macOS arm64 package behavior

- Production arm64 package builds on the documented environment and launches on a clean compatible Mac account.
- App identity, data location, menu/window title, icon, About/license, and logs are Rensai-owned.
- Closing the last window and activating from the Dock follows the documented macOS lifecycle without losing data or widening privileges.
- App handles first start, second start, missing data directory, unwritable backup destination, crash/restart around a transaction, and an already-running instance according to the implementation contract.
- Package includes only expected architectures/files/native modules and no development server source maps/secrets/private fixtures/unexpected writable executable directory.
- Package hash and size are recorded.

Because public distribution is out of scope, the gate does not require signing/notarization or a public installer. Documentation must clearly call the artifact a local Personal Alpha and must not instruct public users to bypass macOS security controls.

Evidence: package inspection, clean-account run, lifecycle/recovery checklist, checksum.

## Gate 10 — Documentation and operational handoff

Repository documentation includes:

- Rensai identity, reader-first purpose, Houdoku lineage, license, and Personal Alpha status.
- Exact supported Local Content formats, conditional RAR/CBR status, limits, naming/order behavior, and missing/moved-source recovery.
- Local development/bootstrap, canonical verification, packaging, and architecture boundaries.
- Data directory, database ownership, snapshot retention, portable export/replace restore, and recovery procedure.
- Houdoku JSON import fields, replacement semantics, source regrant, skipped data, and limits.
- Offline/privacy behavior and explicit network/executable capability exclusions.
- Supported dependency policy, update cadence, advisory gates, native binding proof, and package inventory procedure.
- Known Personal Alpha limitations and the explicit list of work deferred to Public Release/Product Roadmap.

The landing/docs site may present reader benefits and setup information, but it does not contain a web reader and is not required by the desktop package to function.

Evidence: link check, commands executed from a clean checkout by following docs, and review against the final package.

## Gate 11 — Final attestation

The final attestation contains one table with every gate marked pass/fail, links to exact evidence, and no unresolved “mostly,” “expected,” or “follow up” status. It verifies:

- Same commit and package across all results.
- Clean Git scope with no unrelated or generated artifacts.
- No active temporary security/dependency exception.
- No excluded capability or unexpected network path in source, lockfile, or package.
- No unresolved data-integrity failure or missing recovery proof.
- User-owned manual UAT result recorded.
- Public publishing/updater/signing remain disabled/out of scope.

Only after this attestation passes may the Wayfinder successor-modernization effort be marked achieved in execution and the Product Roadmap become the next planning effort.

## Failure handling

Any failed gate keeps the Modernization Baseline open. Fix forward within the responsible slice or roll back to its documented green checkpoint. Do not weaken the gate, suppress evidence, broaden scope, or call a deferred capability restored merely to obtain a pass.
