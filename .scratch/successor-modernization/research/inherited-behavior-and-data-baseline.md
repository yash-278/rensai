> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Inherited Houdoku behavior and data baseline

Status: superseded — historical reference only
Captured: 2026-08-29  
Scope: synchronized Houdoku base at `a0c69348d5d3cf018bb6d127de86c63434913d14`

## Conclusion

Houdoku's durable contract is small enough to migrate deliberately. The renderer stores string values in Chromium `localStorage`; library values are JSON-encoded arrays, settings are scalar strings, and a backup is an unversioned JSON object containing a copy of every local-storage entry. A restore is not a full restore: it additively upserts series and chapters, preserves `read` when either copy says true, and ignores categories, settings, extension configuration, and tracker tokens.

The Personal Alpha importer should preserve filesystem-backed series, chapter identity, categories, and chapter-level read state; explicitly map the still-relevant library and reader settings; and produce a report for anything skipped. It must not load or execute inherited plugins, carry credentials into the new profile, or automatically import online-source state. There is no durable exact-page position in Houdoku, so Rensai has nothing to migrate for page resume.

No existing Houdoku application-data directory was present at the conventional macOS locations checked on 2026-08-29. No real user data was copied. The committed fixtures are synthetic.

## Canonical implementation sources

- Store keys and string-only wrapper: [`storeKeys.json`](../../../apps/desktop/src/common/constants/storeKeys.json), [`persistantStore.ts`](../../../apps/desktop/src/renderer/util/persistantStore.ts)
- Library CRUD and merge semantics: [`library.ts`](../../../apps/desktop/src/renderer/services/library.ts), [`library/utils.tsx`](../../../apps/desktop/src/renderer/features/library/utils.tsx)
- Backup and restore: [`backup.ts`](../../../apps/desktop/src/renderer/util/backup.ts)
- Settings types, defaults, and serialization: [`types.ts`](../../../apps/desktop/src/common/models/types.ts), [`settings/utils.ts`](../../../apps/desktop/src/renderer/features/settings/utils.ts)
- Local Content discovery and page enumeration: [`filesystem.ts`](../../../apps/desktop/src/main/services/extensions/filesystem.ts), [`archives.ts`](../../../apps/desktop/src/main/util/archives.ts), [`main filesystem.ts`](../../../apps/desktop/src/main/util/filesystem.ts)
- Reader state and behavior: [`ReaderPage.tsx`](../../../apps/desktop/src/renderer/components/reader/ReaderPage.tsx), [`ReaderViewer.tsx`](../../../apps/desktop/src/renderer/components/reader/ReaderViewer.tsx), [`readerStates.ts`](../../../apps/desktop/src/renderer/state/readerStates.ts)
- App identity, window lifecycle, and app-data subdirectories: [`package.json`](../../../apps/desktop/package.json), [`main/index.ts`](../../../apps/desktop/src/main/index.ts), [`appdata.ts`](../../../apps/desktop/src/main/util/appdata.ts)

## Durable locations

| Surface | Inherited behavior | Migration consequence |
|---|---|---|
| Renderer data | Default Electron session `localStorage`; no custom partition | Read through a dedicated legacy-profile importer, never make Chromium storage Rensai's database |
| macOS user data | `app.getPath('userData')`; with inherited product name this is conventionally `~/Library/Application Support/Houdoku` | Discover through Electron/provider APIs or an explicit user-selected location; do not hard-code the path |
| Chromium storage | Conventionally below the user-data profile in `Local Storage/leveldb` | Treat the LevelDB profile as provider-owned input; prefer Houdoku JSON backup when available |
| Thumbnails | `<userData>/thumbnails/<series-id>.<extension>` | Regenerate; do not import as authoritative data |
| Plugins | `<userData>/plugins` | Never scan, load, or execute in Personal Alpha |
| Downloads | `<userData>/downloads`, or `general-CustomDownloadsDir` | Skip in Personal Alpha and report; Local Content reads from its source path |
| Logs | `<userData>/logs/main.log` | Do not migrate |
| Archive extraction | `<userData>/extracted/<random-uuid>/...` | Disposable cache; do not migrate |
| Automatic backups | Relative process-working-directory `backups/` | Do not depend on this location; let the user select a backup or legacy profile |

