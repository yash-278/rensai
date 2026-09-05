> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Research persistence and state modernization options

Type: research
Status: superseded — historical reference only
Blocked by:

## Question

Should the successor retain the inherited `localStorage` and Recoil model for the Personal Alpha or migrate to a more durable user-owned persistence and maintained state approach; what viable options fit a local desktop library; and what migration, backup, testing, and maintenance consequences would each option create?

## Comments

- Claimed on 2026-08-29 for the `research/persistence-state` worktree.
- Research asset: [`persistence-and-state-options.md`](../research/persistence-and-state-options.md).

## Answer

Use an app-owned SQLite database as the canonical durable store in the Electron main process, behind narrow typed preload operations. Keep Recoil only as a short-lived bridge while feature repositories move away from direct `localStorage`, then replace it incrementally with Jotai; Jotai and component state remain disposable UI state and must not become a second durable store.

Choose `node:sqlite` only if the Node runtime embedded in the selected Electron line provides the required API at an accepted stability level; otherwise verify `better-sqlite3` installation, ABI rebuild, packaging, and macOS arm64 launch against that exact runtime. IndexedDB/Dexie is the fallback only if neither SQLite route packages reliably.

Use transactional schema migrations, a dedicated legacy Houdoku importer, safe SQLite operational snapshots, and a documented versioned JSON portable export. Restore is replace-by-default unless a separate merge operation is explicitly justified and specified. Final implementation choices still need the inherited-data fixture, successor data-location decision, exact-page progress decision, and packaged SQLite-binding proof.
