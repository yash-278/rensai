# Series details and chapters

Status: migrated to the production page. `/series.html` now renders the real Series details component with fictional data and offline IPC responses.

Run `pnpm --filter @houdoku/desktop design:preview` and open `/series.html`. The fixture uses the real storage service on the preview origin, seeds synthetic records, and intercepts source, filesystem, and tracker requests. It never opens the Electron application profile. Reader and library links reach an illustrative destination. Downloads enter the real queue, with execution held at the fixture boundary.

## Layout and behavior

The header keeps the title, Continue reading, and series actions visible. The metadata rail contains the cover, reading progress, creators, publication information, expandable description, and tags. It scrolls independently from the chapters.

The chapter panel keeps search, filters, table headings, and pagination visible while rows scroll. The bottom action bar shows selection count, Mark read, Mark unread, Download selected, and Done. Selections use chapter IDs and persist across sorting, pages, and filters. Actions apply to the full selected count, including hidden chapters; the help icon explains this scope. Selection ends after a bulk action or when leaving the series.

At narrow widths, the cover and progress form a compact summary. Series details expands within a bounded scroll area. Chapter read and download states move beneath titles, and bulk actions wrap while remaining visible. Local editing keeps the complete existing form, with its action buttons outside the scrolling content.

Chapter search and filters apply immediately to local data. Continue reading and progress use the existing language-priority, duplicate-selection, and group-filter rules, independently of text, read-state, and download-state filters. Reset clears all filters, including the persisted language selection. Opening the reader retains the existing reader's progress behavior.

## Existing capabilities retained

- Saved metadata and chapters, source refresh, visible failure/retry, and existing reader routes.
- Tracker linking, local-only metadata editing, removal confirmation, and the existing next/range/unread/all download dialog.
- Source previews retain Back to search and Add to library; download and removal actions are unavailable until added.
- Language and group filters, independent volume/chapter ordering, title/language/group visibility, and 10/20/50/100 page sizes. Page size and sorting use the existing settings store; column visibility remains local to the mounted table.
- Clickable chapter rows, keyboard-accessible chapter links, visible menus, right-click menus, Select previous, and read/unread/download actions.
- Cover lookup continues to use cached thumbnails, source images, and filesystem covers.

## Download states

Queued and downloading labels use the downloader's live state. Failed chapters use its error records and expose Retry download. Retrying through the chapter menu replaces that chapter's old error and queues it again. Filesystem status is refreshed when a task changes or finishes, when chapters change, and when the configured download directory changes. Requests that finish after the series or directory changes are ignored.

A failed filesystem status check displays Status unavailable and a retry action. It does not classify every chapter as not downloaded. Filesystem series show Available offline and disable redundant download actions.

The inherited filesystem endpoint detects a matching chapter directory; it does not verify that every page was downloaded. An active task, queued task, or recorded failure takes precedence over this directory result. Full download integrity checks are outside this page migration.

## Verification

`pnpm --filter @houdoku/desktop design:check` includes the real Series details fixture. It checks reader navigation, persisted read progress and page size, selection across pages/filters/sorting, fixed actions, independent metadata scrolling, download queue/status/retry, refresh failure, local editing, tracker access, download-dialog access, source-preview restrictions and promotion, right-click actions, removal, missing series, and a 640-pixel layout without horizontal overflow.

Captures cover dark, light, selection, long metadata, empty, and narrow states in the temporary `rensai-design-review` directory. These checks exercise production components with synthetic boundaries. They do not perform live source requests, download images, link a real tracker account, or modify the user's library.
