const fs = require('fs');
const { ipcRenderer } = require('electron');
import ipcChannels from '@/common/constants/ipcChannels.json';
import { libraryCropCoversState } from '@/renderer/state/settingStates';
import React, { useEffect, useMemo, useRef } from 'react';
import { Series } from '@tiyo/common';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { activeSeriesListState } from '@/renderer/state/libraryStates';
import {
  searchCoverDensityState,
  searchResultState,
  addModalEditableState,
  addModalSeriesState,
  showingAddModalState,
  searchExtensionState,
} from '@/renderer/state/searchStates';
import { FS_METADATA } from '@/common/temp_fs_metadata';
import ExtensionImage from '../general/ExtensionImage';
import SearchGridContextMenu from './SearchGridContextMenu';
import { ContextMenu, ContextMenuTrigger } from '@houdoku/ui/components/ContextMenu';
import { Skeleton } from '@houdoku/ui/components/Skeleton';
import { Button } from '@houdoku/ui/components/Button';
import { Badge } from '@houdoku/ui/components/Badge';
import { BookOpen, Check, FolderOpen } from 'lucide-react';
import { seriesIdentity } from './searchPresentation';

const thumbnailsDir = await ipcRenderer.invoke(ipcChannels.GET_PATH.THUMBNAILS_DIR);
if (!fs.existsSync(thumbnailsDir)) fs.mkdirSync(thumbnailsDir);

type Props = {
  loading: boolean;
  error?: string;
  handleSearch: (fresh?: boolean) => void;
  onRetry: () => void;
};

const SearchGrid: React.FC<Props> = ({ loading, error, handleSearch, onRetry }) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const searchResult = useRecoilValue(searchResultState);
  const density = useRecoilValue(searchCoverDensityState);
  const cropCovers = useRecoilValue(libraryCropCoversState);
  const library = useRecoilValue(activeSeriesListState);
  const libraryIds = useMemo(() => new Set(library.map(seriesIdentity)), [library]);
  const source = useRecoilValue(searchExtensionState);
  const setSeries = useSetRecoilState(addModalSeriesState);
  const setEditable = useSetRecoilState(addModalEditableState);
  const setShowing = useSetRecoilState(showingAddModalState);
  const openDetails = (series: Series) => {
    setSeries(series);
    setEditable(source === FS_METADATA.id);
    setShowing(true);
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || loading || error || !searchResult.hasMore) return;
    const nearEnd = () => {
      if (
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <
        viewport.clientHeight * 0.3
      )
        handleSearch();
    };
    viewport.addEventListener('scroll', nearEnd);
    // Fill the initial viewport, including after density or window changes.
    const observer = new ResizeObserver(nearEnd);
    observer.observe(viewport);
    nearEnd();
    return () => {
      viewport.removeEventListener('scroll', nearEnd);
      observer.disconnect();
    };
  }, [loading, error, searchResult, density, handleSearch]);

  return (
    <div
      ref={viewportRef}
      className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 md:p-panel"
      aria-label="Series results"
      aria-busy={loading}
    >
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-panel border border-danger/40 bg-danger-subtle p-4"
        >
          <p className="text-danger">{error}</p>
          {source !== FS_METADATA.id && (
            <Button className="mt-3" variant="outline" onClick={onRetry}>
              Try again
            </Button>
          )}
        </div>
      )}
      {!loading && !error && searchResult.seriesList.length === 0 && (
        <div className="flex min-h-64 flex-col items-center justify-center text-center px-6">
          {source === FS_METADATA.id ? (
            <FolderOpen className="mb-4 size-8 text-muted-foreground" />
          ) : (
            <BookOpen className="mb-4 size-8 text-muted-foreground" />
          )}
          <h2 className="text-section-title">
            {source === FS_METADATA.id ? 'Bring your own collection' : 'No series found'}
          </h2>
          <p className="mt-2 max-w-md text-muted-foreground">
            {source === FS_METADATA.id
              ? 'Select a directory above to import your local manga. Use multi-series mode for a folder containing several series.'
              : 'Try a different search or adjust your filters.'}
          </p>
        </div>
      )}
      <div
        className="grid gap-x-4 gap-y-6"
        data-cover-density={density}
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${density === 'compact' ? 136 : 176}px), 1fr))`,
        }}
      >
        {searchResult.seriesList.map((series) => (
          <article key={seriesIdentity(series)} className="min-w-0">
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <button
                  type="button"
                  className="block w-full rounded-control text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  onClick={() => openDetails(series)}
                  aria-label={`View ${series.title}`}
                >
                  <div className="aspect-[7/10] overflow-hidden rounded-control bg-muted">
                    <ExtensionImage
                      url={series.remoteCoverUrl}
                      series={series}
                      alt=""
                      className={`h-full w-full ${cropCovers ? 'object-cover' : 'object-contain'}`}
                    />
                  </div>
                  <h2
                    className="mt-3 line-clamp-2 text-body font-medium leading-snug"
                    title={series.title}
                  >
                    {series.title}
                  </h2>
                </button>
              </ContextMenuTrigger>
              <SearchGridContextMenu series={series} viewDetails={() => openDetails(series)} />
            </ContextMenu>
            {libraryIds.has(seriesIdentity(series)) && (
              <Badge variant="success" className="mt-2 gap-1">
                <Check className="size-3" />
                In library
              </Badge>
            )}
          </article>
        ))}
        {loading &&
          searchResult.seriesList.length === 0 &&
          Array.from({ length: density === 'compact' ? 12 : 8 }, (_, index) => (
            <div key={`loading-${index}`} aria-hidden="true">
              <Skeleton className="aspect-[7/10] w-full rounded-control" />
              <Skeleton className="mt-3 h-4 w-3/4" />
            </div>
          ))}
      </div>
      {searchResult.hasMore && !error && (
        <div className="flex justify-center py-6">
          <Button variant="outline" disabled={loading} onClick={() => handleSearch()}>
            {loading ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
};
export default SearchGrid;
