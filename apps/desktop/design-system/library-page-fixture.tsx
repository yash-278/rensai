// Actual Library component and storage service, synthetic data, explicit offline IPC.
import { createRoot } from 'react-dom/client';
import path from 'path';
import { useEffect } from 'react';
import { MemoryRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { RecoilRoot, useRecoilValue, useSetRecoilState } from 'recoil';
import { Chapter, LanguageKey, Series, SeriesStatus } from '@tiyo/common';
import ipc from '../src/common/constants/ipcChannels.json';
import library from '../src/renderer/services/library';
import { GeneralSetting, LibraryView } from '../src/common/models/types';
import { categoryListState, seriesListState } from '../src/renderer/state/libraryStates';
import {
  chapterLanguagesState,
  libraryColumnsState,
  libraryViewState,
  confirmRemoveSeriesState,
  autoBackupState,
  refreshOnStartState,
} from '../src/renderer/state/settingStates';
import './style.css';
import './library-fixture.css';

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
  'Small Hours',
  'Beyond the Orchard',
  'A Place to Return',
  'The Weather Station at the End of the Road',
];
const categories = [
  { id: 'favorites', label: 'Favorites' },
  { id: 'weekend', label: 'Weekend reads' },
];
const colors = ['#294754', '#70543d', '#344963', '#486052', '#65515b', '#52656a'];
const books = names.map(
  (title, i) =>
    ({
      id: `sample-${i}`,
      extensionId: 'sample',
      sourceId: String(i),
      title,
      authors: ['A. Mori'],
      artists: ['R. Aoki'],
      altTitles: [],
      description: 'Offline Library fixture',
      tags: [],
      categories: [categories[i % 2].id],
      numberUnread: 99,
      status: i % 3 === 0 ? SeriesStatus.COMPLETED : SeriesStatus.ONGOING,
      originalLanguageKey: LanguageKey.ENGLISH,
      remoteCoverUrl: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 400"><rect width="280" height="400" fill="${colors[i % 6]}"/><circle cx="210" cy="350" r="160" fill="none" stroke="white" opacity=".22"/><path d="M20 0V400" stroke="white" opacity=".2"/><text x="40" y="65" font-family="sans-serif" font-size="12" fill="white">OFFLINE EDITION ${i + 1}</text><text x="40" y="180" font-family="serif" font-size="30" fill="white">${title.split(' ').slice(0, 2).join(' ')}</text><text x="40" y="225" font-family="serif" font-size="30" fill="white">${title.split(' ').slice(2, 5).join(' ')}</text></svg>`)}`,
    }) as Series,
);
const chapters = (series: Series) =>
  Array.from(
    { length: 12 },
    (_, i) =>
      ({
        id: `${series.id}-chapter-${i}`,
        sourceId: String(i),
        title: `Chapter ${i + 1}`,
        chapterNumber: String(i + 1),
        volumeNumber: '1',
        languageKey: LanguageKey.ENGLISH,
        groupName: 'Sample group',
        time: 0,
        read:
          i < (Number(series.sourceId) % 4 === 0 ? 5 : Number(series.sourceId) % 4 === 2 ? 12 : 0),
      }) as Chapter,
  );
