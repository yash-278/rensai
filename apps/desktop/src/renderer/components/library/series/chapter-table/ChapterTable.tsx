import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  RowSelectionState,
  useReactTable,
} from '@tanstack/react-table';
import { Chapter, Languages, Series } from '@tiyo/common';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Download,
  Eye,
  EyeOff,
  FileCheck,
  Loader2,
  MoreHorizontal,
  Settings2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@houdoku/ui/components/Button';
import { Input } from '@houdoku/ui/components/Input';
import { Checkbox } from '@houdoku/ui/components/Checkbox';
import { FieldHelp } from '@houdoku/ui/components/FieldHelp';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@houdoku/ui/components/Select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@houdoku/ui/components/DropdownMenu';
import { ContextMenu, ContextMenuTrigger } from '@houdoku/ui/components/ContextMenu';
import routes from '@/common/constants/routes.json';
import { TableColumnSortOrder } from '@/common/models/types';
import { FS_METADATA } from '@/common/temp_fs_metadata';
import {
  chapterFilterGroupNamesState,
  chapterListState,
  seriesState,
  sortedFilteredChapterListState,
} from '@/renderer/state/libraryStates';
import {
  chapterLanguagesState,
  chapterListChOrderState,
  chapterListPageSizeState,
  chapterListVolOrderState,
} from '@/renderer/state/settingStates';
import { markChapters } from '@/renderer/features/library/utils';
import { ChapterTableLanguageFilter } from './ChapterTableLanguageFilter';
import { ChapterTableGroupFilter } from './ChapterTableGroupFilter';
import { ChapterTablePagination } from './ChapterTablePagination';
import { ChapterTableContextMenu } from './ChapterTableContextMenu';
import { downloadLabels, useChapterDownloads } from './useChapterDownloads';

const nextOrder = (order: TableColumnSortOrder) =>
  order === TableColumnSortOrder.Descending
    ? TableColumnSortOrder.Ascending
    : order === TableColumnSortOrder.Ascending
      ? TableColumnSortOrder.None
      : TableColumnSortOrder.Descending;
const orderIcon = (order: TableColumnSortOrder) =>
  order === TableColumnSortOrder.Descending ? (
    <ArrowDown />
  ) : order === TableColumnSortOrder.Ascending ? (
    <ArrowUp />
  ) : (
    <ChevronsUpDown />
  );