The inherited package identity is `Houdoku` / `com.faltro.Houdoku`. The successor identity is intentionally separate, so Rensai must never point its normal runtime at this profile.

## Local-storage schema

All stored values are strings because the wrapper calls ``localStorage.setItem(key, `${value}`)``.

| Key | Encoded value | Personal Alpha treatment |
|---|---|---|
| `library-series-list` | JSON array of `Series` | Import supported filesystem entries |
| `library-chapters-<series-id>` | JSON array of `Chapter` | Import only for an accepted series |
| `library-category-list` | JSON array of `{id,label}` | Import and preserve stable IDs |
| `general-<setting>` | Scalar string | Map allowlisted relevant settings |
| `reader-<setting>` | Scalar string | Map allowlisted reader preferences |
| `tracker-<setting>` | Scalar string | Skip |
| `integration-<setting>` | Scalar string | Skip |
| `extension-settings-<extension-id>` | Extension-defined string/JSON | Skip without parsing or execution |
| `tracker-access-token-<tracker-id>` | Credential string | Never import, log, or include in a Rensai export |

### Series

```ts
type Series = {
  id?: string;
  extensionId: string;
  sourceId: string;
  title: string;
  altTitles: string[];
  description: string;
  authors: string[];
  artists: string[];
  tags: string[];
  status: 'Ongoing' | 'Completed' | 'Cancelled';
  originalLanguageKey: LanguageKey;
  numberUnread: number;
  remoteCoverUrl: string;
  trackerKeys?: Record<string, string>;
  categories?: string[];
  preview?: boolean;
};
```

The built-in filesystem extension ID is `9ef3242e-b5a0-4f56-bf2f-5e0c9f6f50ab`; its `sourceId` is the selected absolute series path. Filesystem series default to the directory basename, `Completed`, Japanese original language, empty descriptive metadata, empty tracker keys, and no remote cover.

`numberUnread` is derived cache data. Recompute it from imported chapters rather than trusting it.

### Chapter

```ts
type Chapter = {
  id?: string;
  seriesId?: string;
  sourceId: string;
  title: string;
  chapterNumber: string;
  volumeNumber: string;
  languageKey: LanguageKey;
  groupName: string;
  time: number;
  read: boolean;
};
```

For Local Content, `sourceId` is an absolute chapter directory or archive path. Houdoku generates IDs on insertion. It has no page index, page count, last-opened timestamp, or per-page progress field.

### CRUD and merge behavior

- Series upsert removes the existing object with the same ID and appends the replacement, so list order can change.
- Chapter upsert creates a map keyed by chapter ID, replaces matching IDs, and appends new IDs through object insertion order.
- Removing a series deletes its chapter key unless `preserveChapters` is explicitly requested.
- Refresh matches chapters by `sourceId`, carries the old ID and `read` flag, and deletes orphaned chapter IDs.
- Categories are independently upserted by ID. Series reference category IDs through `categories`.
- Parsing has no runtime schema validation. Missing keys become empty lists, while malformed JSON throws.

## Backup contract

Manual backup creates `houdoku_backup_YYYY-MM-DD.json` and serializes the entire `localStorage` object. The outer object values remain strings, so library arrays are JSON encoded twice: once as the value string and once by the outer backup object.

There is no format version, application version, checksum, schema validation, size limit, or transactional rollback.

Restore behavior is specifically:

1. Parse the outer JSON object.
2. If `library-series-list` exists, parse its value and call `updateSeries` for every item.
3. For every `library-chapters-*` key, derive the series ID from the suffix.
4. Ignore that chapter list if the corresponding series does not exist after step 2.
5. Merge each backup chapter by ID and set `read = existing.read || backup.read`.
6. Upsert the backup chapter objects. Existing chapters absent from the backup remain.
7. Ignore every other key during restore.

