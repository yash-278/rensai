// Production Series details with synthetic storage and explicit offline IPC.
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { MemoryRouter, Routes, Route, useLocation, useNavigate, Link } from 'react-router-dom';
import { RecoilRoot, useSetRecoilState } from 'recoil';
import { Chapter, LanguageKey, Series, SeriesStatus } from '@tiyo/common';
import ipc from '../src/common/constants/ipcChannels.json';
import { FS_METADATA } from '../src/common/temp_fs_metadata';
import library from '../src/renderer/services/library';
import { GeneralSetting, TableColumnSortOrder } from '../src/common/models/types';
import { seriesListState } from '../src/renderer/state/libraryStates';
import {
  chapterLanguagesState,
  chapterListPageSizeState,
  chapterListChOrderState,
  chapterListVolOrderState,
} from '../src/renderer/state/settingStates';
import {
  runningState,
  currentTaskState,
  queueState,
  downloadErrorsState,
} from '../src/renderer/state/downloaderStates';
import './style.css';
import './series-fixture.css';
const paragraph =
  'Every evening, Hana sorts the letters left behind on the last train. One arrives with her name. As the seasons change, she follows a trail of forgotten promises through towns she has never visited.';
const sample: Series = {
  id: 'sample-series',
  extensionId: 'sample',
  sourceId: 'sample',
  title: 'The Last Train',
  authors: ['A. Mori'],
  artists: ['R. Aoki'],
  altTitles: [],
  description: paragraph,
  tags: ['Slice of life', 'Mystery'],
  categories: [],
  status: SeriesStatus.ONGOING,
  originalLanguageKey: LanguageKey.JAPANESE,
  numberUnread: 27,
  remoteCoverUrl: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 400"><rect width="280" height="400" fill="#294754"/><circle cx="210" cy="350" r="160" fill="none" stroke="white" opacity=".22"/><path d="M20 0V400" stroke="white" opacity=".2"/><text x="35" y="65" font-family="sans-serif" font-size="12" fill="white">RENSAI EDITIONS</text><text x="35" y="180" font-family="serif" font-size="36" fill="white">The Last</text><text x="35" y="225" font-family="serif" font-size="36" fill="white">Train</text><text x="35" y="355" font-family="sans-serif" font-size="16" fill="white">A. MORI</text></svg>')}`,
};
const names = [
  'A letter without a name',
  'The last train home',
  'A familiar platform',
  'A promise in the rain',
  'The map in the margin',
  'Where the river bends',
  'A town between stations',
  'Morning departures',
];
const seedChapters = (id: string) =>
  Array.from(
    { length: 48 },
    (_, i) =>
      ({
        id: `${id}-ch-${i + 1}`,
        sourceId: String(i + 1),
        title: names[i % 8],
        chapterNumber: String(i + 1),
        volumeNumber: String(Math.floor(i / 8) + 1),
        languageKey: i % 8 === 7 ? LanguageKey.JAPANESE : LanguageKey.ENGLISH,
        groupName: i % 3 === 0 ? 'Paper Crane' : 'Aoba Scans',
        time: 0,
        read: i < 21,
      }) as Chapter,
  );
