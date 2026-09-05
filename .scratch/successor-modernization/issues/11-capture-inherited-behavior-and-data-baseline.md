> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Capture the inherited behavior and data-format baseline

Type: task
Status: superseded — historical reference only
Blocked by:

## Question

What Local Content formats, persisted keys and schemas, backup format, library and reader journeys, filesystem layouts, and macOS runtime behavior does the synchronized Houdoku base actually implement, and what synthetic fixtures can later verify intentional preservation or migration?

## Comments

- Capture synthetic empty/representative/malformed/large fixtures plus a redacted real Houdoku backup or app-data fixture if available. Record exact keys, merge semantics, categories/settings, read and page progress, Unicode/paths, archive behavior, and legacy plugin/tracker/updater data that must be skipped.
- Claimed on 2026-08-29 after the Rensai identity direction was resolved. The baseline will be code-linked and fixture-backed; user-owned Houdoku data will not be copied into the repository without an explicit redaction decision.
- Research asset: [`inherited-behavior-and-data-baseline.md`](../research/inherited-behavior-and-data-baseline.md).
- Synthetic fixtures: [`../fixtures/inherited-baseline`](../fixtures/inherited-baseline).

## Answer

Houdoku persists string values in renderer `localStorage`: JSON-encoded series, chapters, and categories plus scalar settings, extension configuration, and tracker tokens. Its unversioned backup is a dump of every local-storage entry. Restore is only an additive series/chapter merge; it preserves `read` when either copy is true and ignores categories, settings, and every other key. There is no durable exact-page progress.

Local Content supports recursive image folders and ZIP/RAR/CBZ/CBR chapters with case-sensitive suffix matching and natural basename ordering. The inherited implementation has unbounded traversal/extraction, symlink and path-broker risks, basename-flattening archive collisions, and shared extraction cleanup. Preserve the user-visible formats and reader journey, not these unsafe mechanisms.

The Rensai importer should accept validated filesystem-backed series, chapter IDs and read state, categories, and allowlisted reader/library preferences into a single SQLite transaction. It should recompute unread counts; require user approval for source paths; and report while dropping online-source state, executable plugins, trackers/tokens, updater/Discord data, downloads, thumbnails, logs, and caches. The committed synthetic empty, representative, malformed, large, and Local Content fixture blueprints establish the implementation test contract. No real user data was found or copied.
