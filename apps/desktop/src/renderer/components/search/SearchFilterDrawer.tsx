import React, { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import {
  FilterValues,
  FilterCheckbox,
  FilterCycle,
  FilterHeader,
  FilterInput,
  FilterMultiToggle,
  FilterOption,
  FilterOptionType,
  FilterSelect,
  FilterSeparator,
  FilterSort,
  FilterSortValue,
  FilterTriStateCheckbox,
  MultiToggleValues,
  TriState,
} from '@tiyo/common';
import { showingFilterDrawerState } from '@/renderer/state/searchStates';
import { Button } from '@houdoku/ui/components/Button';
import { X } from 'lucide-react';
import { filterDefaults } from './searchPresentation';
import SearchFilterMultiToggle from './filter/SearchFilterMultiToggle';
import SearchFilterSort from './filter/SearchFilterSort';
import SearchFilterTriCheckbox from './filter/SearchFilterTriCheckbox';
import SearchFilterCycle from './filter/SearchFilterCycle';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@houdoku/ui/components/Sheet';
import { Label } from '@houdoku/ui/components/Label';
import { Input } from '@houdoku/ui/components/Input';
import { Checkbox } from '@houdoku/ui/components/Checkbox';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@houdoku/ui/components/Select';
import { Separator } from '@houdoku/ui/components/Separator';

interface Props {
  filterOptions: FilterOption[];
  values: FilterValues;
  onChange: (values: FilterValues, debounce?: boolean) => void;
}

const SearchFilterDrawer: React.FC<Props> = (props: Props) => {
  const [showingFilterDrawer, setShowingFilterDrawer] = useRecoilState(showingFilterDrawerState);
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 1200px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1200px)');
    const update = () => setWide(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const getOptionValue = (option: FilterOption): unknown =>
    props.values[option.id] ?? option.defaultValue;
  const setOptionValue = (optionId: string, value: unknown, debounce = false) =>
    props.onChange({ ...props.values, [optionId]: value }, debounce);

  const renderCheckbox = (option: FilterCheckbox) => {
    return (
      <div key={option.id} className="flex items-center space-x-2">
        <Checkbox
          id={`checkbox${option.id}`}
          checked={getOptionValue(option) as boolean}
          onCheckedChange={(checked) => setOptionValue(option.id, checked)}
          className="w-5 h-5"
        />
        <Label htmlFor={`checkbox${option.id}`}>{option.label}</Label>
      </div>
    );
  };

  const renderTriCheckbox = (option: FilterTriStateCheckbox) => {
    return (
      <SearchFilterTriCheckbox
        key={option.id}
        label={option.label}
        value={getOptionValue(option) as TriState}
        onChange={(value) => setOptionValue(option.id, value)}
      />
    );
  };

  const renderInput = (option: FilterInput) => {
    return (
      <div key={option.id}>
        <Label htmlFor={`filter-${option.id}`}>{option.label}</Label>
        <Input
          id={`filter-${option.id}`}
          value={getOptionValue(option) as string}
          placeholder={option.placeholder}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setOptionValue(option.id, e.target.value, true)
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              event.preventDefault();
              props.onChange(props.values);
            }
          }}
        />
      </div>
    );
  };

  const renderSelect = (option: FilterSelect) => {
    return (
      <Select
        key={option.id}
        value={getOptionValue(option) as string}
        defaultValue={(option.defaultValue as string) || undefined}
        onValueChange={(value) => setOptionValue(option.id, value || '')}
      >
        <SelectTrigger aria-label={option.label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {option.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  };

  const renderMultiToggle = (option: FilterMultiToggle) => {
    return (
      <SearchFilterMultiToggle
        key={option.id}
        label={option.label}
        canExclude={option.isTriState}
        fields={option.fields || []}
        values={getOptionValue(option) as MultiToggleValues}
        onChange={(values) => setOptionValue(option.id, values)}
      />
    );
  };

  const renderSort = (option: FilterSort) => {
    return (
      <SearchFilterSort
        key={option.id}
        label={option.label}
        supportsBothDirections={option.supportsBothDirections}
        fields={option.fields || []}
        value={getOptionValue(option) as FilterSortValue}
        onChange={(value) => setOptionValue(option.id, value)}
      />
    );
  };

  const renderCycle = (option: FilterCycle) => {
    return (
      <SearchFilterCycle
        key={option.id}
        label={option.label}
        value={getOptionValue(option) as string}
        options={option.options || []}
        onChange={(value) => setOptionValue(option.id, value)}
      />
    );
  };

  const renderHeader = (option: FilterHeader) => {
    return <h3 key={option.id}>{option.label}</h3>;
  };

  const renderSeparator = (option: FilterSeparator) => {
    return <Separator key={option.id} className="my-2" />;
  };

  const renderControls = () => {
    return props.filterOptions.map((option) => {
      switch (option.kind) {
        case FilterOptionType.Checkbox:
          return renderCheckbox(option as FilterCheckbox);
        case FilterOptionType.TriStateCheckbox:
          return renderTriCheckbox(option as FilterTriStateCheckbox);
        case FilterOptionType.Input:
          return renderInput(option as FilterInput);
        case FilterOptionType.Select:
          return renderSelect(option as FilterSelect);
        case FilterOptionType.MultiToggle:
          return renderMultiToggle(option as FilterMultiToggle);
        case FilterOptionType.Sort:
          return renderSort(option as FilterSort);
        case FilterOptionType.Cycle:
          return renderCycle(option as FilterCycle);
        case FilterOptionType.Header:
          return renderHeader(option as FilterHeader);
        case FilterOptionType.Separator:
          return renderSeparator(option as FilterSeparator);
        default:
          return undefined;
      }
    });
  };

  const controls = (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-1">
        <div className="flex flex-col gap-4">{renderControls()}</div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t pt-4">
        <p className="text-caption text-muted-foreground">Filters update automatically.</p>
        <Button
          variant="outline"
          onClick={() => props.onChange(filterDefaults(props.filterOptions))}
        >
          Reset
        </Button>
      </div>
    </>
  );
  if (wide)
    return showingFilterDrawer ? (
      <aside
        aria-label="Search filters"
        className="flex w-72 shrink-0 flex-col gap-5 border-l bg-card p-panel"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-section-title">Filters</h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close filters"
            onClick={() => setShowingFilterDrawer(false)}
          >
            <X />
          </Button>
        </div>
        {controls}
      </aside>
    ) : null;
  return (
    <Sheet open={showingFilterDrawer} onOpenChange={setShowingFilterDrawer}>
      <SheetContent className="flex flex-col gap-5">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        {controls}
      </SheetContent>
    </Sheet>
  );
};
export default SearchFilterDrawer;