export function ChapterTable({ series }: { series: Series }) {
  const navigate = useNavigate();
  const setSeries = useSetRecoilState(seriesState);
  const [chapters, setChapters] = useRecoilState(chapterListState);
  const eligible = useRecoilValue(sortedFilteredChapterListState);
  const [languages, setLanguages] = useRecoilState(chapterLanguagesState);
  const [groups, setGroups] = useRecoilState(chapterFilterGroupNamesState);
  const [volumeOrder, setVolumeOrder] = useRecoilState(chapterListVolOrderState);
  const [chapterOrder, setChapterOrder] = useRecoilState(chapterListChOrderState);
  const [pageSize, setPageSize] = useRecoilState(chapterListPageSizeState);
  const [pageIndex, setPageIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [progressFilter, setProgressFilter] = useState('all');
  const [downloadFilter, setDownloadFilter] = useState('all');
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [notice, setNotice] = useState('');
  const scroll = useRef<HTMLDivElement>(null);
  const downloads = useChapterDownloads(series, chapters);
  const local = series.extensionId === FS_METADATA.id;
  const data = eligible.filter(
    (chapter) =>
      (!query.trim() ||
        `${chapter.chapterNumber} ${chapter.title}`
          .toLocaleLowerCase()
          .includes(query.trim().toLocaleLowerCase())) &&
      (progressFilter === 'all' || chapter.read === (progressFilter === 'read')) &&
      (downloadFilter === 'all' || downloads.getStatus(chapter) === downloadFilter),
  );
  const selected = chapters.filter((chapter) => selection[chapter.id!]);
  const selectPrevious = (chapter: Chapter) =>
    setSelection((old) => {
      const result = { ...old };
      eligible
        .filter((item) => parseFloat(item.chapterNumber) < parseFloat(chapter.chapterNumber))
        .forEach((item) => {
          result[item.id!] = true;
        });
      return result;
    });
  const mark = (items: Chapter[], read: boolean) => {
    markChapters(items, series, read, setChapters, setSeries, languages);
    setSelection({});
    setNotice(`${items.length} chapters marked ${read ? 'read' : 'unread'}.`);
  };
  const download = (items: Chapter[]) => {
    setSelection({});
    setNotice('');
    downloads
      .download(items)
      .catch(() => setNotice('Download failed. Retry from the chapter menu.'));
  };
  const rowActions = (chapter: Chapter) => ({
    read: chapter.read,
    retry: downloads.getStatus(chapter) === 'failed',
    canDownload:
      !local &&
      !series.preview &&
      !['saved', 'queued', 'downloading', 'pausing'].includes(downloads.getStatus(chapter)),
    onRead: () => navigate(`${routes.READER}/${series.id}/${chapter.id}`),
    onMark: () => mark([chapter], !chapter.read),
    onSelectPrevious: () => selectPrevious(chapter),
    onDownload: () => download([chapter]),
  });
  const status = (chapter: Chapter) => {
    const value = downloads.getStatus(chapter);
    const Icon =
      value === 'saved'
        ? FileCheck
        : value === 'downloading' || value === 'checking'
          ? Loader2
          : value === 'queued'
            ? Clock
            : value === 'failed' || value === 'unknown'
              ? AlertCircle
              : Download;
    return (
      <span
        className={`inline-flex items-center gap-2 ${value === 'failed' ? 'text-danger' : 'text-muted-foreground'}`}
      >
        <Icon className={`w-4 h-4 ${value === 'downloading' ? 'animate-spin' : ''}`} />
        {downloadLabels[value]}
      </span>
    );
  };
  const columns: ColumnDef<Chapter>[] = [
    {
      id: 'select',
      enableHiding: false,
      header: ({ table }) => (
        <Checkbox
          aria-label="Select page"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select chapter ${row.original.chapterNumber}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
    },
    {
      id: 'chapter',
      enableHiding: false,
      header: 'Chapter',
      cell: ({ row }) => (
        <>
          <Link
            className="series-chapter-link"
            to={`${routes.READER}/${series.id}/${row.original.id}`}
          >
            <span>
              {row.original.chapterNumber || 'Unnumbered'}
              {table.getColumn('title')?.getIsVisible() && row.original.title
                ? `. ${row.original.title}`
                : ''}
            </span>
          </Link>
          {table.getColumn('language')?.getIsVisible() && (
            <p className="text-caption text-muted-foreground mt-1">
              {Languages[row.original.languageKey]?.name || row.original.languageKey}
            </p>
          )}
          <p className="series-mobile-status">
            {row.original.read ? 'Read' : 'Unread'} ·{' '}
            {downloadLabels[downloads.getStatus(row.original)]}
          </p>
        </>
      ),
    },
    // Preferences are retained while title/language are composed inside the chapter cell.
    { id: 'title', header: 'Title', cell: () => null },
    { id: 'language', header: 'Language', cell: () => null },
    {
      id: 'volume',
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          aria-label="Sort by volume"
          onClick={() => setVolumeOrder(nextOrder(volumeOrder))}
        >
          Vol. {orderIcon(volumeOrder)}
        </Button>
      ),
      cell: ({ row }) => row.original.volumeNumber || '—',
    },
    { id: 'group', header: 'Group', cell: ({ row }) => row.original.groupName || 'Unknown' },
    {
      id: 'progress',
      header: 'Progress',
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-2 text-caption">
          {row.original.read ? (
            <Eye className="w-4 h-4 text-muted-foreground" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          )}
          {row.original.read ? 'Read' : 'Unread'}
        </span>
      ),
    },
    {
      id: 'download',
      header: 'Download',
      cell: ({ row }) => <div className="series-download-status">{status(row.original)}</div>,
    },
    {
      id: 'actions',
      enableHiding: false,
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Actions for chapter ${row.original.chapterNumber}`}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <ChapterTableContextMenu context={false} {...rowActions(row.original)} />
        </DropdownMenu>
      ),
    },
  ];
  const table = useReactTable({
    data,
    columns,
    getRowId: (chapter) => chapter.id!,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { rowSelection: selection, pagination: { pageIndex, pageSize } },
    onRowSelectionChange: setSelection,
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater;
      setPageIndex(next.pageIndex);
      if (next.pageSize !== pageSize) setPageSize(next.pageSize);
    },
    autoResetPageIndex: false,
    manualSorting: true,
    manualFiltering: true,
  });
  useEffect(() => {
    setPageIndex(0);
  }, [
    query,
    progressFilter,
    downloadFilter,
    languages,
    groups,
    chapterOrder,
    volumeOrder,
    pageSize,
  ]);
  useEffect(() => {
    setPageIndex((index) => Math.min(index, Math.max(0, Math.ceil(data.length / pageSize) - 1)));
  }, [data.length, pageSize]);
  useEffect(() => {
    scroll.current?.scrollTo({ top: 0 });
  }, [
    pageIndex,
    query,
    progressFilter,
    downloadFilter,
    languages,
    groups,
    chapterOrder,
    volumeOrder,
  ]);
  useEffect(() => {
    setSelection((old) =>
      Object.fromEntries(
        Object.entries(old).filter(([id]) => chapters.some((chapter) => chapter.id === id)),
      ),
    );
  }, [chapters]);
  const uniqueGroups = useMemo(
    () => Array.from(new Set(chapters.map((chapter) => chapter.groupName || ''))),
    [chapters],
  );
  const reset = () => {
    setQuery('');
    setProgressFilter('all');
    setDownloadFilter('all');
    setLanguages([]);
    setGroups([]);
  };
  const selectFilter = (
    label: string,
    value: string,
    change: (value: string) => void,
    options: [string, string][],
  ) => (
    <Select value={value} onValueChange={change}>
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([key, text]) => (
          <SelectItem key={key} value={key}>
            {text}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  return (
    <>
      <section className="series-chapters" aria-label="Chapters">
        <div className="series-chapter-heading">
          <div>
            <h2 className="text-section-title">Chapters</h2>
            <p className="text-caption text-muted-foreground mt-1">
              {data.length} matching chapters
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(query ||
              progressFilter !== 'all' ||
              downloadFilter !== 'all' ||
              groups.length > 0 ||
              languages.length > 0) && (
              <Button variant="ghost" size="sm" onClick={reset}>
                Reset filters
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              aria-label="Sort chapters"
              onClick={() => setChapterOrder(nextOrder(chapterOrder))}
            >
              {orderIcon(chapterOrder)}
              {chapterOrder === TableColumnSortOrder.Descending
                ? 'Newest first'
                : chapterOrder === TableColumnSortOrder.Ascending
                  ? 'Oldest first'
                  : 'Source order'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Chapter columns">
                  <Settings2 />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      className="capitalize"
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      onSelect={(event) => event.preventDefault()}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="series-chapter-filters">
          <Input
            className="series-chapter-search"
            aria-label="Search chapters"
            placeholder="Title or chapter number…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <ChapterTableLanguageFilter />
          <ChapterTableGroupFilter uniqueGroupNames={uniqueGroups} />
          {selectFilter('Reading progress', progressFilter, setProgressFilter, [
            ['all', 'All progress'],
            ['read', 'Read'],
            ['unread', 'Unread'],
          ])}
          {selectFilter('Download status', downloadFilter, setDownloadFilter, [
            ['all', 'All downloads'],
            ['saved', 'Available offline'],
            ['none', 'Not downloaded'],
            ['queued', 'Queued'],
            ['downloading', 'Downloading'],
            ['failed', 'Failed'],
          ])}
        </div>
        {downloads.statusError && (
          <div className="series-refresh-error" role="alert">
            <span>Could not check downloaded chapters.</span>
            <Button size="sm" variant="outline" onClick={downloads.retryStatus}>
              Retry status
            </Button>
          </div>
        )}
        <div className="series-chapter-scroll" ref={scroll} tabIndex={0} aria-label="Chapter list">
          <table className="series-chapter-table">
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers
                    .filter((header) => !['title', 'language'].includes(header.id))
                    .map((header) => (
                      <th
                        key={header.id}
                        className={`text-left series-${header.id === 'chapter' ? 'title' : header.id}-cell`}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <ContextMenu key={row.id}>
                  <ContextMenuTrigger asChild>
                    <tr
                      data-selected={row.getIsSelected()}
                      data-chapter-id={row.original.id}
                      className="cursor-pointer"
                      onClick={(event) => {
                        if (!event.currentTarget.contains(event.target as Node)) return;
                        if (!(event.target as HTMLElement).closest('button, a, [role="checkbox"]'))
                          rowActions(row.original).onRead();
                      }}
                    >
                      {row
                        .getVisibleCells()
                        .filter((cell) => !['title', 'language'].includes(cell.column.id))
                        .map((cell) => (
                          <td
                            key={cell.id}
                            className={`series-${cell.column.id === 'chapter' ? 'title' : cell.column.id}-cell`}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                    </tr>
                  </ContextMenuTrigger>
                  <ChapterTableContextMenu {...rowActions(row.original)} />
                </ContextMenu>
              ))}
            </tbody>
          </table>
          {!data.length && (
            <div className="series-chapter-empty">
              <h3 className="font-medium">
                {chapters.length ? 'No matching chapters' : 'No chapters yet'}
              </h3>
              <p className="text-muted-foreground">
                {chapters.length
                  ? 'Try different languages, groups, or filters.'
                  : 'Refresh the series to check for new chapters.'}
              </p>
              {chapters.length > 0 && (
                <Button variant="outline" onClick={reset}>
                  Reset filters
                </Button>
              )}
            </div>
          )}
        </div>
        <ChapterTablePagination table={table} />
      </section>
      <footer className="series-action-footer" aria-label="Chapter selection actions">
        {selected.length ? (
          <>
            <div className="flex gap-2 items-center">
              <span>{selected.length} selected</span>
              <FieldHelp
                label="Chapter selection"
                descriptionId="chapter-selection-help"
                text="Selections remain across pages and filters. Actions apply to every selected chapter, including those currently hidden."
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => mark(selected, true)}>
                <Eye />
                Mark read
              </Button>
              <Button variant="outline" onClick={() => mark(selected, false)}>
                <EyeOff />
                Mark unread
              </Button>
              <Button disabled={local || !!series.preview} onClick={() => download(selected)}>
                <Download />
                Download selected
              </Button>
              <Button variant="ghost" onClick={() => setSelection({})}>
                Done
              </Button>
            </div>
          </>
        ) : (
          <p role="status" className="text-caption text-muted-foreground">
            {notice || 'Select chapters to mark progress or download for offline reading.'}
          </p>
        )}
      </footer>
    </>
  );
}
