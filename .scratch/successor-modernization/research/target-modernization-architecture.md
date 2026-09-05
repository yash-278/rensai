> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Target modernization architecture

Status: superseded — historical reference only
Captured: 2026-08-29  
Prototype: branch `prototype/modernization-architecture`, commit `d388d72`

## Prototype question and verdict

The throwaway logic prototype asked whether the modernization sequence can keep the inherited Local Content journey usable at every checkpoint while preventing an unsafe intermediate build from being mistaken for a releasable Personal Alpha.

Verdict: yes, if the implementation enforces four invariants:

1. Every slice starts from and ends at a green Local Content checkpoint.
2. Publishing/distribution remains blocked until final baseline attestation; “works locally” never implies “safe to release.”
3. Privilege and persistence flips happen only after their ports/adapters and rollback points exist, and never through indefinite dual modes.
4. A failed slice rolls back to the last green checkpoint. A failed SQLite proof reopens the binding decision rather than silently retaining browser storage.

The interactive prototype is primary evidence on the throwaway branch at `apps/desktop/prototypes/modernization-architecture.html`. It is not production code and must not be merged into the implementation branch.

## Target component model

```text
Sandboxed renderer (React 19 + Jotai)
  - library, series, reader, categories, settings, data UI
  - no Node/Electron/SQL/path/network authority
             |
             | window.rensai: versioned typed DTOs
             v
Context-isolated preload
  - one method per use case
  - no raw ipcRenderer exposure
             |
             | runtime-validated IPC; exact window/top-frame/origin
             v
Electron main application
  +-- Library service --------+-- Series/chapter/category repositories --+
  +-- Reader session service -+-- Progress repository -------------------+--> SQLite
  +-- Settings service -------+-- Settings repository -------------------+
  +-- Data service -----------+-- Migration/import/snapshot/export ------+
  +-- Source-grant service ------ native picker + canonical root registry
  +-- Ingestion job service ----- bounded folder/ZIP/CBZ workers + app temp
  +-- Reader asset protocol ----- expiring opaque page tokens
  +-- Window/security policy ----- CSP, navigation, permission, network denial

User-owned Local Content <--- read-only grants ---> Source/Ingestion services
Houdoku JSON backup -------> validated replacement importer (read-only source)
```

There is no Online Source, Extension runtime, tracker, Discord, updater, telemetry, account/sync, remote-cover/download, generic shell, or generic file/IPC subsystem in the Personal Alpha build.

## Module ownership

### `domain`

Successor-owned, framework-independent IDs, entities, value objects, commands, query DTOs, errors, and runtime schemas for Series, Chapter, Category, Progress, ReaderManifest, SourceGrant, Import/Restore, and Settings. No Tiyo/Electron/React types.

### `application`

Use cases orchestrating repositories and infrastructure: preview/commit import, refresh/relink/remove series, query library, manage categories, open/checkpoint/close reader sessions, update settings, snapshot/export/restore, and Houdoku import. Transactions begin here.

### `infrastructure/main`

SQLite adapters/migrations, Electron dialogs/window/session policy, canonical source-grant registry, bounded ingestion/archive jobs, page-asset protocol, snapshot/export file IO, and structured safe logging.

### `preload`

The sole renderer-to-main facade. It maps typed methods to named handlers, validates public DTOs, and contains no domain decisions.

### `renderer`

Feature UI and disposable state. Queries return immutable projections. Commands update/invalidate Jotai only after durable success. The current page may be optimistic between checkpoints; SQLite remains authoritative after acknowledgement.

## Staged implementation sequence

Each slice is a separate reviewable commit/PR-sized unit or short stack, begins from the previous green checkpoint, and leaves the repository buildable. Release/publish workflows remain manual/blocked throughout.

### Slice 0 — Freeze evidence and release safety

Already established by Wayfinder/bootstrap:

