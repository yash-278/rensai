import { useState } from 'react';
import { Series, SeriesStatus } from '@tiyo/common';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { LibrarySort, LibraryView, ProgressFilter } from '@/common/models/types';
import {
  categoryListState,
  filterState,
  multiSelectEnabledState,
  multiSelectSeriesListState,
} from '@/renderer/state/libraryStates';
import {
  libraryFilterStatusState,
  libraryFilterProgressState,
  libraryColumnsState,
  libraryViewState,
  librarySortState,
  libraryFilterCategoryState,
  libraryCropCoversState,
} from '@/renderer/state/settingStates';
import { Button } from '@houdoku/ui/components/Button';
import { Input } from '@houdoku/ui/components/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@houdoku/ui/components/Select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@houdoku/ui/components/DropdownMenu';
import { Search, SlidersHorizontal } from 'lucide-react';

export function LibraryChoice({
  label,
  value,
  onChange,
  options,
}: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="w-auto min-w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
const views = [
  [LibraryView.GridComfortable, 'Comfortable grid'],
  [LibraryView.GridCompact, 'Compact grid'],
  [LibraryView.GridCoversOnly, 'Covers only'],
  [LibraryView.List, 'List'],
];
export default function LibraryControlBar({
  seriesList,
  reset,
}: { seriesList: Series[]; reset: () => void }) {
  const [filters, setFilters] = useState(false);
  const [query, setQuery] = useRecoilState(filterState);
  const [status, setStatus] = useRecoilState(libraryFilterStatusState);
  const [progress, setProgress] = useRecoilState(libraryFilterProgressState);
  const [category, setCategory] = useRecoilState(libraryFilterCategoryState);
  const [columns, setColumns] = useRecoilState(libraryColumnsState);
  const [crop, setCrop] = useRecoilState(libraryCropCoversState);
  const [view, setView] = useRecoilState(libraryViewState);
  const [sort, setSort] = useRecoilState(librarySortState);
  const [selecting, setSelecting] = useRecoilState(multiSelectEnabledState);
  const setSelected = useSetRecoilState(multiSelectSeriesListState);
  const categories = useRecoilValue(categoryListState);
  return (
    <>
      <div className="library-toolbar">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search library"
            placeholder="Search your library…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" aria-expanded={filters} onClick={() => setFilters(!filters)}>
          <SlidersHorizontal />
          Filters{category || status ? ' (active)' : ''}
        </Button>
        <LibraryChoice
          label="Sort library"
          value={sort}
          onChange={(v) => setSort(v as LibrarySort)}
          options={[
            [LibrarySort.TitleAsc, 'Title A–Z'],
            [LibrarySort.TitleDesc, 'Title Z–A'],
            [LibrarySort.UnreadDesc, 'Most unread'],
            [LibrarySort.UnreadAsc, 'Fewest unread'],
          ]}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" aria-label="Library view">
              {views.find(([v]) => v === view)?.[1]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>View</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={view} onValueChange={(v) => setView(v as LibraryView)}>
              {views.map(([v, label]) => (
                <DropdownMenuRadioItem key={v} value={v}>
                  {label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Columns</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={String(columns)}
              onValueChange={(v) => setColumns(Number(v))}
            >
              {[0, 2, 4, 6, 8].map((n) => (
                <DropdownMenuRadioItem key={n} value={String(n)}>
                  {n === 0 ? 'Automatic' : `${n} columns`}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={crop} onCheckedChange={setCrop}>
              Crop covers
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant={selecting ? 'secondary' : 'outline'}
          disabled={!seriesList.length}
          onClick={() => {
            setSelecting(!selecting);
            setSelected([]);
          }}
        >
          {selecting ? 'Cancel selection' : 'Select'}
        </Button>
      </div>
      {filters && (
        <div className="library-filter-row">
          <LibraryChoice
            label="Category"
            value={category || 'all'}
            onChange={(v) => setCategory(v === 'all' ? '' : v)}
            options={[['all', 'All categories'], ...categories.map((c) => [c.id, c.label])]}
          />
          <LibraryChoice
            label="Publication status"
            value={status || 'all'}
            onChange={(v) => setStatus(v === 'all' ? null : (v as SeriesStatus))}
            options={[
              ['all', 'Any publication status'],
              ...Object.values(SeriesStatus).map((v) => [v, v]),
            ]}
          />
          <Button variant="ghost" onClick={reset}>
            Reset filters
          </Button>
          <span className="text-caption text-muted-foreground">Changes apply immediately.</span>
        </div>
      )}
      <div className="library-progress-tabs" role="group" aria-label="Reading progress">
        {[
          [ProgressFilter.All, 'All series'],
          [ProgressFilter.Unread, 'With unread'],
          [ProgressFilter.Finished, 'Caught up'],
        ].map(([v, label]) => (
          <Button
            key={v}
            size="sm"
            variant={progress === v ? 'secondary' : 'ghost'}
            aria-pressed={progress === v}
            onClick={() => setProgress(v as ProgressFilter)}
          >
            {label}
            <span className="ml-1 text-muted-foreground">
              {
                seriesList.filter(
                  (s) =>
                    v === ProgressFilter.All ||
                    (v === ProgressFilter.Unread ? s.numberUnread > 0 : s.numberUnread === 0),
                ).length
              }
            </span>
          </Button>
        ))}
      </div>
    </>
  );
}
