// Render the production page with synthetic data and explicit offline IPC boundaries.
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { RecoilRoot, useRecoilValue, useSetRecoilState } from 'recoil';
import {
  FilterCheckbox,
  FilterTriStateCheckbox,
  FilterInput,
  FilterSelect,
  FilterMultiToggle,
  FilterSort,
  FilterCycle,
  FilterHeader,
  FilterSeparator,
  Series,
  LanguageKey,
  SeriesStatus,
  SortDirection,
  TriState,
} from '@tiyo/common';
import ipc from '../src/common/constants/ipcChannels.json';
import { FS_METADATA } from '../src/common/temp_fs_metadata';
import {
  searchExtensionState,
  searchTextState,
  searchResultState,
} from '../src/renderer/state/searchStates';
import { seriesListState, importQueueState } from '../src/renderer/state/libraryStates';
import { libraryColumnsState } from '../src/renderer/state/settingStates';
import './style.css';

const names = [
  'The Last Train',
  'Paper Moon',
  'A Quiet Orbit',
  'Summer Postcards',
  'The Bookshop at Dawn',
  'After the Rain',
  'A Map of Small Places',
  'Letters from Home',
  'The Long Way Back',
  'Blue Hour',
  'The Observatory',
  'Days by the Sea',
];
const colors = ['#294754', '#70543d', '#344963', '#486052', '#65515b', '#52656a'];
const makeSeries = (index: number, extensionId = 'sample') =>
  ({
    id: `sample-${extensionId}-${index}`,
    sourceId: String(index),
    extensionId,
    title: names[index % names.length],
    altTitles: [],
    numberUnread: 0,
    description: 'A fictional series for reviewing the Add series page.',
    authors: ['Sample author'],
    artists: ['Sample artist'],
    tags: ['Slice of life'],
    originalLanguageKey: LanguageKey.ENGLISH,
    status: SeriesStatus.ONGOING,
    remoteCoverUrl: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 400"><rect width="280" height="400" fill="${colors[index % colors.length]}"/><circle cx="210" cy="350" r="160" fill="none" stroke="white" opacity=".22"/><path d="M20 0V400" stroke="white" opacity=".2"/><text x="40" y="65" font-family="sans-serif" font-size="12" fill="white" opacity=".8">OFFLINE EDITION ${index + 1}</text><text x="40" y="180" font-family="serif" font-size="35" fill="white">${names[index % names.length].split(' ').slice(0, 2).join(' ')}</text><text x="40" y="225" font-family="serif" font-size="35" fill="white">${names[index % names.length].split(' ').slice(2).join(' ')}</text></svg>`)}`,
  }) as Series;