// Seed only the offline origin's fixture library. Never open an Electron app profile.
for (const series of library.fetchSeriesList()) if (series.id) library.removeSeries(series.id);
books.forEach((series) => {
  library.upsertSeries(series);
  library.upsertChapters(chapters(series), series);
});
const review = {
  calls: [] as { channel: string; args: unknown[] }[],
  failNext: false,
  pathname: '/',
  empty: () => {},
  series: [] as Series[],
  saved: () => library.fetchSeriesList(),
  chapters: (id: string) => library.fetchChapters(id),
  setting: GeneralSetting.LibraryColumns,
};
Object.assign(window, {
  review,
  require: (name: string) => {
    if (name === 'path') return path;
    if (name === 'fs')
      return {
        existsSync: (path: string) => path === '/offline-review',
        mkdirSync: () => {
          throw Error('Fixture must not write files');
        },
      };
    if (name !== 'electron') throw Error(`Unmocked module ${name}`);
    return {
      ipcRenderer: {
        invoke: async (channel: string, ...args: unknown[]) => {
          review.calls.push({ channel, args });
          switch (channel) {
            case ipc.GET_PATH.DEFAULT_DOWNLOADS_DIR:
              return '/offline-review/downloads';
            case ipc.GET_PATH.THUMBNAILS_DIR:
              return '/offline-review';
            case ipc.EXTENSION_MANAGER.GET:
              return { id: 'sample', name: 'Sample catalog' };
            case ipc.EXTENSION.GET_SERIES:
              if (review.failNext) {
                review.failNext = false;
                throw Error('Synthetic refresh failure');
              }
              return { ...books[Number(args[1])] };
            case ipc.EXTENSION.GET_CHAPTERS:
              return chapters(books[Number(args[1])]);
            case ipc.FILESYSTEM.GET_THUMBNAIL_PATH:
              return null;
            case ipc.FILESYSTEM.DELETE_THUMBNAIL:
              return;
            default:
              throw Error(`Unmocked IPC ${channel}`);
          }
        },
      },
    };
  },
});
function Observe() {
  const setSeries = useSetRecoilState(seriesListState);
  const location = useLocation();
  const series = useRecoilValue(seriesListState);
  useEffect(() => {
    review.empty = () => {
      library.fetchSeriesList().forEach((s) => library.removeSeries(s.id!));
      setSeries([]);
    };
    review.pathname = location.pathname;
    review.series = series;
  }, [location, series]);
  return null;
}
const websiteCapture = new URLSearchParams(location.search).has('website-capture');
if (websiteCapture) {
  // Use the production application shell, with the same synthetic library as this fixture.
  Promise.all([
    import('../src/renderer/components/general/DashboardPage'),
    import('../src/renderer/components/general/Titlebar'),
    import('../src/renderer/App.global.css'),
  ]).then(([{ default: DashboardPage }, { Titlebar }]) => {
    const mount = document.getElementById('root')!;
    mount.id = 'website-capture';
    createRoot(mount).render(
      <RecoilRoot initializeState={({ set }) => {
        set(categoryListState, categories);
        set(chapterLanguagesState, [LanguageKey.ENGLISH]);
        set(libraryColumnsState, 0);
        set(libraryViewState, LibraryView.GridComfortable);
        set(refreshOnStartState, false);
        set(autoBackupState, false);
      }}>
        <MemoryRouter>
          <header id="titlebar"><Titlebar /></header>
          <div id="root"><DashboardPage /></div>
        </MemoryRouter>
      </RecoilRoot>,
    );
  });
} else import('../src/renderer/components/library/Library').then(({ default: Library }) =>
  createRoot(document.getElementById('root')!).render(
    <RecoilRoot
      initializeState={({ set }) => {
        set(categoryListState, categories);
        set(chapterLanguagesState, [LanguageKey.ENGLISH]);
        set(libraryColumnsState, 0);
        set(libraryViewState, LibraryView.GridComfortable);
        set(confirmRemoveSeriesState, true);
      }}
    >
      <MemoryRouter>
        <Observe />
        <div className="library-live-fixture">
          <aside className="review-nav">
            <a className="review-brand" href="./index.html">
              Rensai
            </a>
            <p className="text-caption text-muted-foreground">Offline page review</p>
            <Link to="/">Library</Link>
            <a href="./search.html">Add series</a>
            <ButtonTheme />
            <p className="text-caption text-muted-foreground">
              Fictional books. No source connections or user library writes.
            </p>
          </aside>
          <main className="min-w-0">
            <Routes>
              <Route path="/" element={<Library />} />
              <Route
                path="*"
                element={
                  <div className="p-6">
                    <h1 className="text-page-title">Navigation preview</h1>
                    <p>Reader and series detail navigation reached the selected saved record.</p>
                    <Link to="/">Back to library</Link>
                  </div>
                }
              />
            </Routes>
          </main>
        </div>
      </MemoryRouter>
    </RecoilRoot>,
  ),
);
function ButtonTheme() {
  return (
    <button onClick={() => document.documentElement.classList.toggle('dark')}>Switch theme</button>
  );
}
