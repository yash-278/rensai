import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { Languages } from '@tiyo/common';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Download,
  FolderOpen,
  MoreHorizontal,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@houdoku/ui/components/Button';
import { Input } from '@houdoku/ui/components/Input';
import { Checkbox } from '@houdoku/ui/components/Checkbox';
import { FieldHelp } from '@houdoku/ui/components/FieldHelp';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@houdoku/ui/components/DropdownMenu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@houdoku/ui/components/Dialog';
import {
  currentTaskState,
  queueState,
  runningState,
  downloadErrorsState,
} from '@/renderer/state/downloaderStates';
import { downloaderClient, DownloadTask, downloadKey } from '@/renderer/services/downloader';
import routes from '@/common/constants/routes.json';
import { useDownloadedChapters } from './useDownloadedChapters';
import './downloads.css';

type Item = {
  id: string;
  seriesId: string;
  series: string;
  chapter: string;
  title: string;
  language: string;
  status: 'queued' | 'failed' | 'saved';
  error?: string;
  task: DownloadTask;
};
const toItem = (task: DownloadTask, status: Item['status'], error?: string): Item => ({
  id: downloadKey(task),
  seriesId: task.series.id!,
  series: task.series.title,
  chapter: task.chapter.chapterNumber,
  title: task.chapter.title,
  language: Languages[task.chapter.languageKey]?.name || task.chapter.languageKey,
  status,
  error,
  task,
});

