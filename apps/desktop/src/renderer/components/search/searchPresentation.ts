import { FilterOption, FilterOptionType, FilterValues, Series } from '@tiyo/common';

export type CoverDensity = 'comfortable' | 'compact';

export const filterDefaults = (options: FilterOption[]): FilterValues =>
  Object.fromEntries(options.map((option) => [option.id, option.defaultValue]));

export const changedFilters = (options: FilterOption[], values: FilterValues): FilterOption[] =>
  options.filter(
    (option) =>
      option.kind !== FilterOptionType.Header &&
      option.kind !== FilterOptionType.Separator &&
      JSON.stringify(values[option.id] ?? option.defaultValue) !==
        JSON.stringify(option.defaultValue),
  );

export const seriesIdentity = (series: Pick<Series, 'extensionId' | 'sourceId'>): string =>
  JSON.stringify([series.extensionId, series.sourceId]);
