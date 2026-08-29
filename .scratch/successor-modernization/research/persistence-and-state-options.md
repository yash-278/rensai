# Persistence and state modernization options

**Research date:** 2026-08-29

**Scope:** macOS arm64 Personal Alpha; offline core; incremental modernization of the current Houdoku codebase

**Question:** What should replace the current `localStorage` + Recoil design so library records, reading progress, categories, settings, backup/restore, migrations, recovery, and tests are durable and maintainable?

## Recommendation

Adopt **SQLite as the canonical durable store, owned by the Electron main process**, and expose narrow, typed library/settings/backup operations through the preload bridge. Treat the renderer's state as a disposable view of that database, never as the durable source of truth.

Use this incremental state path:

1. Keep Recoil temporarily while the persistence boundary is introduced.
2. Move each feature from direct `localStorage` access to a repository API backed first by the legacy store and then by SQLite.
3. Replace Recoil with **Jotai** feature-by-feature after persistence is stable. Jotai is the lowest-churn maintained target because the current UI is already organized around atoms and derived selectors; Jotai's maintainers describe its state model as close to Recoil, while Zustand is closer to Redux.[^jotai-vs-zustand] Zustand is a sound alternative if an action/slice model is preferred, but it requires a broader rewrite and does not improve durability by itself.

Recoil may bridge the persistence cutover, but the dependency/security modernization phase is not complete until the archived package is removed.

Do **not** persist domain entities through Jotai/Zustand middleware. SQLite remains authoritative; UI state contains loaded records, filters, selection, reader position-in-session, and operation status.

The SQLite *format* decision can be made now. Select the JavaScript binding only after the dependency/toolchain ticket pins the upgraded Electron runtime:

- Prefer `node:sqlite` if the Node version embedded in the chosen Electron release exposes the required API at an accepted stability level.
- Otherwise use `better-sqlite3`, provided install, packaging, and a macOS arm64 production build are verified against that exact Electron version. Its official repository documents transactions and prebuilt binaries for major platforms, while Electron documents that native modules may need rebuilding for Electron's ABI.[^better-sqlite3][^electron-rebuild]

This recommendation gives the Personal Alpha a recoverable user-owned file, transactional updates, explicit schema migrations, deterministic backups, a secure renderer boundary, and fast in-memory tests without forcing a single high-risk rewrite.

## What exists today

The current persistence layer is a thin wrapper over renderer `window.localStorage`.[^current-persistent-store] The library is stored as:

- one JSON array containing every series;
- one JSON array per series containing every chapter;
- one JSON array containing every category.[^current-store-keys][^current-library-service]

Every series/category update reads, parses, filters, serializes, and rewrites its whole array. Chapter updates rewrite the whole chapter array for that series. Changes spanning series, chapters, categories, and settings cannot be committed atomically.[^current-library-service]

Settings are read from prefixed string keys at module load and written back through Recoil atom effects.[^current-settings-state][^current-settings-utils] The parser manually converts strings into booleans, arrays, numbers, or strings, but there is no persisted schema version or runtime validation.

The renderer duplicates durable data in Recoil: startup loads series and categories from the persistence service into atoms, and feature code usually mutates persistence and then refreshes the relevant atom.[^current-app-load] Reader page position is only an in-memory atom; the durable chapter progress represented by the current model is the chapter's `read` boolean.[^current-reader-state][^current-reader-mark-read]

Backups are unversioned dumps of the entire browser `localStorage` object. Restore only processes series and chapter keys; it does not restore category or settings keys, and its chapter conflict rule is hard-coded to preserve `read=true` from either side.[^current-backup] Automatic backups use a relative `backups/` directory rather than Electron's app-data location and rotate the first unsorted directory entry.[^current-backup] The only visible data migration runs imperatively on every startup and has no migration ledger.[^current-app-load][^current-tag-migration]

These are not merely scale concerns. Web Storage operations are synchronous and block JavaScript while reading or writing, and browser Web Storage has a small quota (documented as 10 MiB total across `localStorage` and `sessionStorage`).[^web-storage-sync][^web-storage-quota] Electron itself distinguishes Chromium `sessionData` (including `localStorage`) from app-owned `userData`, and recommends placing app-specific files in a subdirectory of `userData`.[^electron-app-paths]

## Persistence options