This is additive merge, not replacement. It can trigger thumbnail downloads while restoring series. A malformed outer or nested value throws. Settings and credentials may be present in the backup even though the restore ignores them.

Automatic backup runs from the dashboard when enabled. It writes at most one file per date into a relative `backups/` directory and deletes `files[0]` when the count is exceeded without explicitly sorting the directory listing. This retention behavior is not a safe successor contract.

## Settings contract

Settings use one key per value. Booleans parse as true only for the exact string `true`; numbers use base-10 `parseInt`; strings map the literal `null` to null; string arrays are comma-joined/split and therefore cannot round-trip values containing commas.

Relevant settings to map deliberately:

- Library: `ApplicationTheme`, `ChapterLanguages`, `ConfirmRemoveSeries`, `LibraryColumns`, `LibraryView`, `LibrarySort`, `LibraryFilterStatus`, `LibraryFilterProgress`, `LibraryFilterCategory`, `LibraryCropCovers`, `ChapterListVolOrder`, `ChapterListChOrder`, `ChapterListPageSize`.
- Reader: fit width/height/stretch, `ReadingDirection`, `PageStyle`, preload amount, page-number overlay, scrollbar, page gap, max page width and metric, double-spread offset, contrast optimization, and keyboard bindings.
- Path: `CustomDownloadsDir` must not become an automatic import path. It can be shown as a legacy value for explicit user selection.

Settings to skip are `RefreshOnStart`, `AutoCheckForUpdates`, automatic-backup settings, tracker auto-update, and Discord presence. Their inherited capabilities are not in Personal Alpha.

Inherited reader defaults are left-to-right, single-page, contain width and height, no stretch, two-page preload, visible scrollbar, no gap, 100% maximum width, no page offset, and contrast optimization off.

## Local Content discovery

### Selection flow

- The user selects one directory through the native open dialog.
- In single-series mode, that directory becomes one series.
- In multi-series mode, each immediate child returned by `listDirectory` is treated as a candidate series. The listing is not restricted to directories, despite the UI wording.
- Import retrieves the series, recursively discovers chapters, stores both, recalculates unread count, and attempts a cover download when relevant.

### Supported inputs

- Chapter directories containing `.png`, `.jpg`, `.jpeg`, or `.webp` images.
- `.zip`, `.rar`, `.cbz`, or `.cbr` chapter archives.
- Extension matching is case-sensitive; uppercase suffixes are ignored.
- Files are recursively enumerated and then naturally sorted by basename with a numeric `Intl.Collator`.

Chapter discovery recursively walks every file below the series root. Each file contributes its parent directory as a chapter. An archive contributes itself as a chapter and removes its parent directory from the set. Metadata comes from the chapter directory/archive basename: `c<number>` for chapter, `v<integer>` for volume, `[group]` for group, or the first number when no volume marker exists. The full trimmed basename remains the title. Local chapters default to English and current wall-clock time.

### Archive and path hazards to make explicit tests

- Recursive traversal follows `stat` results without a symlink policy or cycle guard.
- There are no depth, file-count, byte-size, decompressed-size, image-dimension, or time limits.
- ZIP extraction reads the whole archive and flattens all entries to basenames; duplicate basenames can collide.
- RAR extraction also flattens basenames and skips encrypted entries.
- Each extraction clears every directory in the shared extraction root before creating a new UUID subdirectory, so concurrent reads can interfere.
- The custom `atom://` path mechanism can expose arbitrary paths from renderer-controlled input.

These behaviors are baseline evidence, not preservation requirements. The successor must preserve user-visible ordering and supported formats while replacing the unsafe traversal, extraction, and path-broker implementation.

## Reader journey

1. Open a library series and choose a chapter.
2. Prefer an offline downloaded chapter when found; otherwise ask its source for page URLs. Local Content uses the filesystem source.
3. Enumerate pages and start at page 1. A page is passed transiently only while moving between chapters; it is not persisted.
4. Read in Single, Double, or Long Strip mode with left-to-right or right-to-left navigation.
5. Double mode pairs portrait pages, keeps landscape spreads alone, and applies the `All`, `First`, or `None` offset rule.
6. Navigate by click zones, sidebar controls, scrolling in Long Strip, or configurable keyboard shortcuts.
7. At `pageNumber >= floor(0.8 * lastPageNumber)`, mark the chapter and same-number language variants read, recalculate unread count, and optionally notify trackers.
8. Moving beyond a boundary opens the adjacent chapter. Exiting resets reader atoms and returns to the series page.