const review = {
  calls: [] as { channel: string; args: unknown[] }[],
  pathname: '',
  failNext: false,
  failStatus: false,
  failDownload: false,
  saved: () => library.fetchSeriesList(),
  chapters: (id = 'sample-series') => library.fetchChapters(id),
  scenario: (_value: string) => {},
  navigate: (_path: string) => {},
  complete: () => {},
  setTask: (_number: number) => {},
  disk: {} as Record<string, boolean>,
  settings: { pageSize: GeneralSetting.ChapterListPageSize },
};
Object.assign(window, {
  review,
  require: (name: string) => {
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
            case ipc.GET_PATH.THUMBNAILS_DIR:
            case ipc.GET_PATH.DEFAULT_DOWNLOADS_DIR:
              return '/offline-review';
            case ipc.EXTENSION_MANAGER.GET:
              return {
                id: args[0],
                name: args[0] === FS_METADATA.id ? 'Local files' : 'Sample catalog',
              };
            case ipc.EXTENSION.GET_SERIES:
              if (review.failNext) {
                review.failNext = false;
                throw Error('Synthetic refresh failure');
              }
              return { ...library.fetchSeries('sample-series') };
            case ipc.EXTENSION.GET_CHAPTERS:
              return review.chapters();
            case ipc.FILESYSTEM.GET_CHAPTERS_DOWNLOADED:
              if (review.failStatus) throw Error('Synthetic disk status failure');
              return { ...review.disk };
            case ipc.FILESYSTEM.GET_THUMBNAIL_PATH:
              return null;
            case ipc.FILESYSTEM.DELETE_THUMBNAIL:
              return;
            case ipc.TRACKER.GET_USERNAME:
              return null;
            default:
              throw Error(`Unmocked IPC ${channel}`);
          }
        },
      },
    };
  },
});
async function mount() {
  const { downloaderClient } = await import('../src/renderer/services/downloader');
  // Retain real queue insertion; execution is deliberately held at the fixture boundary.
  downloaderClient.start = async () => {
    if (review.failDownload) {
      review.failDownload = false;
      const task = downloaderClient.queue[0];
      downloaderClient.setQueue(downloaderClient.queue.slice(1));
      downloaderClient.setCurrentTask(task);
      downloaderClient.setRunning(true);
      throw Error('Synthetic transport failure');
    }
  };
  function Controls() {
    const navigate = useNavigate();
    const location = useLocation();
    const setSeries = useSetRecoilState(seriesListState);
    const setRunning = useSetRecoilState(runningState);
    const setQueue = useSetRecoilState(queueState);
    const setTask = useSetRecoilState(currentTaskState);
    const setErrors = useSetRecoilState(downloadErrorsState);
    const [scenario, setScenario] = useState('standard');
    const changeScenario = (value: string) => {
      setScenario(value);
      review.failNext = value === 'failure';
      review.failStatus = false;
      const book = {
        ...sample,
        id:
          value === 'local'
            ? 'local-series'
            : value === 'preview'
              ? 'preview-series'
              : 'sample-series',
        extensionId: value === 'local' ? FS_METADATA.id : 'sample',
        preview: value === 'preview',
        remoteCoverUrl: value === 'local' ? '' : sample.remoteCoverUrl,
        title:
          value === 'long'
            ? 'The Last Train: Letters from the Town at the End of the Line'
            : sample.title,
        description: value === 'long' ? Array(20).fill(paragraph).join('\n\n') : paragraph,
        tags:
          value === 'long'
            ? Array.from({ length: 24 }, (_, i) => `Fictional tag ${i + 1}`)
            : sample.tags,
      };
      library.fetchSeriesList().forEach((series) => library.removeSeries(series.id!));
      library.upsertSeries(book);
      const chapters = value === 'empty' ? [] : seedChapters(book.id!);
      library.upsertChapters(chapters, book);
      review.disk = Object.fromEntries(chapters.slice(0, 10).map((chapter) => [chapter.id!, true]));
      downloaderClient.setQueue(
        chapters.length
          ? [{ series: book, chapter: chapters[21], downloadsDir: '/offline-review' }]
          : [],
      );
      downloaderClient.setDownloadErrors(
        chapters.length
          ? [{ series: book, chapter: chapters[24], errorStr: 'Synthetic failure' }]
          : [],
      );
      downloaderClient.setCurrentTask(null);
      downloaderClient.setRunning(false);
      setSeries(library.fetchSeriesList());
      navigate(`/series/${book.id}`);
    };
    useEffect(() => {
      downloaderClient.setStateFunctions(setRunning, setQueue, setTask, setErrors);
      changeScenario('standard');
      review.setTask = (number: number) => {
        const series = library.fetchSeries('sample-series')!;
        downloaderClient.setCurrentTask({
          series,
          chapter: review.chapters().find((c) => c.chapterNumber === String(number))!,
          downloadsDir: '/offline-review',
          page: 1,
          totalPages: 10,
        });
        downloaderClient.setRunning(true);
      };
      review.complete = () => {
        if (downloaderClient.currentTask)
          review.disk[downloaderClient.currentTask.chapter.id!] = true;
        downloaderClient.setCurrentTask(null);
        downloaderClient.setRunning(false);
      };
    }, []);
    useEffect(() => {
      review.pathname = location.pathname;
      review.scenario = changeScenario;
      review.navigate = navigate;
    });
    return (
      <aside className="series-review-nav">
        <a className="text-section-title" href="./index.html">
          Rensai
        </a>
        <p className="text-caption text-muted-foreground">Offline page review</p>
        <nav className="flex flex-col gap-4 mt-8">
          <a href="./library.html">Library</a>
          <a href="./search.html">Add series</a>
        </nav>
        <div className="series-review-tools">
          <button onClick={() => document.documentElement.classList.toggle('dark')}>
            Switch theme
          </button>
          <select
            className="bg-background border rounded-control p-2"
            aria-label="Review scenario"
            value={scenario}
            onChange={(event) => changeScenario(event.target.value)}
          >
            {[
              ['standard', 'Sample series'],
              ['long', 'Long metadata'],
              ['empty', 'No chapters'],
              ['failure', 'Refresh failure'],
              ['local', 'Local series'],
              ['preview', 'Source preview'],
            ].map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <p className="text-caption text-muted-foreground">
            Fictional series. No source connections or user library writes.
          </p>
        </div>
      </aside>
    );
  }
  const { default: SeriesDetails } = await import(
    '../src/renderer/components/library/SeriesDetails'
  );
  createRoot(document.getElementById('root')!).render(
    <RecoilRoot
      initializeState={({ set }) => {
        set(chapterLanguagesState, [LanguageKey.ENGLISH]);
        set(chapterListPageSizeState, 20);
        set(chapterListChOrderState, TableColumnSortOrder.Descending);
        set(chapterListVolOrderState, TableColumnSortOrder.None);
      }}
    >
      <MemoryRouter initialEntries={['/series/sample-series']}>
        <div className="series-live-fixture">
          <Controls />
          <main className="min-w-0 min-h-0">
            <Routes>
              <Route path="/series/:id" element={<SeriesDetails />} />
              <Route
                path="*"
                element={
                  <div className="p-6">
                    <h1>Navigation preview</h1>
                    <p>The selected reader or library route was reached.</p>
                    <Link to="/series/sample-series">Back to series</Link>
                  </div>
                }
              />
            </Routes>
          </main>
        </div>
      </MemoryRouter>
    </RecoilRoot>,
  );
}
mount().catch(console.error);
