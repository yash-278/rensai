> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Local Content corpus blueprint

Materialize this corpus with generated 1x1 images and archives when ingestion implementation begins. Filenames and expected behavior are the contract; no copyrighted pages belong in it.

## Accepted ordering and metadata

```text
Library/
  星の旅 — Volume 1/
    v1 c1 [Fixture]/
      1.png
      02.jpg
      10.webp
    v1 c2.cbz
    bonus 2.5/
      page-1.jpeg
```

Expected:

- One series titled `星の旅 — Volume 1`.
- Chapters for the c1 directory, c2 archive, and `bonus 2.5` directory.
- Pages naturally ordered `1.png`, `02.jpg`, `10.webp`.
- c1 parses chapter 1, volume 1, group `Fixture`; c2 parses chapter 2 and volume 1; bonus parses chapter 2.5.
- Unicode paths remain intact.

## Multi-series selection

```text
Collection/
  Series A/
  Series B/
  stray-file.txt
```

Record the inherited behavior that all immediate children are candidates. Rensai should accept the two directories and reject/report the stray file.

## Case and format matrix

- Accepted inherited suffixes: `.png`, `.jpg`, `.jpeg`, `.webp`, `.zip`, `.rar`, `.cbz`, `.cbr`.
- Add uppercase variants to prove the successor's intentional policy. Houdoku ignores them because matching is case-sensitive; Rensai should support case-insensitive suffixes unless the implementation specification decides otherwise.
- Add empty directory and archive cases; they must produce a clear non-destructive error.

## Hostile and bounded cases

- Symlink cycle and symlink outside the selected root.
- ZIP slip paths, nested directories, and duplicate basenames.
- Archive with encrypted RAR members.
- Archive/file count, compressed size, decompressed size, nesting depth, image dimensions, and processing-time limits at exactly-below and exactly-above boundaries.
- Corrupt ZIP/RAR and image payloads with supported suffixes.
- Two concurrent archive reads to prove extraction isolation.
- Selected root moved or deleted after import.

Rensai must reject escape paths, prevent partial database mutation, clean only its own temporary directory, and return safe errors that do not expose private absolute paths.
