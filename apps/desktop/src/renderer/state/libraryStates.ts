import { eligibleChapters } from '@/renderer/features/library/readingProgress';
import { Chapter, ExtensionMetadata, Series } from '@tiyo/common';
import { atom, selector } from 'recoil';
import { Category, ImportTask, TableColumnSortOrder } from '@/common/models/types';
import {
  chapterLanguagesState,
  chapterListChOrderState,
  chapterListVolOrderState,
} from './settingStates';

export const titlebarTextState = atom<string | undefined>({
  key: 'titlebarTextState',
  default: undefined,
});

export const seriesListState = atom<Series[]>({
  key: 'librarySeriesList',
  default: [] as Series[],
});

export const seriesState = atom({
  key: 'seriesState',
  default: undefined as Series | undefined,
});

export const chapterListState = atom({
  key: 'chapterListState',
  default: [] as Chapter[],
});

export const currentExtensionMetadataState = atom<ExtensionMetadata | undefined>({
  key: `currentExtensionMetadataState`,
  default: undefined,
});

export const reloadingSeriesListState = atom({
  key: 'reloadingSeriesListState',
  default: false,
});

export const importingState = atom({
  key: 'libraryImportingState',
  default: false,
});

export const importQueueState = atom<ImportTask[]>({
  key: 'libraryImportQueue',
  default: [],
});

export const filterState = atom({
  key: 'filterState',
  default: '',
});

export const multiSelectEnabledState = atom<boolean>({
  key: 'multiSelectEnabledState',
  default: false,
});

export const multiSelectSeriesListState = atom<Series[]>({
  key: 'multiSelectSeriesListState',
  default: [],
});

export const completedStartReloadState = atom({
  key: 'completedStartReloadState',
  default: false,
});

export const chapterFilterGroupNamesState = atom({
  key: 'chapterFilterGroupNamesState',
  default: [] as string[],
});

export const categoryListState = atom<Category[]>({
  key: 'libraryCategoryListState',
  default: [],
});

export const activeSeriesListState = selector({
  key: 'activeLibrarySeriesList',
  get: ({ get }) => {
    const seriesList = get(seriesListState);
    return seriesList.filter((series) => !series.preview);
  },
});

export const sortedFilteredChapterListState = selector<Chapter[]>({
  key: 'sortedFilteredChapterListState',
  get: ({ get }) => {
    const chapterList = get(chapterListState);
    const chapterLanguages = get(chapterLanguagesState);
    const chapterFilterGroupNames = get(chapterFilterGroupNamesState);
    const chapterListVolOrder = get(chapterListVolOrderState);
    const chapterListChOrder = get(chapterListChOrderState);

    return eligibleChapters(chapterList, chapterLanguages, chapterFilterGroupNames).sort((a, b) => {
      const volumeComp = {
        [TableColumnSortOrder.Ascending]: parseFloat(a.volumeNumber) - parseFloat(b.volumeNumber),
        [TableColumnSortOrder.Descending]: parseFloat(b.volumeNumber) - parseFloat(a.volumeNumber),
        [TableColumnSortOrder.None]: 0,
      }[chapterListVolOrder];
      const chapterComp = {
        [TableColumnSortOrder.Ascending]: parseFloat(a.chapterNumber) - parseFloat(b.chapterNumber),
        [TableColumnSortOrder.Descending]:
          parseFloat(b.chapterNumber) - parseFloat(a.chapterNumber),
        [TableColumnSortOrder.None]: 0,
      }[chapterListChOrder];

      return volumeComp || chapterComp;
    });
  },
});