- Synchronized upstream base and separate implementation branch.
- Automatic publishing disabled.
- Inherited build/lint recorded.
- Reader/data/security/dependency baselines and synthetic fixtures captured.
- Rensai/Sequence identity and Personal Alpha contract fixed.

Green checkpoint: current locked install/build/lint plus recorded inherited Local Content smoke journey. Rollback: upstream-synced bootstrap commit.

### Slice 1 — Make the active graph local-only and truthful

- Remove executable plugin install/load/reload, spoof window, Online Source clients/UI, tracker, Discord, updater, telemetry, remote download/cover paths, and associated IPC/settings.
- Remove their direct/transitive packages, Node renderer polyfills, unused test remnants, stale/nested lockfile surfaces, and deleted workspace importers.
- Remove the inherited public docs implementation from the active workspace if it prevents a truthful graph; the selected Rensai landing/docs direction is preserved separately and is not a modernization dependency.
- Keep the filesystem adapter temporarily, but isolate its inherited types/unsafe calls behind the next slice's ports.

Green checkpoint: frozen clean install; desktop build/typecheck/lint; Local Content import/library/reader/read-state smoke; package inventory proves removed capabilities absent. Rollback: restore Slice 0; no data-format change.

### Slice 2 — Introduce successor domain and ports

- Add successor-owned domain types/runtime schemas and stop new use of `@tiyo/common`.
- Define repository and use-case interfaces for library, progress, categories, settings, source grants, reader sessions, and data operations.
- Adapt current Local Content and localStorage behavior behind temporary infrastructure adapters without changing UI behavior.
- Define and type the final preload contract; renderer features call a renderer-side client port rather than `ipcRenderer`, `fs`, or raw paths.

Green checkpoint: baseline journey unchanged through ports; contract/runtime-schema tests; no new direct renderer privilege imports. Rollback: remove ports/adapters; stored format unchanged.

### Slice 3 — Flip the Electron security boundary atomically

- Move dialogs, filesystem traversal, reader page access, window actions, and data operations to main use cases.
- Implement native-picker source grants, bounded ingestion jobs, and opaque reader-session/page tokens.
- Implement preload and centralized validated handlers.
- Replace `atom://`, raw-path DTOs, generic file handlers, and generic external opening.
- Apply sandboxed Node-free window flags, packaged app origin, CSP, navigation/permission/network denial, and safe external attribution allowlist.
- Delete the final renderer `electron`/Node imports and polyfills in the same green stack.

Do not flip window flags before every required renderer call has a typed replacement; the prototype rejects that transition as unusable.

Green checkpoint: runtime boundary assertions; unexpected frame/origin/payload rejection; network/navigation/permission denial; hostile path/archive cases; complete offline reader journey. Rollback: revert the entire security stack to Slice 2; it remains non-releasable.

### Slice 4 — Reach the supported build/runtime foundation

- Pin Node 24 and pnpm 11; normalize one root lockfile and workspace scripts.
- Upgrade development tooling/build layers in compatibility order: TypeScript/Biome, electron-vite/Vite, then Electron one major at a time to 44.
- At each Electron major, build/package/launch the same hardened Local Content journey before advancing.
- Keep React/router/UI/Tailwind changes out of this slice unless a minimal compatibility edit is required and isolated.

Green checkpoint per major: clean frozen install, build/typecheck/lint, boundary assertions, offline smoke, package launch. Slice exit additionally satisfies the dependency/advisory policy for the then-active graph or records only permitted time-boxed development exceptions. Rollback: previous locked major/lockfile checkpoint; no database exists yet.

### Slice 5 — Prove one SQLite binding on the exact package

- Build the smallest main-owned repository/snapshot probe with `better-sqlite3` on the frozen Electron 44/macOS arm64 toolchain.
- Prove clean install/rebuild, package inclusion, first/second packaged launch, transaction rollback, WAL/foreign-key settings, online snapshot, restore, and quit/reopen.
- If it fails, run the predefined `node:sqlite` proof only if its runtime stability/API gate is satisfied.
- If both fail, stop and reopen ticket 08. Do not start application persistence work and do not retain localStorage as an undeclared fallback.
- Delete the unused adapter/dependency after the winner is recorded.

