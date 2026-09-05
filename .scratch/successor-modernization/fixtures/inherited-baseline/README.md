> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Inherited-baseline fixtures

These fixtures are synthetic planning assets for the dedicated Houdoku-to-Rensai importer. They are not Rensai's future export format.

- `backup-empty.json`: valid empty outer backup.
- `backup-representative.json`: valid outer backup with string-encoded local-storage values, Unicode content, categories, read/unread chapters, relevant settings, and data that Personal Alpha must skip.
- `backup-malformed.json.invalid`: intentionally invalid JSON; keep the `.invalid` suffix so generic JSON tooling does not treat it as valid.
- `generate-large-fixture.mjs`: deterministic generator for a large outer backup. It writes only to an explicit output path.
- `local-content-corpus.md`: the folder/archive corpus to materialize when ingestion tests are implemented.

Never add a real Houdoku backup here until it has been explicitly selected and redacted. Tracker tokens, personal filesystem paths, copyrighted manga pages, and other private data must not enter the repository.
