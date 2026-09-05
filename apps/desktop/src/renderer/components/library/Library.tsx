import { useEffect, useMemo, useState } from 'react';
import { Series } from '@tiyo/common';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { Link, useNavigate } from 'react-router-dom';
import { LibrarySort, ProgressFilter } from '@/common/models/types';
import routes from '@/common/constants/routes.json';
import {
  activeSeriesListState,
  categoryListState,
  chapterFilterGroupNamesState,
  chapterListState,
  filterState,
  multiSelectEnabledState,
  multiSelectSeriesListState,
  reloadingSeriesListState,
  seriesListState,
  seriesState,
} from '@/renderer/state/libraryStates';
import {
  chapterLanguagesState,
  libraryFilterStatusState,
  libraryFilterProgressState,
  librarySortState,
  libraryFilterCategoryState,
} from '@/renderer/state/settingStates';
import { eligibleChapters, readingProgress } from '@/renderer/features/library/readingProgress';
import { reloadSeriesList } from '@/renderer/features/library/utils';
import library from '@/renderer/services/library';
import LibraryControlBar from './LibraryControlBar';
import LibraryGrid from './LibraryGrid';
import LibraryCover from './LibraryCover';
import LibraryControlBarMultiSelect from './LibraryControlBarMultiSelect';
import { RemoveSeriesDialog } from './RemoveSeriesDialog';
import { Button } from '@houdoku/ui/components/Button';
import { BookOpen, ChevronRight, Play, Plus, RefreshCw, Search } from 'lucide-react';
import './library.css';

