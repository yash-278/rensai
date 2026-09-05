> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Persistence and state contract

Status: superseded — historical reference only
Captured: 2026-08-29

## Decision

Rensai uses a main-process SQLite database as its sole durable source of truth. Use a maintained Electron-compatible `better-sqlite3` release behind a successor-owned repository port, and prove clean install, ABI rebuild, package inclusion, launch, migrations, snapshots, and restore on the exact Electron 44/macOS arm64 build before the persistence slice is accepted.

If that packaged proof fails, the ordered fallback is:

1. `node:sqlite`, only if the Node runtime embedded in the pinned Electron version exposes the required backup/session/API surface at an accepted non-experimental stability and passes the same repository contract.
2. Dexie/IndexedDB only if neither SQLite route can package reliably. Selecting it requires reopening this ticket because it changes canonical ownership, physical data location, backup mechanics, and part of the security boundary.

Do not carry multiple bindings in production or expose binding types beyond the adapter. The implementation spike selects one and deletes the unused adapter/dependency before the baseline is complete.

Recoil is permitted only as a temporary migration bridge inside intermediate implementation slices. The Personal Alpha ships with Jotai for shared UI state and React component state for local interaction. Neither persists canonical data. No new feature may add Recoil atoms or browser-storage persistence.

## Data locations

Under the separate Rensai identity (`io.github.yash278.rensai`), use:

```text
<app.getPath('userData')>/
  data/rensai.sqlite3
  backups/daily/
  backups/safety/
  temp/
  logs/
```

Chromium session data can remain elsewhere in the Electron profile, but it is disposable and not part of backup/restore. The Settings data page shows the resolved data directory, database size, last successful snapshot/export, and an “Open data folder” action implemented in main.

Never point Rensai at Houdoku's `userData` directory. Legacy import is explicit and read-only.

## SQLite connection contract

On every connection:

- `PRAGMA foreign_keys = ON` and assert it.
- `PRAGMA journal_mode = WAL` for the live database.
- `PRAGMA synchronous = FULL` for durability during Personal Alpha.
- `PRAGMA busy_timeout` with a bounded value and explicit busy errors.
- `PRAGMA trusted_schema = OFF` where the selected SQLite/binding supports it.
- Set and verify a successor-specific `application_id` and `user_version`/migration ledger.

One main-owned database service serializes writes. Repositories use prepared statements and explicit transactions for multi-record changes. Long imports and maintenance operations cannot interleave with normal writes. Shutdown checkpoints/close the connection without treating renderer unload as the only durability signal.

## Initial schema

The first implementation migration should cover:

```text
schema_migrations(version, name, applied_at, app_version, checksum)
source_grants(id, display_name, canonical_path, access_data, status, created_at, updated_at)
series(id, source_grant_id, legacy_source_id, title, alt_titles_json, description,
       authors_json, artists_json, tags_json, status, original_language,
       metadata_json, created_at, updated_at)
chapters(id, series_id, legacy_source_id, title, chapter_number, volume_number,
         language, group_name, source_kind, source_locator_json, discovered_at,
         read, last_page_index, page_count_at_last_read, last_read_at,
         metadata_json, created_at, updated_at)
categories(id, label, created_at, updated_at)
series_categories(series_id, category_id)
settings(key, value_json, updated_at)
legacy_imports(id, source_kind, source_fingerprint, imported_at, app_version,
               imported_counts_json, skipped_counts_json)
```

Exact SQL belongs to the implementation architecture ticket, but these ownership rules are fixed:

- UUID-like opaque IDs are application identity. Preserve valid Houdoku IDs during replacement import.
- `source_grants` owns absolute paths and macOS access material; renderer DTOs exclude both.
- `source_locator_json` is validated per `source_kind` and resolved only in main.
- Relationships and progress fields are normalized/queryable.
- Flexible descriptive legacy metadata may remain validated JSON during the first migration.
- Derived unread counts are queries/cached projections, never authoritative columns copied from Houdoku.
- Settings values have per-key runtime schemas and JSON encoding, not comma-joined strings.

Required indexes cover series title/sort, chapters by series and chapter order, unread/progress queries, category membership, and unique normalized source identity within a grant. Foreign-key delete behavior must be explicit and tested.

## Repository and application-state boundary

Main owns repositories for series, chapters/progress, categories, settings, source grants, import, export/snapshot, and migrations. The renderer obtains immutable DTO snapshots through the typed preload API.

Jotai owns only current UI/session state: selected series/chapter, query/filter inputs, reader session/page before checkpoint acknowledgement, modal/sidebar state, and operation status. Component state owns forms and local interactions. Feature actions persist first, then update or invalidate atoms. Optimistic interactions retain a rollback value and surface a typed error.

There is no automatic generic database subscription in the alpha. Commands return the updated entity/projection and explicit refresh/query methods rebuild affected views. This keeps the IPC surface small and deterministic.