const filters = [
  new FilterHeader('heading', 'Refine results', undefined),
  new FilterCheckbox('chapters', 'Has available chapters', false),
  new FilterSort('sort', 'Sort', { key: 'relevance', direction: SortDirection.DESCENDING })
    .withFields([
      { key: 'relevance', label: 'Relevance' },
      { key: 'title', label: 'Title' },
    ])
    .withSupportsBothDirections(true),
  new FilterInput('author', 'Author', '').withPlaceholder('Author name'),
  new FilterSelect('language', 'Language', 'all').withOptions([
    { value: 'all', label: 'All languages' },
    { value: 'en', label: 'English' },
  ]),
  new FilterMultiToggle('genre', 'Genre', {})
    .withFields([
      { key: 'adventure', label: 'Adventure' },
      { key: 'mystery', label: 'Mystery' },
    ])
    .withIsTriState(true),
  new FilterTriStateCheckbox('completed', 'Completed', TriState.IGNORE),
  new FilterSeparator('separator', '', undefined),
  new FilterCycle('match', 'Match tags', 'and').withOptions([
    { value: 'and', label: 'All' },
    { value: 'or', label: 'Any' },
  ]),
];
const review = {
  calls: [] as { channel: string; args: unknown[] }[],
  failNext: false,
  failDetails: false,
  longDetails: false,
  holdDetails: false,
  holdSearch: false,
  release: () => {},
  releaseDetails: () => {},
  setSource: (_source: string) => {},
  setText: (_text: string) => {},
  queue: [] as unknown[],
  libraryColumns: 0,
  result: [] as Series[],
};
Object.assign(window, {
  review,
  require: (name: string) => {
    if (name === 'fs')
      return {
        existsSync: () => true,
        mkdirSync: () => {
          throw Error('Offline review must not write files');
        },
      };
    if (name !== 'electron') throw Error(`Unmocked module ${name}`);
    return {
      ipcRenderer: {
        invoke: async (channel: string, ...args: unknown[]) => {
          review.calls.push({ channel, args });
          switch (channel) {
            case ipc.GET_PATH.THUMBNAILS_DIR:
              return '/offline-review';
            case ipc.EXTENSION_MANAGER.GET_ALL:
              return [
                { id: 'sample', name: 'Sample catalog', url: '' },
                { id: 'second', name: 'Second catalog', url: '' },
                { ...FS_METADATA, name: 'Local files' },
              ];
            case ipc.EXTENSION.GET_FILTER_OPTIONS:
              return filters;
            case ipc.EXTENSION.SEARCH:
            case ipc.EXTENSION.DIRECTORY: {
              if (review.failNext) {
                review.failNext = false;
                throw Error('Synthetic source unavailable');
              }
              if (review.holdSearch) {
                review.holdSearch = false;
                await new Promise<void>((resolve) => {
                  review.release = resolve;
                });
              }
              const page = Number(args[channel === ipc.EXTENSION.SEARCH ? 2 : 1]);
              const query = channel === ipc.EXTENSION.SEARCH ? args[1] : '';
              const selectedFilters = args[channel === ipc.EXTENSION.SEARCH ? 3 : 2] as Record<
                string,
                unknown
              >;
              const empty = query === 'empty' || selectedFilters.author === 'empty-filter';
              return {
                seriesList: empty
                  ? []
                  : Array.from({ length: 12 }, (_, index) =>
                      makeSeries((page - 1) * 12 + index, String(args[0])),
                    ),
                hasMore: !empty && page === 1,
              };
            }
            case ipc.EXTENSION.GET_SERIES:
              if (review.holdDetails) {
                review.holdDetails = false;
                await new Promise<void>((resolve) => {
                  review.releaseDetails = resolve;
                });
              }
              if (review.failDetails) {
                review.failDetails = false;
                return undefined;
              }
              return args[0] === FS_METADATA.id
                ? {
                    ...makeSeries(0, FS_METADATA.id),
                    sourceId: String(args[1]),
                    remoteCoverUrl: undefined,
                  }
                : {
                    ...makeSeries(Number(args[1]), String(args[0])),
                    ...(review.longDetails
                      ? {
                          title: 'A long series title that should remain inside the dialog '.repeat(
                            8,
                          ),
                          description:
                            'A long description with enough detail to need its own scroll area. '.repeat(
                              100,
                            ),
                          authors: Array.from({ length: 20 }, (_, index) => `Author ${index + 1}`),
                          tags: [
                            'UnbrokenTag'.repeat(30),
                            ...Array.from({ length: 80 }, (_, index) => `Sample tag ${index + 1}`),
                          ],
                        }
                      : {}),
                  };
            case ipc.APP.SHOW_OPEN_DIALOG:
              return ['/offline-review/local-series'];
            case ipc.FILESYSTEM.LIST_DIRECTORY:
              return ['/offline-review/first', '/offline-review/second'];
            default:
              throw Error(`Unmocked IPC ${channel}`);
          }
        },
      },
    };
  },
});
const Observe = () => {
  const setSource = useSetRecoilState(searchExtensionState);
  const setText = useSetRecoilState(searchTextState);
  const queue = useRecoilValue(importQueueState);
  const columns = useRecoilValue(libraryColumnsState);
  const result = useRecoilValue(searchResultState);
  useEffect(() => {
    Object.assign(review, {
      setSource,
      setText,
      queue,
      libraryColumns: columns,
      result: result.seriesList,
    });
  }, [setSource, setText, queue, columns, result]);
  return null;
};
import('../src/renderer/components/search/Search')
  .then(({ default: Search }) =>
    createRoot(document.getElementById('root')!).render(
      <RecoilRoot
        initializeState={({ set }) => {
          set(searchExtensionState, 'sample');
          set(seriesListState, [makeSeries(0)]);
        }}
      >
        <MemoryRouter>
          <Observe />
          <div className="flex h-screen">
            <aside className="hidden w-52 shrink-0 border-r bg-card p-5 md:block">
              <p className="text-section-title">Rensai</p>
              <p className="mt-1 text-caption text-muted-foreground">Offline page review</p>
              <nav className="mt-10 space-y-5 text-muted-foreground">
                <p>Library</p>
                <p className="rounded-control bg-accent p-2 text-accent-foreground">Add series</p>
                <p>Plugins</p>
                <p>Downloads</p>
                <p>Settings</p>
              </nav>
              <button
                className="mt-10 underline"
                onClick={() => document.documentElement.classList.toggle('dark')}
              >
                Switch theme
              </button>
              <p className="mt-6 text-caption text-muted-foreground">
                Fictional covers. No source connections or library writes.
              </p>
            </aside>
            <main className="min-w-0 flex-1 px-2">
              <Search />
            </main>
          </div>
        </MemoryRouter>
      </RecoilRoot>,
    ),
  )
  .catch((error) => console.error(error));
