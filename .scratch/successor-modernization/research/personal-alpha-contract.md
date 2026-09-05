> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Rensai Personal Alpha contract

Status: superseded — historical reference only
Captured: 2026-08-29  
Target: Yash-only macOS arm64 build

## Product promise

Rensai Personal Alpha is a local-first desktop manga reader for organizing and reading user-owned folders and comic archives on one Mac. It must start, browse the library, open content, retain progress, and back up or restore data without a network connection.

It is successful when Yash can install a local build, grant access to a manga location, import a representative library, read it in the expected manga layouts, close and reopen the app without losing state, export the library, restore it, and understand every item skipped from a Houdoku import.

## Included Local Content

Mandatory input formats:

- A series directory containing chapter directories.
- A series directory containing `.zip` or `.cbz` chapter archives.
- `.png`, `.jpg`, `.jpeg`, and `.webp` page images, matched case-insensitively.
- Unicode filenames and paths.

RAR/CBR is explicitly optional for Personal Alpha. It is included only if ticket 07 selects a maintained extractor that passes the same bounded hostile-corpus tests as ZIP/CBZ. If that gate is not met, `.rar` and `.cbr` are rejected with a clear message and deferred; they are not silently ignored or routed through the inherited extractor.

Import preserves natural page ordering and parses inherited chapter/volume/group hints as a convenience. Metadata remains editable when naming conventions do not parse well.

### Ingestion limits

The alpha must enforce and test these defaults per selected series/chapter operation:

| Limit | Default |
|---|---:|
| Recursive directory depth | 32 levels |
| Series discovery entries | 100,000 files/directories |
| Chapter page/archive entries | 10,000 |
| Compressed archive size | 2 GiB |
| Expanded archive size | 4 GiB |
| Expansion ratio | 100:1 |
| Single page file size | 100 MiB |
| Decoded image pixels | 200 megapixels |
| One discovery/extraction operation | 120 seconds |

An operation that reaches a limit stops without partial library mutation, cleans only its own temporary files, and explains which limit was reached. Work must be cancellable. These are safety defaults, not permanent format promises; a future product setting may expose bounded overrides.

## Library contract

The Personal Alpha supports:

- Import one series directory or the immediate child directories of a selected collection.
- Preview the detected series and chapter count before commit.
- Edit title and descriptive metadata.
- Refresh a series from its granted source and preserve stable chapter identity, read state, and exact-page progress for matched chapters.
- Grid/list library browsing, title search, title/unread sorting, and read-status/category filtering.
- Create, rename, and delete categories; assign or remove series membership.
- View unread counts derived from chapter state.
- Mark one or multiple chapters read or unread.
- Remove a series from Rensai without deleting source files.
- Report missing or moved source paths and let the user relocate/regrant them.

The database stores normalized source references and security-scoped/user-granted access information where macOS requires it. It never treats an arbitrary renderer string as filesystem authority.

## Reader contract

The Personal Alpha supports:

- Single page, double page, and vertical long-strip modes.
- Left-to-right and right-to-left navigation.
- Natural page order, next/previous chapter navigation, direct page selection, and direct chapter selection.
- Portrait pairing and standalone landscape spreads in double-page mode, with `All`, `First`, and `None` offset behavior.
- Fit to width, fit to height, stretch, page gap, maximum page width, scrollbar visibility, contrast optimization, sidebar visibility, and fullscreen.
- Click/tap zones, wheel/scroll behavior, and configurable keyboard shortcuts.
- A visible loading state and actionable errors for missing, corrupt, unsupported, or permission-denied content.

Reader preferences persist across launches.

## Progress semantics

Progress is durable per chapter and contains:

- `lastPageIndex` using a zero-based internal index.
- `pageCountAtLastRead` for safe clamping if content changes.
- `read` as explicit chapter completion state.
- `lastReadAt` for continue-reading ordering.

Rensai records page progress after a short debounce and synchronously requests a final save on chapter change or reader exit. Reopening a chapter resumes at the clamped last page; a visible action restarts from page 1.

