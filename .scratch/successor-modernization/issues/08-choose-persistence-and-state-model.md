> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Choose the persistence and state model

Type: grilling
Status: superseded — historical reference only
Blocked by: 03, 11

## Question

Which persistence and application-state model should own library records, reading progress, settings, categories, backups, and migrations in the Successor while keeping data local, exportable, recoverable, and testable?

## Comments

- Research recommends main-process SQLite plus transitional Recoil and target Jotai. This decision must freeze the exact binding/fallback, successor data-location and legacy-import entry point, restore semantics, durable progress schema, migration rollback, snapshot/export contract, and end of browser persistence.
- Architecture asset: [`persistence-and-state-contract.md`](../research/persistence-and-state-contract.md).

## Answer

Use main-process SQLite as the sole durable store, with `better-sqlite3` as the selected binding subject to an exact Electron 44/macOS arm64 clean-install/rebuild/package/launch proof. `node:sqlite` is the first fallback only if the embedded runtime offers the required surface at accepted non-experimental stability and passes the same repository contract. Dexie requires reopening the decision. Ship exactly one binding behind successor-owned repositories.

Store the database at `<Rensai userData>/data/rensai.sqlite3`, daily and safety snapshots in separate app-owned backup directories, and disposable jobs under app temp. Main owns source grants, migrations, repositories, backup/restore/import, and settings. SQLite uses foreign keys, WAL, full synchronous durability, transactional writes, integrity checks, and checksum-recorded migrations.

Persist series, chapters, categories, source grants, settings, import receipts, and exact chapter progress (`read`, nullable zero-based page index, page count at last read, last-read time). Recoil is migration-only; final Personal Alpha uses Jotai/component state for disposable UI state and has no normal browser persistence or dual writes.

Use consistent SQLite snapshots, 14 daily plus five independently retained safety snapshots, a versioned secret/path-safe portable JSON export, and validated replacement restore. The Personal Alpha imports only an explicitly selected Houdoku JSON backup, not Chromium profile LevelDB; it snapshots, previews, validates, regrants paths, and transactionally replaces data while reporting skipped executable/network/credential/cache state.