## Exact-page progress

Progress lives on the chapter row:

- `last_page_index`: nullable, zero-based, non-negative.
- `page_count_at_last_read`: nullable positive integer.
- `read`: explicit boolean.
- `last_read_at`: nullable UTC timestamp.

Checkpoint commands carry chapter ID, reader-session ID, page index, current page count, read state transition if any, and a monotonically increasing session sequence. Main rejects stale/out-of-range sessions, clamps only at reopen after content refresh, and applies the newest accepted sequence transactionally. Page changes debounce in the renderer, while chapter change/reader close requests a final checkpoint and awaits acknowledgement before discarding the session where practical.

Imported Houdoku chapters preserve `read` and initialize the other progress fields to null.

## Migrations and rollback

- Ordered, checksum-recorded SQL/application migrations run before normal repositories open.
- Before any migration, create and verify a safety snapshot.
- Each migration is transactional when SQLite permits. File-format or multi-phase migrations use a new temporary database, validate it, then atomically swap while retaining the old file as the safety artifact.
- Run `integrity_check`, `foreign_key_check`, schema-version checks, and application row/reference/count checks before accepting a migrated/restored database.
- Never auto-downgrade. An older application encountering a newer schema stops with a clear message and leaves data untouched.
- A failed migration keeps the old database active/recoverable and records a safe error. It never deletes the Houdoku source or last valid Rensai snapshot.

## Snapshots, portable export, and restore

Operational snapshots use the binding's SQLite Online Backup API or `VACUUM INTO`; never copy only a live WAL database file. Snapshot into a temporary name, validate it, fsync/close as supported, then rename into place.

- Daily snapshots run at most once per local date after durable data changed; retain 14 deterministically by embedded UTC timestamp.
- Safety snapshots occur before migration, restore, and legacy import; retain the newest five independently of daily retention.
- Manual snapshot is available from Settings.
- Retention deletes only validated app-owned snapshot files inside the exact Rensai backup directories.

Portable export is versioned JSON with `format`, `formatVersion`, `createdAt`, `appVersion`, records, settings, and source display hints. It excludes canonical paths, access material, credentials, tokens, pages, caches, logs, and exact app-internal temporary data. It is streamed/bounded and deterministic enough for fixture comparison.

Native restore validates the whole artifact and version, creates a safety snapshot, constructs/restores a temporary database, runs integrity/application checks, then replaces the live dataset. There is no native merge operation in Personal Alpha.

## Houdoku import

The Personal Alpha imports an explicitly selected Houdoku JSON backup. It does not automatically search the old profile or parse Chromium LevelDB. Profile-directory import remains deferred until a redacted real profile proves it is needed and can be supported safely.

The importer:

1. Applies outer byte/key/item/depth limits and runtime schemas before mutation.
2. Redacts credential values from every diagnostic path.
3. Shows accepted series/chapters/categories/settings and skip counts/reasons.
4. Requires confirmation that the operation replaces the current Rensai dataset.
5. Creates a safety snapshot.
6. Builds the replacement in a transaction/temporary database.
7. Imports only validated filesystem-series IDs, metadata, categories, chapter IDs/read state, and allowlisted settings.
8. Requires source paths to be regranted; stored legacy paths are hints, not capabilities.
9. Recomputes unread projections and records an import receipt/fingerprint.
10. Validates and swaps only on success.

Online-source series, extension settings, plugins, tracker keys/tokens, updater/Discord state, thumbnails, downloads, logs, caches, unknown keys, and malformed records are skipped and reported without network access. The source backup remains unchanged.

## End of browser persistence

Cut over in vertical slices behind repository ports: library list, series/chapter/progress, categories, settings, then backup/import. Keep the legacy local-storage adapter only until each slice reads/writes SQLite successfully. Do not dual-write. Once the final slice passes fixture and packaged UAT:

- Remove `persistantStore`, normal-operation local-storage reads, and storage-backed Recoil effects.
- Remove Recoil and its dependency.
- Assert in tests that canonical keys are neither read nor written during normal Rensai use.
- Retain only the explicit file-based Houdoku backup importer.

## Acceptance

- Exact binding installs from a clean frozen lockfile and packages/launches on Electron 44 macOS arm64.
- Fresh and second offline launches return identical durable records/settings/progress.
- Transaction, stale-checkpoint, migration, import, snapshot, restore, corruption, wrong-version, unwritable-target, and retention tests pass.
- Repeated fixture import as replacement produces the same logical rows and safe report.
- Unicode, categories, IDs, read state, relevant settings, and source regrant survive; exact page initializes as specified.
- No Rensai data path, SQL, binding, generic IPC, localStorage key, or source capability is accessible from renderer code.
- Package contains one selected database binding and no Recoil/Dexie/legacy storage dependency unless this decision is formally reopened.
