import React, { useEffect, useRef, useState } from 'react';
import {
  ExtensionMetadata,
  FilterOption,
  FilterValues,
  Series,
  SeriesListResponse,
} from '@tiyo/common';
const { ipcRenderer } = require('electron');
import { useRecoilState, useRecoilValue } from 'recoil';
import AddSeriesModal from './AddSeriesModal';
import { FS_METADATA } from '@/common/temp_fs_metadata';
import ipcChannels from '@/common/constants/ipcChannels.json';
import {
  addModalEditableState,
  addModalSeriesState,
  filterValuesMapState,
  nextSourcePageState,
  searchExtensionState,
  searchTextState,
  searchResultState,
  showingAddModalState,
  searchCoverDensityState,
} from '@/renderer/state/searchStates';
import SearchGrid from './SearchGrid';
import SearchControlBar from './SearchControlBar';
import SearchFilterDrawer from './SearchFilterDrawer';
import { Button } from '@houdoku/ui/components/Button';
import { LayoutGrid, Loader2, X } from 'lucide-react';
import { changedFilters, filterDefaults } from './searchPresentation';

const Search: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [extensionList, setExtensionList] = useState<ExtensionMetadata[]>([]);
  const searchText = useRecoilValue(searchTextState);
  const [filterValuesMap, setFilterValuesMap] = useRecoilState(filterValuesMapState);
  const [nextSourcePage, setNextSourcePage] = useRecoilState(nextSourcePageState);
  const [searchResult, setSearchResult] = useRecoilState(searchResultState);
  const searchExtension = useRecoilValue(searchExtensionState);
  const [addModalSeries, setAddModalSeries] = useRecoilState(addModalSeriesState);
  const [addModalEditable, setAddModalEditable] = useRecoilState(addModalEditableState);
  const [showingAddModal, setShowingAddModal] = useRecoilState(showingAddModalState);
  const [density, setDensity] = useRecoilState(searchCoverDensityState);
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);
  const requestVersion = useRef(0);
  const busy = useRef(false);
  const submittedText = useRef('');
  const filterTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastRequest = useRef({ fresh: true, filters: {} as FilterValues, text: '' });
  const values = filterValuesMap[searchExtension] || {};
  const selectedFilters = changedFilters(filterOptions, values);

  const handleSearch = async (
    fresh = false,
    filters = values,
    text = fresh ? searchText.trim() : submittedText.current,
  ) => {
    if (searchExtension === FS_METADATA.id || (!fresh && busy.current)) return;
    clearTimeout(filterTimer.current);
    const version = ++requestVersion.current;
    busy.current = true;
    setLoading(true);
    setError(undefined);
    const page = fresh ? 1 : nextSourcePage;
    if (fresh) submittedText.current = text;
    lastRequest.current = { fresh, filters, text };
    try {
      const response: SeriesListResponse = await (submittedText.current.length === 0
        ? ipcRenderer.invoke(ipcChannels.EXTENSION.DIRECTORY, searchExtension, page, filters)
        : ipcRenderer.invoke(
            ipcChannels.EXTENSION.SEARCH,
            searchExtension,
            submittedText.current,
            page,
            filters,
          ));
      if (version !== requestVersion.current) return;
      setSearchResult((previous) => ({
        seriesList: fresh ? response.seriesList : previous.seriesList.concat(response.seriesList),
        hasMore: response.hasMore,
      }));
      setNextSourcePage(page + 1);
    } catch {
      if (version === requestVersion.current)
        setError('Could not load results. Check the source settings or try again.');
    } finally {
      if (version === requestVersion.current) {
        busy.current = false;
        setLoading(false);
      }
    }
  };

  const handleSearchFilesystem = async (searchPaths: string[]) => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(undefined);
    try {
      const seriesList: Series[] = [];
      for (const searchPath of searchPaths) {
        const series = await ipcRenderer.invoke(
          ipcChannels.EXTENSION.GET_SERIES,
          FS_METADATA.id,
          searchPath,
        );
        if (version !== requestVersion.current) return;
        if (series) seriesList.push(series);
      }
      if (!seriesList.length) {
        setError('No readable series were found in the selected directory.');
        return;
      }
      setSearchResult({ seriesList, hasMore: false });
      if (seriesList.length === 1) {
        setAddModalSeries(seriesList[0]);
        setAddModalEditable(true);
        setShowingAddModal(true);
      }
    } catch {
      if (version === requestVersion.current)
        setError('Could not open this directory. Check its contents and permissions.');
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  };

  useEffect(() => {
    let current = true;
    ipcRenderer
      .invoke(ipcChannels.EXTENSION_MANAGER.GET_ALL)
      .then((list: ExtensionMetadata[]) => {
        if (current) setExtensionList(list);
      })
      .catch(() => {
        if (current) setError('Could not load sources. Reload Sources from the Plugins page.');
      });
    return () => {
      current = false;
    };
  }, []);

  useEffect(() => {
    let current = true;
    ++requestVersion.current;
    busy.current = false;
    setError(undefined);
    setLoading(false);
    setFilterOptions([]);
    setSearchResult({ seriesList: [], hasMore: false });
    setNextSourcePage(1);
    if (searchExtension !== FS_METADATA.id) {
      setLoading(true);
      ipcRenderer
        .invoke(ipcChannels.EXTENSION.GET_FILTER_OPTIONS, searchExtension)
        .then((options: FilterOption[]) => {
          if (!current) return;
          const merged = { ...filterDefaults(options), ...filterValuesMap[searchExtension] };
          setFilterOptions(options);
          setFilterValuesMap((previous) => ({ ...previous, [searchExtension]: merged }));
          handleSearch(true, merged);
        })
        .catch(() => {
          if (current) {
            setLoading(false);
            setError('Could not load this source. Reload Sources from the Plugins page.');
          }
        });
    }
    return () => {
      current = false;
      ++requestVersion.current;
      clearTimeout(filterTimer.current);
    };
  }, [searchExtension]);

  const applyFilters = (next: FilterValues, debounce = false) => {
    setFilterValuesMap((previous) => ({ ...previous, [searchExtension]: next }));
    clearTimeout(filterTimer.current);
    // A new selection supersedes in-flight results even while text is still debouncing.
    ++requestVersion.current;
    busy.current = true;
    setLoading(true);
    setError(undefined);
    if (debounce) {
      filterTimer.current = setTimeout(() => handleSearch(true, next, submittedText.current), 400);
    } else {
      handleSearch(true, next, submittedText.current);
    }
  };
  return (
    <section className="flex h-[calc(100dvh-24px)] min-h-0 flex-col py-4 md:p-4">
      <AddSeriesModal
        showing={showingAddModal}
        setShowing={(showing) => {
          setShowingAddModal(showing);
          setAddModalEditable(false);
        }}
        series={addModalSeries}
        editable={addModalEditable}
      />
      <header className="shrink-0 pb-5">
        <h1 className="text-page-title">Add series</h1>
        <p className="mt-1 mb-5 text-muted-foreground">
          Browse a source or import manga from your device.
        </p>
        <SearchControlBar
          extensionList={extensionList}
          hasFilterOptions={filterOptions.length > 0}
          loading={loading}
          filterCount={selectedFilters.length}
          handleSearch={handleSearch}
          handleSearchFilesystem={handleSearchFilesystem}
        />
      </header>
      <div className="min-h-0 flex flex-1 overflow-hidden rounded-panel border bg-card">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3 md:px-panel">
            <p role="status" className="flex items-center gap-2 text-caption text-muted-foreground">
              {loading && (
                <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />
              )}
              {loading
                ? searchResult.seriesList.length > 0
                  ? 'Updating results…'
                  : 'Loading series…'
                : `${searchResult.seriesList.length} series loaded`}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDensity(density === 'comfortable' ? 'compact' : 'comfortable')}
              aria-label="Change cover density"
            >
              <LayoutGrid />
              {density === 'comfortable' ? 'Comfortable covers' : 'Compact covers'}
            </Button>
            {selectedFilters.length > 0 && (
              <div className="flex w-full flex-wrap gap-2" aria-label="Applied filters">
                {selectedFilters.map((option) => (
                  <Button
                    key={option.id}
                    variant="secondary"
                    size="sm"
                    aria-label={`Reset ${option.label}`}
                    onClick={() => applyFilters({ ...values, [option.id]: option.defaultValue })}
                  >
                    {option.label}
                    <X className="size-3" />
                  </Button>
                ))}
              </div>
            )}
          </div>
          <SearchGrid
            loading={loading}
            error={error}
            handleSearch={handleSearch}
            onRetry={() => {
              const request = lastRequest.current;
              handleSearch(request.fresh, request.filters, request.text);
            }}
          />
        </div>
        {filterOptions.length > 0 && (
          <SearchFilterDrawer
            filterOptions={filterOptions}
            values={values}
            onChange={applyFilters}
          />
        )}
      </div>
    </section>
  );
};
export default Search;