export default function Library() {
  const navigate = useNavigate();
  const [remove, setRemove] = useState<Series | null>(null);
  const [removeShowing, setRemoveShowing] = useState(false);
  const [failed, setFailed] = useState<Series[]>([]);
  const [refreshError, setRefreshError] = useState(false);
  const activeSeries = useRecoilValue(activeSeriesListState);
  const [selecting, setSelecting] = useRecoilState(multiSelectEnabledState);
  const setSelected = useSetRecoilState(multiSelectSeriesListState);
  const [query, setQuery] = useRecoilState(filterState);
  const [category, setCategory] = useRecoilState(libraryFilterCategoryState);
  const [status, setStatus] = useRecoilState(libraryFilterStatusState);
  const [progressFilter, setProgressFilter] = useRecoilState(libraryFilterProgressState);
  const sort = useRecoilValue(librarySortState);
  const categories = useRecoilValue(categoryListState);
  const languages = useRecoilValue(chapterLanguagesState);
  const groups = useRecoilValue(chapterFilterGroupNamesState);
  const setSeries = useSetRecoilState(seriesState);
  const setChapterList = useSetRecoilState(chapterListState);
  const setSeriesList = useSetRecoilState(seriesListState);
  const [refreshing, setRefreshing] = useRecoilState(reloadingSeriesListState);
  useEffect(() => {
    setSeries(undefined);
    setChapterList([]);
    setSelecting(false);
    setSelected([]);
    setSeriesList(library.fetchSeriesList());
  }, []);
  const summaries = useMemo(
    () =>
      new Map(
        activeSeries.map((series) => [
          series.id!,
          readingProgress(eligibleChapters(library.fetchChapters(series.id!), languages, groups)),
        ]),
      ),
    [activeSeries, languages, groups],
  );
  const seriesList = activeSeries;
  const unread = (series: Series) => summaries.get(series.id!)!.unread;
  const shown = useMemo(
    () =>
      seriesList
        .filter(
          (series) =>
            series.title.toLowerCase().includes(query.toLowerCase()) &&
            (!status || series.status === status) &&
            (!category || series.categories?.includes(category)) &&
            (progressFilter === ProgressFilter.All ||
              (progressFilter === ProgressFilter.Unread
                ? unread(series) > 0
                : unread(series) === 0)),
        )
        .sort((a, b) =>
          sort === LibrarySort.UnreadAsc
            ? unread(a) - unread(b)
            : sort === LibrarySort.UnreadDesc
              ? unread(b) - unread(a)
              : sort === LibrarySort.TitleDesc
                ? b.title.localeCompare(a.title)
                : a.title.localeCompare(b.title),
        ),
    [seriesList, summaries, query, status, category, progressFilter, sort],
  );
  const continuing = seriesList
    .filter((series) => {
      const p = summaries.get(series.id!)!;
      return p.read > 0 && p.next?.id;
    })
    .slice(0, 3);
  const reset = () => {
    setQuery('');
    setCategory('');
    setStatus(null);
    setProgressFilter(ProgressFilter.All);
  };
  const refresh = async (targets: Series[]) => {
    if (refreshing || !targets.length) return;
    setRefreshError(false);
    setFailed([]);
    try {
      const failures = await reloadSeriesList(targets, setSeriesList, setRefreshing, languages);
      setFailed(failures);
      setRefreshError(failures.length > 0);
    } catch {
      setFailed(targets);
      setRefreshError(true);
    } finally {
      setRefreshing(false);
    }
  };
  const continueReading = (series: Series) => {
    const next = summaries.get(series.id!)?.next;
    if (next?.id) navigate(`${routes.READER}/${series.id}/${next.id}`);
  };
  return (
    <section className="library-page" aria-label="Library">
      <header className="library-page-header">
        <div>
          <h1 className="text-page-title">Library</h1>
          <p className="mt-1 text-muted-foreground">
            {seriesList.length} series in your collection
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={refreshing || !shown.length}
            onClick={() => refresh(shown)}
          >
            <RefreshCw className={refreshing ? 'motion-safe:animate-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
          <Button asChild>
            <Link to={routes.SEARCH}>
              <Plus />
              Add series
            </Link>
          </Button>
        </div>
      </header>
      <LibraryControlBar
        seriesList={seriesList.map((series) => ({ ...series, numberUnread: unread(series) }))}
        reset={reset}
      />
      <div
        className="library-collection-scroll"
        aria-label="Library collection"
        tabIndex={0}
        aria-busy={refreshing}
      >
        {refreshError && (
          <div
            role="alert"
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-panel border border-danger/40 bg-danger-subtle p-4"
          >
            <p className="text-danger">
              Could not refresh {failed.length} series. Your saved series are still available.
            </p>
            <Button
              variant="outline"
              disabled={refreshing}
              onClick={() => refresh(failed.filter((s) => activeSeries.some((a) => a.id === s.id)))}
            >
              Try again
            </Button>
          </div>
        )}
        {!seriesList.length ? (
          <div className="library-empty">
            <BookOpen className="size-8 text-muted-foreground" />
            <h2 className="text-section-title">Your next read starts here</h2>
            <p className="max-w-sm text-muted-foreground">
              Add a series from a source or import a folder from your device.
            </p>
            <Button asChild>
              <Link to={routes.SEARCH}>
                <Plus />
                Add your first series
              </Link>
            </Button>
          </div>
        ) : !shown.length ? (
          <div className="library-empty">
            <Search className="size-8 text-muted-foreground" />
            <h2 className="text-section-title">No matching series</h2>
            <p className="text-muted-foreground">Try another title or clear your filters.</p>
            <Button variant="outline" onClick={reset}>
              Clear search and filters
            </Button>
          </div>
        ) : (
          <>
            {!selecting &&
              !query &&
              !category &&
              !status &&
              progressFilter === ProgressFilter.All &&
              continuing.length > 0 && (
                <section className="mb-8" aria-label="Continue reading">
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    <h2 className="text-section-title">Continue reading</h2>
                    <span className="text-caption text-muted-foreground">
                      Series you have started
                    </span>
                  </div>
                  <div className="library-continue-grid">
                    {continuing.map((series) => {
                      const p = summaries.get(series.id!)!;
                      return (
                        <article key={series.id} className="library-continue-item">
                          <div className="w-16 shrink-0">
                            <LibraryCover series={series} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-medium">{series.title}</h3>
                            <p className="mt-1 text-caption text-muted-foreground">
                              {p.read} of {p.total} chapters read
                            </p>
                            <Button
                              className="mt-3"
                              size="sm"
                              variant="secondary"
                              onClick={() => continueReading(series)}
                            >
                              <Play className="size-3" />
                              Continue
                              <ChevronRight className="size-3" />
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-section-title">
                {categories.find((c) => c.id === category)?.label || 'Your collection'}
              </h2>
              <span className="text-caption text-muted-foreground">{shown.length} series</span>
            </div>
            <LibraryGrid
              seriesList={shown}
              progress={summaries}
              continueReading={continueReading}
              showRemoveModal={(s) => {
                setRemove(s);
                setRemoveShowing(true);
              }}
            />
          </>
        )}
      </div>
      {selecting && <LibraryControlBarMultiSelect shown={shown} refresh={refresh} />}
      <RemoveSeriesDialog series={remove} showing={removeShowing} setShowing={setRemoveShowing} />
    </section>
  );
}