export default function Downloads() {
  const navigate = useNavigate();
  const tasks = useRecoilValue(queueState);
  const errors = useRecoilValue(downloadErrorsState);
  const current = useRecoilValue(currentTaskState);
  const running = useRecoilValue(runningState);
  const inventory = useDownloadedChapters();
  const { scanning, scanError, refresh, downloadsDir } = inventory;
  const queue = [
    ...tasks.map((task) => toItem(task, 'queued')),
    ...errors
      .filter(
        (error) =>
          !tasks.some((task) => downloadKey(task) === downloadKey(error)) &&
          (!current || downloadKey(current) !== downloadKey(error)),
      )
      .map((error) =>
        toItem(
          { ...error, downloadsDir: error.downloadsDir || downloadsDir },
          'failed',
          error.errorStr,
        ),
      ),
  ];
  const saved = inventory.saved.map((task) => toItem(task, 'saved'));
  const active = current ? toItem(current, 'queued') : null;
  const page = current?.page || 0;
  const totalPages = current?.totalPages;
  const pausing = !!current && !running;
  const [view, setView] = useState<'queue' | 'saved'>('queue');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selection, setSelection] = useState<string[]>([]);
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<{
    kind: 'clear' | 'remove' | 'delete';
    items: Item[];
  } | null>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const currentDir = useRef(downloadsDir);
  currentDir.current = downloadsDir;
  const openedInitialGroup = useRef(false);
  const queued = queue.filter((item) => item.status === 'queued');
  const failed = queue.filter((item) => item.status === 'failed');
  const shown = (view === 'queue' ? queue : saved).filter(
    (item) =>
      (view === 'saved' || filter === 'all' || item.status === filter) &&
      `${item.series} ${item.chapter} ${item.title} ${item.language}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
  );
  const selected = (view === 'queue' ? queue : saved).filter((item) => selection.includes(item.id));
  const selectedFailed = selected.filter((item) => item.status === 'failed');
  const groups = Array.from(new Set(saved.map((item) => item.seriesId)));
  useEffect(() => {
    if (!openedInitialGroup.current && groups.length) {
      setOpenGroups([groups[0]]);
      openedInitialGroup.current = true;
    }
  }, [inventory.saved]);
  const toggle = (ids: string[]) =>
    setSelection((old) =>
      ids.every((id) => old.includes(id))
        ? old.filter((id) => !ids.includes(id))
        : Array.from(new Set([...old, ...ids])),
    );
  const changeView = (value: 'queue' | 'saved') => {
    setView(value);
    setSelection([]);
    setQuery('');
    setNotice('');
    setActionError('');
  };
  useEffect(() => {
    setSelection([]);
    setDialog(null);
    setActionError('');
    setOpenGroups([]);
    openedInitialGroup.current = false;
  }, [downloadsDir]);
  useEffect(() => {
    scroll.current?.scrollTo({ top: 0 });
  }, [query, filter, view]);
  const selectionScope = JSON.stringify((view === 'queue' ? queue : saved).map((item) => item.id));
  useEffect(() => {
    const keys = new Set<string>(JSON.parse(selectionScope));
    setSelection((old) => old.filter((id) => keys.has(id)));
  }, [selectionScope]);
  const resume = () => {
    setNotice('');
    downloaderClient.start();
  };
  const retry = (ids: string[]) => {
    downloaderClient.retry(ids, downloadsDir);
    setSelection([]);
    setNotice(
      `${ids.length} chapters returned to the queue. Resume the queue to continue if paused.`,
    );
  };
  const move = (key: string, direction: -1 | 1) => downloaderClient.move(key, direction);
  const confirm = async () => {
    if (!dialog || busy) return;
    const operationDir = downloadsDir;
    setBusy(true);
    setActionError('');
    if (dialog.kind === 'delete') {
      const result = await inventory.remove(dialog.items.map((item) => item.task));
      if (currentDir.current !== operationDir) {
        setBusy(false);
        return;
      }
      setSelection(result.failed.map(downloadKey));
      setNotice(
        `${result.deleted.length} downloaded chapters deleted. Series and reading progress kept.`,
      );
      if (result.failed.length)
        setActionError(
          `Could not delete ${result.failed.length} chapters. Check folder permissions or wait for active downloads, then try again. Failed chapters remain selected.`,
        );
    } else {
      const keys = dialog.items.map((item) => item.id);
      const waiting = [
        ...downloaderClient.queue,
        ...(dialog.kind === 'clear' ? [] : downloaderClient.downloadErrors),
      ].filter((item) => keys.includes(downloadKey(item)));
      downloaderClient.remove(keys, dialog.kind !== 'clear');
      setSelection([]);
      setNotice(
        `${waiting.length} chapters removed from the queue. The current download was kept.`,
      );
    }
    setBusy(false);
    setDialog(null);
  };
  const allShown = shown.length > 0 && shown.every((item) => selection.includes(item.id));
  return (
    <div className="downloads-main downloads-page">
      <header className="downloads-page-header">
        <div>
          <h1 className="text-page-title">Downloads</h1>
          <p className="text-muted-foreground mt-1">
            Manage your queue and keep chapters for offline reading.
          </p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={scanning}>
          <RefreshCw className={scanning ? 'animate-spin' : ''} />
          {scanning ? 'Refreshing…' : 'Refresh downloaded'}
        </Button>
      </header>
      <section
        className={`downloads-current ${!active ? 'is-idle' : ''}`}
        aria-label="Current download"
      >
        <div className="downloads-current-icon">
          {active ? running ? <Download /> : <Pause /> : <FolderOpen />}
        </div>
        <div className="downloads-current-content">
          <p className="text-caption text-muted-foreground">
            {active
              ? running
                ? 'Downloading now'
                : 'Pausing after this page…'
              : queued.length
                ? 'Ready to download'
                : failed.length
                  ? 'Queue needs attention'
                  : 'Idle'}
          </p>
          <h2 className="font-medium mt-1">
            {active
              ? `${active.series} · Chapter ${active.chapter}`
              : queued.length
                ? `${queued.length} chapters waiting`
                : failed.length
                  ? `${failed.length} chapters need a retry`
                  : 'No downloads in progress'}
          </h2>
          {active && (
            <>
              <div
                className="downloads-progress-track"
                role="progressbar"
                aria-label="Current chapter progress"
                aria-valuenow={totalPages ? page : undefined}
                aria-valuemax={totalPages}
                aria-valuemin={0}
              >
                <span
                  style={{ width: `${totalPages ? Math.min(100, (page / totalPages) * 100) : 0}%` }}
                />
              </div>
              <p className="text-caption text-muted-foreground">
                {totalPages ? `${page} of ${totalPages} pages` : 'Preparing chapter…'} ·{' '}
                {active.language}
                {pausing ? ' · Finishing the current request' : ''}
              </p>
            </>
          )}
        </div>
        <div className="downloads-current-actions">
          {active && running ? (
            <Button variant="outline" onClick={() => downloaderClient.pause()}>
              <Pause />
              Pause queue
            </Button>
          ) : active || queued.length > 0 ? (
            <Button onClick={resume} disabled={pausing}>
              <Play />
              {pausing ? 'Pausing…' : 'Resume queue'}
            </Button>
          ) : failed.length > 0 ? (
            <Button variant="outline" onClick={() => retry(failed.map((item) => item.id))}>
              <RotateCcw />
              Retry failed
            </Button>
          ) : null}
          <span className="text-caption text-muted-foreground">
            {queued.length} queued{failed.length ? ` · ${failed.length} failed` : ''}
          </span>
        </div>
      </section>
      <section className="downloads-panel" aria-label="Download collection">
        <div className="downloads-panel-heading">
          <div className="downloads-tabs" role="group" aria-label="Download views">
            <button
              aria-label="Queue view"
              aria-pressed={view === 'queue'}
              onClick={() => changeView('queue')}
            >
              Queue <span>{queue.length}</span>
            </button>
            <button
              aria-label="Downloaded view"
              aria-pressed={view === 'saved'}
              onClick={() => changeView('saved')}
            >
              Downloaded <span>{saved.length}</span>
            </button>
          </div>
          {view === 'queue' && queued.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDialog({ kind: 'clear', items: queued })}
            >
              Clear queued
            </Button>
          )}
        </div>
        <div className="downloads-toolbar">
          <Input
            aria-label="Search downloads"
            placeholder="Series or chapter…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (view === 'saved' && event.target.value.trim()) setOpenGroups(groups);
            }}
          />
          {view === 'queue' && (
            <div className="downloads-filter-buttons" role="group" aria-label="Queue status">
              {[
                ['all', 'All'],
                ['queued', 'Queued'],
                ['failed', 'Failed'],
              ].map(([key, label]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={filter === key ? 'secondary' : 'ghost'}
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                >
                  {label}
                  {key === 'failed' && failed.length > 0 ? ` (${failed.length})` : ''}
                </Button>
              ))}
            </div>
          )}
          <span className="text-caption text-muted-foreground">{shown.length} chapters</span>
        </div>
        {actionError && (
          <div className="downloads-error" role="alert">
            {actionError}
          </div>
        )}
        {scanError && view === 'saved' && (
          <div className="downloads-error" role="alert">
            <span>Could not refresh downloaded chapters. Showing the last loaded list.</span>
            <Button size="sm" variant="outline" onClick={refresh} disabled={scanning}>
              Try again
            </Button>
          </div>
        )}
        <div
          ref={scroll}
          className="downloads-list"
          tabIndex={0}
          aria-label={view === 'queue' ? 'Queued chapters' : 'Downloaded chapters'}
        >
          {view === 'saved' && scanning && !saved.length ? (
            <div className="downloads-empty" role="status">
              Loading downloaded chapters…
            </div>
          ) : shown.length > 0 ? (
            <>
              <div className={`downloads-list-label ${view === 'queue' ? 'is-queue' : ''}`}>
                <Checkbox
                  aria-label="Select shown chapters"
                  checked={
                    allShown ||
                    (shown.some((item) => selection.includes(item.id)) && 'indeterminate')
                  }
                  onCheckedChange={() => toggle(shown.map((item) => item.id))}
                />
                <span>{view === 'queue' ? 'Chapter' : 'Series'}</span>
                <span className="downloads-list-label-end">
                  {view === 'queue' ? 'Status' : 'Saved chapters'}
                </span>
              </div>
              {view === 'queue'
                ? shown.map((item) => (
                    <div
                      key={item.id}
                      className="downloads-queue-row"
                      data-selected={selection.includes(item.id)}
                      data-download-id={item.id}
                    >
                      <Checkbox
                        aria-label={`Select ${item.series} chapter ${item.chapter}`}
                        checked={selection.includes(item.id)}
                        onCheckedChange={() => toggle([item.id])}
                      />
                      <div className="downloads-row-title">
                        <p className="font-medium">{item.series}</p>
                        <p className="text-caption text-muted-foreground">
                          Chapter {item.chapter} · {item.title} · {item.language}
                        </p>
                        {item.status === 'failed' && (
                          <p className="downloads-failure-text">{item.error}</p>
                        )}
                      </div>
                      <span
                        className={`downloads-status ${item.status === 'failed' ? 'text-danger' : 'text-muted-foreground'}`}
                      >
                        {item.status === 'failed' ? (
                          <AlertCircle />
                        ) : (
                          <span className="downloads-queue-position">
                            {queued.findIndex((task) => task.id === item.id) + 1}
                          </span>
                        )}
                        {item.status === 'failed' ? 'Failed' : 'Queued'}
                      </span>
                      {item.status === 'failed' && (
                        <Button
                          className="downloads-inline-retry"
                          size="sm"
                          variant="outline"
                          onClick={() => retry([item.id])}
                        >
                          Retry
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Actions for chapter ${item.chapter}`}
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {item.status === 'failed' ? (
                            <DropdownMenuItem onSelect={() => retry([item.id])}>
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Retry download
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem
                                disabled={queued[0]?.id === item.id}
                                onSelect={() => move(item.id, -1)}
                              >
                                <ArrowUp className="w-4 h-4 mr-2" />
                                Move up
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={queued.at(-1)?.id === item.id}
                                onSelect={() => move(item.id, 1)}
                              >
                                <ArrowDown className="w-4 h-4 mr-2" />
                                Move down
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem
                            onSelect={() => setDialog({ kind: 'remove', items: [item] })}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Remove from queue
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                : groups.map((series) => {
                    const items = shown.filter((item) => item.seriesId === series);
                    if (!items.length) return null;
                    const expanded = openGroups.includes(series);
                    const checked = items.every((item) => selection.includes(item.id));
                    return (
                      <div className="downloads-saved-group" key={series}>
                        <div className="downloads-group-header">
                          <Checkbox
                            aria-label={`Select ${items[0].series}`}
                            checked={
                              checked ||
                              (items.some((item) => selection.includes(item.id)) && 'indeterminate')
                            }
                            onCheckedChange={() => toggle(items.map((item) => item.id))}
                          />
                          <button
                            aria-expanded={expanded}
                            aria-controls={`download-group-${series}`}
                            onClick={() =>
                              setOpenGroups((old) =>
                                old.includes(series)
                                  ? old.filter((name) => name !== series)
                                  : [...old, series],
                              )
                            }
                          >
                            {expanded ? <ChevronDown /> : <ChevronRight />}
                            <span>{items[0].series}</span>
                          </button>
                          <span className="text-caption text-muted-foreground">
                            {items.length} chapters
                          </span>
                        </div>
                        {expanded && (
                          <div id={`download-group-${series}`}>
                            {items.map((item) => (
                              <div
                                className="downloads-saved-row"
                                key={item.id}
                                data-selected={selection.includes(item.id)}
                              >
                                <Checkbox
                                  aria-label={`Select ${item.series} chapter ${item.chapter}`}
                                  checked={selection.includes(item.id)}
                                  onCheckedChange={() => toggle([item.id])}
                                />
                                <div className="downloads-row-title">
                                  <p>
                                    Chapter {item.chapter} · {item.title}
                                  </p>
                                  <p className="text-caption text-muted-foreground">
                                    {item.language} · Available offline
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  aria-label={`Read ${item.series} chapter ${item.chapter}`}
                                  onClick={() =>
                                    navigate(
                                      `${routes.READER}/${item.task.series.id}/${item.task.chapter.id}`,
                                    )
                                  }
                                >
                                  <Play />
                                  Read
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
            </>
          ) : (
            <div className="downloads-empty">
              <FolderOpen className="w-8 h-8 text-muted-foreground" />
              <h2 className="text-section-title">
                {query || (view === 'queue' && filter !== 'all')
                  ? 'No matching chapters'
                  : view === 'saved'
                    ? 'Take your library offline'
                    : 'Your queue is empty'}
              </h2>
              <p className="text-muted-foreground">
                {query || (view === 'queue' && filter !== 'all')
                  ? 'Try another title or clear the filters.'
                  : view === 'saved'
                    ? 'Download chapters from a series to read them without a connection.'
                    : 'Choose chapters from a series to start a download.'}
              </p>
              {query || (view === 'queue' && filter !== 'all') ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery('');
                    setFilter('all');
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link to={routes.LIBRARY}>Browse library</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
      <footer className="downloads-footer" aria-label="Download selection actions">
        {selected.length ? (
          <>
            <div className="flex items-center gap-2">
              <span>{selected.length} selected</span>
              <FieldHelp
                label="Download selection"
                descriptionId="download-selection-help"
                text="Selections remain when you search or filter this view. Actions include selected chapters that are hidden. Switching views clears the selection."
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {view === 'queue' ? (
                <>
                  {selectedFailed.length > 0 && (
                    <Button onClick={() => retry(selectedFailed.map((item) => item.id))}>
                      <RotateCcw />
                      Retry {selectedFailed.length} failed
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setDialog({ kind: 'remove', items: selected })}
                  >
                    <X />
                    Remove selected
                  </Button>
                </>
              ) : (
                <Button
                  variant="destructive"
                  onClick={() => setDialog({ kind: 'delete', items: selected })}
                >
                  <Trash2 />
                  Delete downloaded
                </Button>
              )}
              <Button variant="ghost" onClick={() => setSelection([])}>
                Done
              </Button>
            </div>
          </>
        ) : (
          <p role="status" className="text-caption text-muted-foreground">
            {notice ||
              (view === 'queue'
                ? 'Queued chapters download in order. Failed chapters can be retried.'
                : 'Deleting a download keeps the series and reading progress in your library.')}
          </p>
        )}
      </footer>

      <Dialog
        open={!!dialog}
        onOpenChange={(open) => {
          if (!open && !busy) setDialog(null);
        }}
      >
        <DialogContent className="downloads-dialog" aria-busy={busy}>
          <DialogHeader>
            <DialogTitle>
              {dialog?.kind === 'delete'
                ? 'Delete downloaded chapters?'
                : dialog?.kind === 'clear'
                  ? 'Clear queued chapters?'
                  : 'Remove from queue?'}
            </DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'delete'
                ? `Delete the downloaded files for ${dialog.items.length} chapters. The series and reading progress stay in your library.`
                : `Remove ${dialog?.items.length || 0} waiting entries. The current download and saved files are kept.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              disabled={busy}
              variant={dialog?.kind === 'delete' ? 'destructive' : 'default'}
              onClick={confirm}
            >
              {busy ? 'Deleting…' : dialog?.kind === 'delete' ? 'Delete files' : 'Remove chapters'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