| Option | Durability and ownership | Migrations / recovery | Security boundary | Incremental cost | Verdict |
|---|---|---|---|---|---|
| Retain `localStorage` | Browser-managed, origin-coupled string KV store; synchronous and quota-limited | Must invent validation, transactions, schema ledger, safe snapshots, and recovery | Renderer remains persistence authority | Lowest immediate cost, but preserves the core risk | Reject as the Personal Alpha target; allow only as the migration source |
| IndexedDB with Dexie | Transactional browser database; Dexie officially supports Electron and TypeScript | Dexie has versioned schemas and an export/import addon | Still renderer/browser-owned unless wrapped awkwardly; physical data remains Chromium-managed | Moderate; no native dependency | Viable fallback if native SQLite packaging fails, but weaker fit for user-owned inspectable files and the main-process security boundary[^dexie][^dexie-export] |
| JSON file (`lowdb` or hand-rolled) | Human-readable app-owned file | Requires application-level locking, schema/versioning, integrity checks, atomic replace, and indexes | Can live in main process | Low-to-moderate initially | Suitable for tiny settings, not the combined library: lowdb documents that each write serializes the whole object and can degrade around 10–100 MB[^lowdb] |
| `electron-store` | Main-process JSON config with schema validation | Its official documentation marks its migration feature as having known bugs with no support commitment | Good if only exposed through narrow preload methods | Low for settings, but creates a second persistence and backup system | Do not use as the canonical library; unnecessary if settings can share SQLite[^electron-store] |
| Main-process SQLite | App-owned cross-platform file, transactional, queryable, indexed | Explicit transactional migrations, integrity/FK checks, safe snapshot APIs | Natural fit for typed preload IPC; renderer has no direct filesystem/database capability | Moderate, but can be introduced behind the existing service shape | **Recommended** |

SQLite is specifically designed to be an application file format: its official documentation emphasizes a stable cross-platform file, transactions, incremental updates, accessible tooling, and extensible schemas.[^sqlite-app-format][^sqlite-compatible] Transactions are atomic and durable across crashes, which directly addresses multi-entity library updates.[^sqlite-transactional][^sqlite-transactions]

### Why IndexedDB is the fallback, not the first choice

Dexie is active, TypeScript-friendly, supports Electron, and supplies versioned stores, transactions, React live queries, and export/import tooling.[^dexie][^dexie-export] It would remove Web Storage's quota and full-blob rewrites without a native addon.

However, it would keep canonical records in Chromium-managed renderer storage. That makes the physical store less discoverable and harder to move independently of browser/session data, and it works against the desired security architecture where privileged storage lives in main and is reached through one method per IPC operation. Electron's context-isolation guidance explicitly recommends narrow preload methods instead of exposing raw IPC capabilities.[^electron-context-isolation]

IndexedDB/Dexie should therefore be the contingency if the upgraded Electron runtime cannot produce a reliable signed/packaged macOS arm64 build with either SQLite binding.

### Proposed durable model

Start with a deliberately small schema:

- `schema_migrations(version, applied_at, app_version)` (or `PRAGMA user_version` plus a checked migration ledger);
- `series(id, source_id, title, ...queryable fields, metadata_json)`;
- `chapters(id, series_id, source_id, chapter_number, volume_number, language_key, read, metadata_json)`;
- `categories(id, label)`;
- `series_categories(series_id, category_id)`;
- `settings(key, value_json, updated_at)`.

Normalize identity, relationships, progress, and fields needed for sorting/filtering. Keep source-specific or not-yet-modeled fields in validated JSON columns during the first migration. This avoids freezing the old Tiyo types into the long-term domain while also avoiding a speculative full normalization before the local-file model is settled.

Enable and test foreign-key enforcement on every connection. SQLite documents that foreign keys must be enabled per connection unless the binding enables them by default.[^sqlite-foreign-keys] Use a dedicated path such as `path.join(app.getPath('userData'), 'data', 'library.sqlite3')`; Electron recommends an app-specific subdirectory because `userData` also contains Chromium directories.[^electron-app-paths]

The main process should own:

- connection lifecycle and migrations;
- repositories for series, chapters/progress, categories, and settings;
- validation of every IPC command and result;
- backup, restore, integrity checks, and deterministic rotation;
- legacy import.

