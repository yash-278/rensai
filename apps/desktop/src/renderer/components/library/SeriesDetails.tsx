import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Languages } from '@tiyo/common';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { ArrowLeft, Loader2, MoreHorizontal, Play, RefreshCw } from 'lucide-react';
import { Button } from '@houdoku/ui/components/Button';
import { Badge } from '@houdoku/ui/components/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@houdoku/ui/components/DropdownMenu';
import ipcChannels from '@/common/constants/ipcChannels.json';
import routes from '@/common/constants/routes.json';
import { FS_METADATA } from '@/common/temp_fs_metadata';
import library from '@/renderer/services/library';
import { downloadCover } from '@/renderer/util/download';
import { reloadSeriesList } from '@/renderer/features/library/utils';
import { readingProgress } from '@/renderer/features/library/readingProgress';
import { chapterLanguagesState } from '@/renderer/state/settingStates';
import {
  chapterFilterGroupNamesState,
  chapterListState,
  currentExtensionMetadataState,
  reloadingSeriesListState,
  seriesListState,
  seriesState,
  sortedFilteredChapterListState,
} from '@/renderer/state/libraryStates';
import { SeriesTrackerDialog } from './tracker/SeriesTrackerDialog';
import EditSeriesModal from './EditSeriesModal';
import DownloadModal from './DownloadModal';
import { RemoveSeriesDialog } from './RemoveSeriesDialog';
import LibraryCover from './LibraryCover';
import { ChapterTable } from './series/chapter-table/ChapterTable';
import './series/series.css';
const { ipcRenderer } = require('electron');