Green checkpoint: one selected binding and a packaged proof artifact/log. Rollback: Slice 4 contains no new canonical data.

### Slice 6 — Cut durable features to SQLite vertically

- Add schema/migrations/repositories and Rensai data paths.
- Cut over, in order: library queries; series/chapter mutation and exact-page progress; categories; settings; snapshots/export/restore; Houdoku JSON replacement import.
- Each feature reads and writes one adapter at a time. Do not dual-write. Temporary localStorage adapter remains only for slices not yet migrated.
- Create/validate safety snapshots before schema/replace operations and add the synthetic import corpus.
- Introduce Rensai identity/data profile before any canonical write; never target Houdoku profile storage.

Green checkpoint after each vertical slice: transaction/failure/reopen tests and the complete offline journey. Slice exit: SQLite is sole durable owner; localStorage normal paths and adapter removed; restore/import integrity and path regrant pass. Rollback before schema cutover is code-only; after a migration, use the pre-migration snapshot with the prior binary rather than opening a newer schema from older code.

### Slice 7 — Replace UI state, then modernize the UI stack

- Replace feature Recoil atoms with Jotai/component state after that feature is SQLite-backed.
- Delete Recoil and storage effects; assert no canonical browser keys are read/written.
- Upgrade React 19 and router/retained UI packages; then Tailwind 4/UI styling, preserving the Sequence product direction and reader behavior.
- Keep landing/docs work out of the desktop runtime graph; it can consume shared identity tokens later without becoming a web reader.

Green checkpoint per feature/tool layer: state/repository tests, build/typecheck/lint, visual/interaction smoke, offline packaged journey. Rollback: previous UI layer against the unchanged repository contract.

### Slice 8 — Baseline attestation and handoff

- Run the complete ticket 10 gate on a clean macOS arm64 environment.
- Inspect packaged files and active dependency graph.
- Verify portable export/snapshot recovery artifacts and documentation.
- Confirm explicit exclusions and keep publishing/public distribution disabled.

Only this slice may change the internal state from “Modernization Baseline in progress” to “complete” and unlock Product Roadmap planning.

## Cross-slice invariants

- The Local Content acceptance journey is green before and after every slice.
- No slice adds a required network request.
- No user source file or Houdoku source data is modified.
- No unsafe intermediate is published or described as Personal Alpha.
- One durable writer/adapter exists per migrated feature; no indefinite dual writes.
- Every schema-changing or replacement operation has a verified recovery artifact.
- Failures stop at the last green checkpoint; fixes are forward, or rollback is explicit and tested.
- Scope discoveries become separate decisions; they do not smuggle Product Roadmap features into modernization.

## Implementation workstreams and dependency order

```text
Evidence/release freeze
        |
Local-only graph cleanup
        |
Domain and repository ports
        |
Electron security flip
        |
Supported toolchain/Electron
        |
Packaged SQLite proof
        |
SQLite vertical cutover
        |
Jotai -> React/router -> Tailwind/UI
        |
Final baseline attestation
```

Parallel work is safe only inside a slice when files and contracts do not overlap—for example hostile fixture preparation alongside repository implementation. The green checkpoint remains a single integration result.

## Architecture risks retained for implementation

- `better-sqlite3` is selected but not architectural fact until Slice 5 package proof passes.
- RAR/CBR remains conditional on an extractor passing the identical archive gate.
- The default ingestion limits may need evidence-backed adjustment after the synthetic/representative corpus, but widening them requires an explicit change and matching hostile tests.
- A real Houdoku backup fixture is absent; migration confidence is synthetic until Yash explicitly supplies and redacts one.

These risks have bounded decision points and do not require redesigning the target component model.