The preload bridge should expose explicit methods such as `library.listSeries()`, `library.markChaptersRead(...)`, `settings.update(...)`, `backup.create(...)`, and `backup.restore(...)`. It should not expose SQL, filesystem paths, generic `ipcRenderer.send/invoke`, or a database handle. This follows Electron's official context-isolation guidance.[^electron-context-isolation]

## Backup, restore, and user ownership

Use two artifacts with different jobs:

1. **Operational backup:** a consistent SQLite snapshot containing all library data and settings. Use the SQLite Online Backup API or `VACUUM INTO`; do not copy a live main database file by itself because journal/WAL state can make such a copy inconsistent.[^sqlite-backup][^sqlite-corruption]
2. **Portable export:** a documented, versioned JSON format (`format`, `formatVersion`, `createdAt`, `appVersion`, records, settings). This is the long-term user-owned interchange format and the compatibility point for future applications.

Keep support for importing an original Houdoku JSON backup. It should be a dedicated legacy importer, not treated as the successor's native format. The importer must validate types, preserve IDs, categories, settings, and read flags where present, and report skipped/invalid records. Unknown legacy keys should be retained in the raw import artifact or reported, not silently discarded.

Restore should be **replace-by-default**, because it is auditable and deterministic. If merge is retained, make it a separately named operation with explicit conflict rules; the current implicit `existing.read || backup.read` merge is not sufficient for settings, deleted records, categories, or future page-level progress.[^current-backup]

Safe restore flow:

1. Create a pre-restore snapshot.
2. Parse and validate the manifest before changing the live store.
3. Restore/import into a temporary database or one transaction.
4. Run `PRAGMA integrity_check` and `PRAGMA foreign_key_check`, plus application-level record/count checks.[^sqlite-integrity]
5. Commit/swap only after checks pass; otherwise leave the live database untouched.

Automatic backups should use an explicit app-data backup directory, write through the main process, use collision-safe timestamps, sort by parsed creation time, retain the configured number deterministically, and surface the last successful backup and any failure. Keep at least one pre-migration backup independent of normal retention.

## State-management options

Persistence and React state must be decided independently. Replacing Recoil with another library while continuing to persist the library through browser storage would only rename the current architecture.

| Option | Fit with current atoms/selectors | Maintenance / tests | Migration cost | Verdict |
|---|---|---|---|---|
| Keep Recoil permanently | Exact current fit | Official repository was archived on 2025-01-01 and is read-only | None | Reject as target; acceptable only as a short-lived compatibility layer[^recoil-archived] |
| React state/context only | Good for local UI; awkward for the current cross-route atom graph | First-party React primitives, easy component tests | High if used to recreate a global store manually | Use for component-local state, not as the sole app-wide replacement |
| Jotai | Closest mapping: primitive atoms, derived atoms, async write atoms; no string keys | Active official repository; vanilla store supports isolated tests | Lowest replacement churn | **Recommended target**[^jotai] |
| Zustand | Strong for explicit actions/slices and dependency-injected vanilla stores | Active official repository with documented store/component testing | Moderate rewrite from atom graph | Good alternative if action/slice architecture is consciously preferred[^zustand-testing] |
| Redux Toolkit | Strongest conventions, reducers, actions, DevTools | Official, TypeScript-first, highly testable | Highest ceremony for this small local app | Valid but disproportionate for Personal Alpha unless future workflows become substantially more complex[^redux-toolkit] |
| TanStack Query plus local UI state | Useful cache/invalidation model over async IPC | Maintained and testable | Adds a second conceptual system | Revisit if async query invalidation becomes painful; unnecessary for the first local single-user store[^tanstack-query] |

### Recommended state boundary

- **SQLite:** series, chapters, durable read/page progress, categories, settings, migration state.
- **Jotai:** selected series/chapter, loaded result snapshots, filters, modal/sidebar visibility, import/reader operation status, current page before it is checkpointed.
- **Component state:** short-lived form inputs and purely local interaction.

Feature actions should call the typed repository/bridge first and update/invalidate atoms only after success. For optimistic UI, keep the prior value and roll back on rejection. Do not use Jotai's storage helpers for canonical library records or settings; that would recreate split persistence and renderer ownership.

## Incremental migration route