function SeriesDetailsPage({ id }: { id: string }) {
  const [series, setSeries] = useRecoilState(seriesState);
  const seriesList = useRecoilValue(seriesListState);
  const setSeriesList = useSetRecoilState(seriesListState);
  const setChapters = useSetRecoilState(chapterListState);
  const chapters = useRecoilValue(sortedFilteredChapterListState);
  const [metadata, setMetadata] = useRecoilState(currentExtensionMetadataState);
  const setGroups = useSetRecoilState(chapterFilterGroupNamesState);
  const languages = useRecoilValue(chapterLanguagesState);
  const [refreshing, setRefreshing] = useRecoilState(reloadingSeriesListState);
  const [ready, setReady] = useState(false);
  const [modal, setModal] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState(false);
  const [refreshError, setRefreshError] = useState(false);

  useEffect(() => {
    setGroups([]);
  }, [id, setGroups]);
  useEffect(() => {
    const saved = library.fetchSeries(id);
    setSeries(saved || undefined);
    setChapters(saved ? library.fetchChapters(id) : []);
    setReady(true);
  }, [id, seriesList, setSeries, setChapters]);
  const extensionId = series?.id === id ? series.extensionId : undefined;
  useEffect(() => {
    let active = true;
    setMetadata(undefined);
    if (extensionId)
      ipcRenderer
        .invoke(ipcChannels.EXTENSION_MANAGER.GET, extensionId)
        .then((value) => {
          if (active) setMetadata(value);
        })
        .catch(() => {
          if (active) setMetadata(undefined);
        });
    return () => {
      active = false;
    };
  }, [extensionId, setMetadata]);

  if (!ready)
    return (
      <div className="series-page items-center justify-center">
        <Loader2 aria-label="Loading series" className="animate-spin" />
      </div>
    );
  if (!series || series.id !== id)
    return (
      <div className="series-page items-center justify-center gap-4">
        <h1 className="text-section-title">Series not found</h1>
        <Link to={routes.LIBRARY}>Back to library</Link>
      </div>
    );
  const progress = readingProgress(chapters);
  const local = series.extensionId === FS_METADATA.id;
  const refresh = async () => {
    if (refreshing) return;
    setRefreshError(false);
    try {
      const failed = await reloadSeriesList([series], setSeriesList, setRefreshing, languages);
      setRefreshError(failed.length > 0);
    } catch {
      setRefreshError(true);
      setRefreshing(false);
    }
  };
  return (
    <div className="series-page">
      <header className="series-page-header">
        <div className="min-w-0">
          <Link
            className="inline-flex items-center gap-2 text-muted-foreground mb-2"
            to={series.preview ? routes.SEARCH : routes.LIBRARY}
            onClick={() => setSeriesList(library.fetchSeriesList())}
          >
            <ArrowLeft className="w-4 h-4" />
            {series.preview ? 'Back to search' : 'Library'}
          </Link>
          <h1 className="text-page-title" title={series.title}>
            {series.title}
          </h1>
          <p className="text-muted-foreground mt-1">
            {local ? 'Local files' : metadata?.name || 'Source unavailable'} ·{' '}
            {series.status || 'Unknown status'}
          </p>
        </div>
        <div className="series-header-actions">
          <Button
            className="series-header-refresh"
            variant="outline"
            disabled={refreshing}
            onClick={refresh}
          >
            {refreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />}{' '}
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Series actions">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={refreshing} onSelect={refresh}>
                Refresh chapters
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setModal('trackers')}>Trackers</DropdownMenuItem>
              {local && (
                <DropdownMenuItem onSelect={() => setModal('edit')}>Edit series</DropdownMenuItem>
              )}
              {!series.preview && (
                <>
                  <DropdownMenuItem disabled={local} onSelect={() => setModal('download')}>
                    Download chapters
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setModal('remove')}>
                    Remove series
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {series.preview && (
            <Button
              onClick={() => {
                const saved = library.upsertSeries({ ...series, preview: false });
                setSeries(saved);
                setSeriesList(library.fetchSeriesList());
                downloadCover(saved).catch(console.error);
              }}
            >
              Add to library
            </Button>
          )}
          {progress.next ? (
            <Button asChild variant={series.preview ? 'outline' : 'default'}>
              <Link to={`${routes.READER}/${id}/${progress.next.id}`}>
                <Play />
                {progress.read ? 'Continue reading' : 'Start reading'}
              </Link>
            </Button>
          ) : (
            <Button disabled>{progress.total ? 'Caught up' : 'No chapters'}</Button>
          )}
        </div>
      </header>
      {refreshError && (
        <div className="series-refresh-error" role="alert">
          <span>Could not refresh this series. Your saved chapters are still available.</span>
          <Button variant="outline" size="sm" disabled={refreshing} onClick={refresh}>
            Retry
          </Button>
        </div>
      )}
      <div className="series-workspace">
        <aside className="series-metadata" aria-label="Series metadata" tabIndex={0}>
          <div className="series-cover">
            <LibraryCover series={series} />
          </div>
          <div className="series-metadata-summary">
            <p>
              {progress.read} of {progress.total} chapters read
            </p>
            <progress
              className="w-full h-1 my-3 accent-primary"
              value={progress.read}
              max={progress.total || 1}
              aria-label="Reading progress"
            />
            <p className="text-caption text-muted-foreground">
              {progress.next
                ? `Up next: chapter ${progress.next.chapterNumber}`
                : progress.total
                  ? 'All caught up'
                  : 'No chapters in these languages and groups'}
            </p>
            <Button
              variant="ghost"
              className="series-metadata-toggle"
              aria-expanded={details}
              aria-controls="series-metadata-details"
              onClick={() => setDetails(!details)}
            >
              {details ? 'Hide details' : 'Series details'}
            </Button>
          </div>
          <div
            id="series-metadata-details"
            className={`series-metadata-details ${details ? 'is-expanded' : ''}`}
          >
            <dl className="series-facts">
              <div>
                <dt>Author</dt>
                <dd>{Array.from(new Set(series.authors)).join('; ') || 'Unknown'}</dd>
              </div>
              <div>
                <dt>Artist</dt>
                <dd>{Array.from(new Set(series.artists)).join('; ') || 'Unknown'}</dd>
              </div>
              <div>
                <dt>Original language</dt>
                <dd>{Languages[series.originalLanguageKey]?.name || 'Unknown'}</dd>
              </div>
              <div>
                <dt>Publication status</dt>
                <dd>{series.status || 'Unknown'}</dd>
              </div>
            </dl>
            <h2 className="font-medium mt-6 mb-2">About this series</h2>
            <p
              id="series-description-text"
              className={`whitespace-pre-wrap text-muted-foreground ${expanded ? '' : 'line-clamp-3'}`}
            >
              {series.description || 'No description available.'}
            </p>
            {series.description && (
              <Button
                variant="ghost"
                className="-ml-3"
                aria-expanded={expanded}
                aria-controls="series-description-text"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Show less' : 'Read more'}
              </Button>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              {Array.from(new Set(series.tags)).map((tag) => (
                <Badge variant="secondary" key={tag}>
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </aside>
        <ChapterTable series={series} />
      </div>
      {modal === 'trackers' && (
        <SeriesTrackerDialog
          series={series}
          showing={modal === 'trackers'}
          setShowing={(open) => setModal(open ? 'trackers' : '')}
        />
      )}
      {modal === 'edit' && (
        <EditSeriesModal
          series={series}
          showing={modal === 'edit'}
          setShowing={(open) => setModal(open ? 'edit' : '')}
          save={(updated) => {
            setSeries(updated);
            if (updated.remoteCoverUrl !== series.remoteCoverUrl) {
              ipcRenderer
                .invoke(ipcChannels.FILESYSTEM.DELETE_THUMBNAIL, updated)
                .then(() => downloadCover(updated))
                .catch(console.error);
            }
          }}
        />
      )}
      {modal === 'download' && (
        <DownloadModal
          series={series}
          showing={modal === 'download'}
          setShowing={(open) => setModal(open ? 'download' : '')}
        />
      )}
      {modal === 'remove' && (
        <RemoveSeriesDialog
          series={series}
          showing={modal === 'remove'}
          setShowing={(open) => setModal(open ? 'remove' : '')}
        />
      )}
    </div>
  );
}
export default function SeriesDetails() {
  const { id } = useParams<{ id: string }>();
  return <SeriesDetailsPage key={id} id={id!} />;
}
