# Downloads

Status: approved design implemented in the production Downloads page.

Run `pnpm --filter @houdoku/desktop design:preview` and open `/downloads.html`. The review uses the real component, downloader, and library storage service with fictional chapters and explicit filesystem/image IPC fixtures. It does not connect to websites or change user files.

## Layout and interactions

The current-download summary stays above the collection. It shows the chapter, pages saved, queue counts, and Pause queue or Resume queue. Before page URLs arrive, it shows Preparing chapter with indeterminate progress. Pausing finishes the current request; Resume remains disabled until the worker has stopped. The paused chapter returns to the front of the queue and resumes from the next unsaved page.

Queue and Downloaded are separate views. Search, view controls, the selection header, and bottom actions stay visible while the list scrolls internally. Queue entries show order, chapter metadata, and explicit failure explanations. Downloaded chapters are grouped by series ID, with separate expand and selection controls.

Selections survive search and filtering within a view. Bulk actions apply to the full selection count, including hidden entries. Switching views or download directories clears the selection. A help icon explains the filtering behavior.

The Queue view supports status filters, retrying failed chapters, moving queued entries up/down, and removing waiting entries. Clear queued preserves the active chapter and failures. Removal requires confirmation. Failed entries return to the queue when retried, retaining their original download directory; a paused queue still requires Resume queue. Queue edits cannot remove the active task, and insertion deduplicates waiting, active, and incoming chapters.

The Downloaded view uses the configured download directory and actual library chapter records. It supports group selection, reader navigation, refresh, and confirmed file deletion. Deleting files preserves series and reading progress. Partial deletion failures remain selected with an error and can be retried. Deletion uses the directory captured by the selected records. Pending scans and deletion results cannot overwrite a different directory's current view. Refresh failure retains the previous list and offers retry.

## Download completion

The worker records preparation, image, and file-write failures as retryable entries and stops cleanly. A separate worker lock prevents an early Resume from starting another worker while Pause is still settling.

New downloads create `.rensai-incomplete` inside the chapter folder and remove it only after all pages are saved. Both filesystem inventory methods exclude marked folders. This keeps paused, failed, or interrupted downloads out of the available-offline list even after the in-memory queue is cleared. Existing folders without a marker retain the inherited recognition behavior; this change does not audit the completeness of older downloads. The queue remains session state, as before.

## Review and checks

The review sidebar offers active, paused, scan-error, and empty scenarios. Advance sample resolves one held synthetic image request through the real worker. Theme controls and fixture scenarios are review-only.

At narrow widths, status moves under the chapter title and row actions remain in the menu. Footer actions wrap outside the scrolling list.

```sh
pnpm --filter @houdoku/desktop test:downloads
pnpm --filter @houdoku/desktop check-types
pnpm --filter @houdoku/desktop build
pnpm --filter @houdoku/desktop design:check
```

Seven service/filesystem tests cover pause/resume without duplicate workers or skipped pages, last-page completion, preparation/image/write failures, retry directory preservation, queue edits, and incomplete-folder exclusion using disposable files.

The rendered production check covers themes, actual worker pause/resume and completion, queue ordering/removal/retry, selections hidden by filters, fixed actions during scroll, confirmation/cancellation, partial deletion failure, library/progress preservation, reader routing, refresh failure/retry, directory changes during scans and deletion, empty states, and a 640-pixel layout. Screenshots are written to the temporary `rensai-design-review` directory.

The desktop build, type checks, targeted lint, service tests, and all five rendered design checks passed. Live source transfers and user-owned library UAT remain separate from these synthetic checks.