Preserve the three page styles, reading direction, spread grouping intent, fit controls, chapter navigation, and chapter-level progress. Treat the 80% threshold as an explicit product decision in the implementation specification rather than an accidental storage rule. Add exact-page resume only as new successor behavior with its own schema and tests.

## macOS inherited behavior

- The main window is frameless, initially 1024x728, with a 250x150 minimum.
- Closing the last window on macOS leaves the app process alive; activating the Dock icon recreates the window.
- The current window enables Node integration and disables context isolation. This is baseline evidence to remove, not preserve.
- The package defines an unsigned, non-hardened development DMG and does not explicitly promise an arm64 target.
- External window opens are denied in-app and sent to the OS shell without a destination allowlist.
- The renderer loads a packaged file URL in production and the development server URL in development, so storage-origin behavior can differ across modes.

## Import, preserve, and skip contract

| Legacy datum | Decision |
|---|---|
| Filesystem series with the built-in filesystem extension ID | Import when the source path is user-approved and valid |
| Series/chapter IDs | Preserve when valid to keep stable relationships |
| Titles, descriptive metadata, language, tags, status | Import with validation; allow Local Content defaults |
| Categories and category membership | Import with referential validation |
| Chapter `read` | Import; merge policy is explicit, not inherited accidentally |
| `numberUnread` | Recompute |
| Exact page | No legacy value exists; initialize to page 1/unset |
| Relevant library/reader settings | Allowlist and map; invalid values fall back with a report |
| Source paths | Never trust silently; normalize and require user-granted access |
| Online-source series | Skip by default and report title/reason without contacting the network |
| `trackerKeys`, tracker settings, tracker tokens | Drop; never log token values |
| Extension settings and plugin directory | Drop and never execute |
| Updater, Discord, telemetry/network state | Drop |
| Thumbnails, logs, extraction cache | Drop/regenerate |
| Downloaded online-source chapters | Skip and report; not part of Local Content Personal Alpha |

The importer should be read-only against the Houdoku source, validate the complete input before committing, use a single SQLite transaction, create a pre-import Rensai snapshot, and emit counts plus non-sensitive skip reasons. Re-running the same import must be idempotent.

## Fixture set and required assertions

Fixtures live in [`../fixtures/inherited-baseline`](../fixtures/inherited-baseline).

| Fixture | Purpose | Required assertion |
|---|---|---|
| `backup-empty.json` | Empty valid backup | Imports zero items without error |
| `backup-representative.json` | Local series, Unicode, categories, read states, settings, and deferred secrets/state | Imports allowlisted data; recalculates unread; reports and drops deferred data; never exposes the synthetic token |
| `backup-malformed.json.invalid` | Invalid outer JSON | Rejects before database mutation with a safe error |
| `generate-large-fixture.mjs` | Deterministic large backup | Bounded parse/import, stable counts, and no partial commit |
| `local-content-corpus.md` | Filesystem/archive corpus blueprint | Preserves accepted ordering/formats and rejects hostile limits/path cases |

Before implementation sign-off, add one explicitly selected and redacted real Houdoku backup or profile fixture if one becomes available. It must contain no credentials, private paths, or copyrighted pages and must document the redaction. Its absence does not permit inventing a migration promise.

## Decisions unlocked

- Ticket 05 can define Personal Alpha around folder/archive import, library browsing, the three reader modes, chapter navigation, chapter-level progress, and new exact-page resume if desired.
- Ticket 08 can specify a versioned importer into SQLite, a separate Rensai profile, and a portable export that excludes secrets by construction.
- The implementation plan must put fixture-backed importer tests before deleting the legacy reader/storage path.