1. **Capture the legacy contract.** Add redacted fixtures for an empty store, a representative Houdoku backup, malformed/partial keys, categories/settings, and a large library. Record the current key names and legacy merge behavior.
2. **Introduce a persistence port.** Define feature-level repository interfaces and adapt the existing `localStorage` service to them. Recoil and UI behavior stay unchanged.
3. **Implement SQLite in main.** Add versioned schema migrations, repositories, narrow IPC handlers, and a typed preload facade. Test repositories against a temporary/in-memory database.
4. **Import once, transactionally.** On first successor startup (or explicit backup import), read the legacy snapshot in the renderer, validate and send only the legacy payload to one dedicated preload method, import it in one database transaction, verify counts/IDs/read/category/setting values, and record an import receipt/checksum. Do not delete the legacy store during the Personal Alpha.
5. **Cut over vertical slices.** Library list first, then series/chapter/progress, categories, settings, and backup/restore. Avoid indefinite dual writes; they create a second conflict-resolution problem.
6. **Replace Recoil incrementally.** Map primitive/derived atoms to Jotai by feature after that feature reads and writes only through the repository boundary. Remove Recoil only when the final feature and tests are migrated.
7. **Retire browser persistence.** Stop reading `localStorage` in normal operation after migration telemetry/logs and manual Personal Alpha verification pass. Keep the explicit legacy backup importer.

## Acceptance and test criteria

The decision is ready for implementation only if the chosen design can demonstrate:

- a fresh offline startup and a second startup using the same data;
- a failed multi-record write rolls back completely;
- an interrupted/failed migration leaves the legacy source and live database usable and can be retried without duplication;
- IDs, chapter read state, categories, settings, Unicode, file/archive paths, and unknown metadata survive legacy import;
- the same migration fixture produces the same canonical rows on repeated runs;
- backup creation while the app is open produces a consistent snapshot;
- restore rejection for a malformed/wrong-version artifact leaves live data unchanged;
- successful restore passes SQLite integrity, foreign-key, and application count checks;
- deterministic backup retention and a surfaced error when the target is unwritable;
- repository tests use in-memory/temp databases, renderer tests use a fake typed bridge, and state tests can instantiate an isolated store;
- a packaged macOS arm64 build can open, migrate, back up, restore, quit, and reopen without network access.

## Decision criteria and blockers

### Recommended decision criteria

1. **Canonical ownership:** one authoritative app-owned store, not duplicated persisted atoms.
2. **Transactional integrity:** series/chapter/category/progress mutations and migrations commit or roll back together.
3. **Recoverability:** consistent automatic snapshots, pre-migration/pre-restore backups, validated restore, and actionable failure reporting.
4. **User ownership:** documented location, an “open data folder” affordance, stable SQLite file, and versioned portable export.
5. **Security:** no renderer filesystem/database/native-module access; narrow validated preload methods.
6. **Incrementality:** legacy adapter and Recoil can be retired feature-by-feature without dual-writing indefinitely.
7. **Testability:** repositories and migrations run against temporary/in-memory databases; UI/state tests inject a fake bridge/store.
8. **Dependency fitness:** maintained library, compatible with the pinned Electron/Node/TypeScript versions, reproducible macOS arm64 install/package, acceptable supply-chain surface.

### Blockers before implementation is locked

- **SQLite binding:** the dependency/toolchain decision must pin the upgraded Electron version and embedded Node version, then verify either `node:sqlite` stability/API coverage or a `better-sqlite3` macOS arm64 install and packaged build. Current Node documentation still labels `node:sqlite` release-candidate rather than stable, so it should not be assumed solely from local system Node availability.[^node-sqlite]
- **Real migration fixture:** obtain a redacted copy of the user's actual Houdoku backup or application data if one exists. Without it, migration coverage can be representative but not proven against the user's data.
- **Identity/data location:** the new product name/app identity changes Electron's default `userData` path. Decide whether migration is backup-import-only or also searches the old Houdoku data location; never guess and silently ingest another directory.
- **Restore semantics:** confirm whether successor-native restore is strictly replace, or whether the product also needs an explicitly separate merge/import operation.
- **Durable page progress:** current code persists only chapter `read`; decide whether the Personal Alpha must resume the exact page across launches before freezing the progress schema.[^current-reader-state][^current-reader-mark-read]

None of these blockers changes the storage recommendation. They determine the binding, import entry point, and final schema details.

## Sources

### Current repository

