import { Series } from '@tiyo/common';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useNavigate } from 'react-router-dom';
import {
  multiSelectEnabledState,
  multiSelectSeriesListState,
  categoryListState,
} from '@/renderer/state/libraryStates';
import {
  libraryColumnsState,
  libraryCropCoversState,
  libraryViewState,
} from '@/renderer/state/settingStates';
import { goToSeries } from '@/renderer/features/library/utils';
import { ReadingProgress } from '@/renderer/features/library/readingProgress';
import { LibraryView } from '@/common/models/types';
import LibraryGridContextMenu from './LibraryGridContextMenu';
import LibraryCover from './LibraryCover';
import { ContextMenu, ContextMenuTrigger } from '@houdoku/ui/components/ContextMenu';
import { DropdownMenu, DropdownMenuTrigger } from '@houdoku/ui/components/DropdownMenu';
import { Button } from '@houdoku/ui/components/Button';
import { Checkbox } from '@houdoku/ui/components/Checkbox';
import { Badge } from '@houdoku/ui/components/Badge';
import { MoreHorizontal } from 'lucide-react';

export default function LibraryGrid({
  seriesList,
  progress,
  showRemoveModal,
  continueReading,
}: {
  seriesList: Series[];
  progress: Map<string, ReadingProgress>;
  showRemoveModal: (series: Series) => void;
  continueReading: (series: Series) => void;
}) {
  const navigate = useNavigate();
  const view = useRecoilValue(libraryViewState);
  const columns = useRecoilValue(libraryColumnsState);
  const crop = useRecoilValue(libraryCropCoversState);
  const selecting = useRecoilValue(multiSelectEnabledState);
  const [selected, setSelected] = useRecoilState(multiSelectSeriesListState);
  const categories = useRecoilValue(categoryListState);
  const list = view === LibraryView.List;
  const covers = view === LibraryView.GridCoversOnly;
  const toggle = (series: Series) =>
    setSelected((prev) =>
      prev.some((s) => s.id === series.id)
        ? prev.filter((s) => s.id !== series.id)
        : [...prev, series],
    );
  const menu = (series: Series) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${series.title}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <LibraryGridContextMenu dropdown series={series} showRemoveModal={showRemoveModal} />
    </DropdownMenu>
  );
  const minWidth = view === LibraryView.GridCompact ? 136 : 176;
  return (
    <div
      className={list ? 'library-list' : 'library-book-grid'}
      data-view={view}
      style={
        list
          ? undefined
          : {
              gridTemplateColumns:
                columns === 0
                  ? `repeat(auto-fill,minmax(min(100%,${minWidth}px),1fr))`
                  : `repeat(${columns},minmax(0,1fr))`,
            }
      }
    >
      {seriesList.map((series) => {
        const summary = progress.get(series.id!)!;
        const isSelected = selecting && selected.some((s) => s.id === series.id);
        const open = () => (selecting ? toggle(series) : goToSeries(series, navigate));
        return (
          <ContextMenu key={series.id}>
            <ContextMenuTrigger asChild>
              <article className={`library-book ${isSelected ? 'is-selected' : ''}`}>
                <div className="library-artwork">
                  <button
                    className="block w-full rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`${selecting ? 'Select' : 'View'} ${series.title}`}
                    onClick={open}
                  >
                    <LibraryCover series={series} crop={crop || list} />
                  </button>
                  {selecting && (
                    <div className="library-selection-check">
                      <Checkbox
                        aria-label={`Select ${series.title}`}
                        checked={isSelected}
                        onCheckedChange={() => toggle(series)}
                      />
                    </div>
                  )}
                  {covers && !selecting && (
                    <div className="library-covers-menu">{menu(series)}</div>
                  )}
                </div>
                {!covers && (
                  <div className="library-book-info">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        className="min-w-0 py-1 text-left font-medium line-clamp-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={open}
                      >
                        {series.title}
                      </button>
                      {!selecting && menu(series)}
                    </div>
                    {list && (
                      <p className="mb-2 text-caption text-muted-foreground">
                        {Array.from(new Set([...series.authors, ...series.artists])).join('; ') ||
                          'Unknown creator'}{' '}
                        · {series.status}
                      </p>
                    )}
                    <div className="mb-2 mt-1 flex flex-wrap items-center justify-between gap-2 text-caption text-muted-foreground">
                      <span>
                        {summary.total === 0
                          ? 'No chapters'
                          : summary.read === 0
                            ? 'Not started'
                            : summary.unread === 0
                              ? 'Caught up'
                              : `${summary.read} / ${summary.total} read`}
                      </span>
                      {summary.unread > 0 && <span>{summary.unread} unread</span>}
                    </div>
                    {summary.total > 0 && (
                      <div
                        role="progressbar"
                        aria-label={`${series.title} reading progress`}
                        aria-valuenow={summary.read}
                        aria-valuemin={0}
                        aria-valuemax={summary.total}
                        className="h-1 overflow-hidden rounded-full bg-muted"
                      >
                        <div
                          className={`h-full ${summary.unread === 0 ? 'bg-success' : 'bg-primary'}`}
                          style={{ width: `${(summary.read / summary.total) * 100}%` }}
                        />
                      </div>
                    )}
                    {list && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {categories
                          .filter((c) => series.categories?.includes(c.id))
                          .map((c) => (
                            <Badge key={c.id} variant="outline">
                              {c.label}
                            </Badge>
                          ))}
                      </div>
                    )}
                  </div>
                )}
                {list && !selecting && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      summary.next ? continueReading(series) : goToSeries(series, navigate)
                    }
                  >
                    {!summary.next ? 'View series' : summary.read ? 'Continue' : 'Start reading'}
                  </Button>
                )}
              </article>
            </ContextMenuTrigger>
            <LibraryGridContextMenu series={series} showRemoveModal={showRemoveModal} />
          </ContextMenu>
        );
      })}
    </div>
  );
}
