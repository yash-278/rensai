# Library

The approved Library design is implemented in the desktop app. `/library.html` on the design preview server now renders the actual production component against synthetic storage and IPC. It never opens an application profile or connects to a source.

## Layout and behavior

The header holds the collection count, Refresh, and Add series. Local search, filters, sorting, view selection, and selection mode remain available while the collection scrolls. Search and filters apply immediately because the data is already local. Reading progress has three choices: All series, With unread, and Caught up. Publication status is independent: an ongoing series can be caught up.

The default collection begins with up to three started series that have an unread saved chapter. Continue opens that chapter in the reader. The row represents started series, not recent activity; the data model has no last-read timestamp. It disappears during filtering or selection.

Comfortable and compact grids keep titles and progress beneath artwork. Covers only retains accessible names and visible action menus. List view includes creators, publication status, categories, and a reading action. All four views retain selection and right-click menus.

The view menu preserves saved 2/4/6/8-column and crop preferences and adds Automatic columns. Automatic sizing uses smaller covers for Compact grid. At narrow window widths the grid uses two columns without changing the stored preference.

Selection actions remain below the scrollable collection: Refresh selected, Mark read, Assign category, and Done. Selecting all shown series preserves selections outside the current filter. Actions resolve selected IDs against current series state. Per-series menus expose details, marking read, selection, category membership, and removal with the existing confirmation preference.

Refresh operates on the filtered or selected set. A source rejection is recorded as a failure without aborting the remaining series. Saved results remain visible, loading ends, and retry targets the failed series still in the library.

## Chapter progress

Library progress is derived from saved chapters using the chapter table's existing language priority, duplicate selection, and group filters. The chapter table and Library share that eligibility function and next-unread ordering. Continue uses the saved chapter ID, including when chapter numbering has gaps or fractions.

The progress bar counts eligible chapter records actually marked read. This differs from the legacy stored unread estimate, which infers progress from the highest read chapter and numerical gaps. The Library uses its derived counts for display, filtering, and sorting; other consumers of the stored estimate are unchanged. Zero eligible chapters displays No chapters rather than a progress bar.

Category creation and management remain in the application sidebar. Reader and series detail layouts retain their existing implementations.

## Verification

Run from the repository root:

```sh
pnpm --filter @houdoku/desktop test:library
pnpm --filter @houdoku/desktop design:check
pnpm --filter @houdoku/desktop check-types
pnpm --filter @houdoku/desktop build
```

The pure progress tests cover language priority, group filtering, duplicate selection, chapter gaps, fractional numbering, and empty/caught-up sets. The rendered Library check exercises the production component and storage service with fictional data: themes, four views, column settings, actual progress and reader destination, immediate filters, fixed bulk actions, saved category/read/removal changes, source rejection and retry, empty state, and narrow layout. The fixture intercepts source/filesystem IPC and blocks network traffic. Captures are written under the temporary `rensai-design-review` directory.

These checks verify application behavior with controlled data. They do not validate live source compatibility or the user's saved library.