[^current-persistent-store]: [`apps/desktop/src/renderer/util/persistantStore.ts`](../../../apps/desktop/src/renderer/util/persistantStore.ts)
[^current-store-keys]: [`apps/desktop/src/common/constants/storeKeys.json`](../../../apps/desktop/src/common/constants/storeKeys.json)
[^current-library-service]: [`apps/desktop/src/renderer/services/library.ts`](../../../apps/desktop/src/renderer/services/library.ts)
[^current-settings-state]: [`apps/desktop/src/renderer/state/settingStates.ts`](../../../apps/desktop/src/renderer/state/settingStates.ts)
[^current-settings-utils]: [`apps/desktop/src/renderer/features/settings/utils.ts`](../../../apps/desktop/src/renderer/features/settings/utils.ts)
[^current-app-load]: [`apps/desktop/src/renderer/App.tsx`](../../../apps/desktop/src/renderer/App.tsx)
[^current-reader-state]: [`apps/desktop/src/renderer/state/readerStates.ts`](../../../apps/desktop/src/renderer/state/readerStates.ts)
[^current-reader-mark-read]: [`apps/desktop/src/renderer/components/reader/ReaderPage.tsx`](../../../apps/desktop/src/renderer/components/reader/ReaderPage.tsx)
[^current-backup]: [`apps/desktop/src/renderer/util/backup.ts`](../../../apps/desktop/src/renderer/util/backup.ts)
[^current-tag-migration]: [`apps/desktop/src/renderer/features/library/utils.tsx`](../../../apps/desktop/src/renderer/features/library/utils.tsx)

### Primary external documentation and repositories

[^web-storage-sync]: [MDN: Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
[^web-storage-quota]: [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
[^electron-app-paths]: [Electron `app` API: `app.getPath`](https://www.electronjs.org/docs/latest/api/app)
[^electron-context-isolation]: [Electron: Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
[^electron-rebuild]: [Electron: `@electron/rebuild`](https://packages.electronjs.org/rebuild/)
[^sqlite-app-format]: [SQLite as an Application File Format](https://www.sqlite.org/appfileformat.html)
[^sqlite-compatible]: [SQLite File Format Changes](https://www.sqlite.org/formatchng.html)
[^sqlite-transactional]: [SQLite Is Transactional](https://www.sqlite.org/transactional.html)
[^sqlite-transactions]: [SQLite Transactions](https://www.sqlite.org/lang_transaction.html)
[^sqlite-foreign-keys]: [SQLite Foreign Key Support](https://www.sqlite.org/foreignkeys.html)
[^sqlite-backup]: [SQLite Backup API](https://www.sqlite.org/backup.html)
[^sqlite-corruption]: [SQLite: How To Corrupt A Database File](https://www.sqlite.org/howtocorrupt.html)
[^sqlite-integrity]: [SQLite PRAGMA reference: `integrity_check`, `user_version`, `application_id`](https://www.sqlite.org/pragma.html)
[^node-sqlite]: [Node.js: `node:sqlite`](https://nodejs.org/api/sqlite.html)
[^better-sqlite3]: [`WiseLibs/better-sqlite3`](https://github.com/WiseLibs/better-sqlite3)
[^dexie]: [`dexie/Dexie.js`](https://github.com/dexie/Dexie.js)
[^dexie-export]: [Dexie Export/Import documentation](https://old.dexie.org/docs/ExportImport/dexie-export-import)
[^lowdb]: [`typicode/lowdb`](https://github.com/typicode/lowdb)
[^electron-store]: [`sindresorhus/electron-store` migrations and schema documentation](https://github.com/sindresorhus/electron-store/blob/main/readme.md)
[^recoil-archived]: [`facebookexperimental/Recoil`](https://github.com/facebookexperimental/Recoil)
[^jotai]: [`pmndrs/jotai`](https://github.com/pmndrs/jotai)
[^jotai-vs-zustand]: [`pmndrs/jotai`: “How is Jotai different from Zustand?”](https://github.com/pmndrs/jotai/issues/13)
[^zustand-testing]: [`pmndrs/zustand` testing guide](https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/testing.md)
[^redux-toolkit]: [Redux Toolkit](https://redux-toolkit.js.org/)
[^tanstack-query]: [TanStack Query overview](https://tanstack.com/query/latest/docs/framework/react/overview)
