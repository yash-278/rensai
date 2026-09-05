import { Series } from '@tiyo/common';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { markChapters } from '@/renderer/features/library/utils';
import {
  activeSeriesListState,
  categoryListState,
  chapterListState,
  multiSelectEnabledState,
  multiSelectSeriesListState,
  reloadingSeriesListState,
  seriesListState,
  seriesState,
} from '@/renderer/state/libraryStates';
import { chapterLanguagesState } from '@/renderer/state/settingStates';
import library from '@/renderer/services/library';
import { Button } from '@houdoku/ui/components/Button';
import { Checkbox } from '@houdoku/ui/components/Checkbox';
import { CheckCheck, RefreshCw, Tags } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@houdoku/ui/components/DropdownMenu';
import { Category } from '@/common/models/types';

export default function LibraryControlBarMultiSelect({
  shown,
  refresh,
}: { shown: Series[]; refresh: (series: Series[]) => Promise<void> }) {
  const setSeries = useSetRecoilState(seriesState);
  const setSeriesList = useSetRecoilState(seriesListState);
  const setChapterList = useSetRecoilState(chapterListState);
  const refreshing = useRecoilValue(reloadingSeriesListState);
  const languages = useRecoilValue(chapterLanguagesState);
  const setSelecting = useSetRecoilState(multiSelectEnabledState);
  const [selection, setSelection] = useRecoilState(multiSelectSeriesListState);
  const active = useRecoilValue(activeSeriesListState);
  const selected = active.filter((s) => selection.some((item) => item.id === s.id));
  const categories = useRecoilValue(categoryListState);
  const done = () => {
    setSelecting(false);
    setSelection([]);
  };
  const markRead = () => {
    selected.forEach((series) => {
      if (series.id)
        markChapters(
          library.fetchChapters(series.id),
          series,
          true,
          setChapterList,
          setSeries,
          languages,
        );
    });
    setSeriesList(library.fetchSeriesList());
    done();
  };
  const assign = (category: Category) => {
    selected.forEach((series) =>
      library.upsertSeries({
        ...series,
        categories: Array.from(new Set([...(series.categories || []), category.id])),
      }),
    );
    setSeriesList(library.fetchSeriesList());
    done();
  };
  const all = shown.length > 0 && shown.every((s) => selected.some((item) => item.id === s.id));
  const some = shown.some((s) => selected.some((item) => item.id === s.id));
  return (
    <footer className="library-bulk-actions" aria-label="Selected series actions">
      <div className="flex items-center gap-3">
        <Checkbox
          aria-label="Select all shown series"
          checked={all ? true : some ? 'indeterminate' : false}
          onCheckedChange={(checked) =>
            setSelection(
              checked === true
                ? [...selected.filter((s) => !shown.some((item) => item.id === s.id)), ...shown]
                : selected.filter((s) => !shown.some((item) => item.id === s.id)),
            )
          }
        />
        <span>{selected.length} selected</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={!selected.length || refreshing}
          onClick={() => refresh(selected)}
        >
          <RefreshCw />
          Refresh selected
        </Button>
        <Button variant="outline" disabled={!selected.length || refreshing} onClick={markRead}>
          <CheckCheck />
          Mark read
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              disabled={!selected.length || refreshing || !categories.length}
            >
              <Tags />
              Assign category
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {categories.map((c) => (
              <DropdownMenuItem key={c.id} onSelect={() => assign(c)}>
                {c.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={done}>Done</Button>
      </div>
    </footer>
  );
}