Automatic completion retains the inherited intent: mark the chapter read upon reaching at least 80% of the current page count. Explicit mark-read and mark-unread actions override completion state. Marking unread does not erase the saved page position. Refresh carries progress only when the chapter matches by stable ID or the importer's normalized source identity.

There is no Houdoku exact-page value to import. Imported chapters begin with no resume position while retaining their read flag.

## Settings included

- Theme.
- Library view, columns, sort, filters, cover crop, and chapter-list sort/page size.
- Chapter-language filter where it remains meaningful for Local Content.
- Confirm-before-remove behavior.
- Every reader preference and keyboard binding listed in the reader contract.
- Backup/export destination chosen by the user.

Updater, automatic source refresh, legacy automatic-backup retention, tracker, Discord, and extension settings are not included.

## Backup, export, restore, and legacy import

Rensai owns three distinct operations:

1. **Operational snapshot:** an app-managed, consistent SQLite snapshot created before migrations, restore, and legacy import, plus bounded scheduled retention.
2. **Portable export:** a versioned, documented JSON package containing library metadata, categories, settings, source references, and progress. It excludes credentials, security-scoped access tokens/bookmarks that are not portable, caches, pages, and logs by construction.
3. **Restore:** validate an entire portable export, snapshot the current database, then replace the Rensai dataset in one transaction. It is not an accidental additive merge.

The Houdoku importer is a separate entry point. It accepts an explicitly selected Houdoku JSON backup, shows counts and non-sensitive skip reasons, validates before writing, snapshots current Rensai data, and imports into a clean replacement dataset in one transaction. It does not search for or parse Chromium profile storage in Personal Alpha. It preserves accepted IDs, categories, and chapter read state; maps allowlisted preferences; recomputes derived values; initializes exact-page progress as unset; and never contacts an Online Source. Re-running the same source as replacement yields the same logical result.

If restore or import fails, Rensai leaves the prior dataset active and offers the created snapshot. Source files and Houdoku data are always read-only.

## Offline and privacy guarantee

With update, extension, tracker, Discord, telemetry, and remote-cover paths absent, the Personal Alpha makes no required network request. A clean offline launch must support the entire import-to-reader journey for already granted Local Content. Tests should deny network access and fail if the application attempts an unexpected request.

All user library data remains on the Mac unless Yash explicitly exports it. Logs use safe identifiers and do not include private page data, tokens, or full source paths in ordinary messages.

## Explicitly absent

These are out of the Personal Alpha contract rather than accepted regressions:

- Online Sources and executable Extensions.
- Plugin browsing, installation, updating, settings, or execution.
- Manga trackers and inherited tracker credentials.
- Remote cover downloads and offline download management for Online Sources.
- Discord presence, telemetry, accounts, cloud sync, or collaboration.
- Automatic application updates.
- Public binaries, code signing/notarization, Windows/Linux support, or a public support promise.
- RAR/CBR unless it passes the stated inclusion gate.
- Automatic migration of arbitrary Houdoku application directories beyond the validated importer contract.
- A web reader. The website remains a landing page, documentation, downloads/release information when applicable, and project attribution.

## Acceptance journey

On a clean offline macOS arm64 account:

1. Launch Rensai and select the synthetic Local Content corpus.
2. Preview and import a Unicode-named series containing folders and CBZ chapters.
3. Organize it into a category and verify search/sort/filter/unread behavior.
4. Read across Single, Double, and Long Strip in RTL and LTR, cross a chapter boundary, and close mid-chapter.
5. Relaunch offline and resume at the saved page with the correct read/unread count.
6. Move the source, observe the missing-source state, and relink it without losing progress.
7. Create a portable export, mutate the library, restore, and verify replacement plus pre-restore recovery snapshot.
8. Import the representative Houdoku fixture and verify preserved/dropped/recomputed fields and safe reporting.
9. Exercise malformed, oversized, corrupt, symlink, path-escape, and concurrent archive cases without partial mutation or external-path access.
