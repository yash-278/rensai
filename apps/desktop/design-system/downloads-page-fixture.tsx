// Real Downloads page and worker with synthetic storage, images, and filesystem IPC.
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { MemoryRouter, Routes, Route, useLocation, useNavigate, Link } from 'react-router-dom';
import { RecoilRoot, useSetRecoilState } from 'recoil';
import { Chapter, LanguageKey, Series, SeriesStatus } from '@tiyo/common';
import ipc from '../src/common/constants/ipcChannels.json';
import library from '../src/renderer/services/library';
import { seriesListState } from '../src/renderer/state/libraryStates';
import { customDownloadsDirState } from '../src/renderer/state/settingStates';
import {
  runningState,
  currentTaskState,
  queueState,
  downloadErrorsState,
} from '../src/renderer/state/downloaderStates';
import './style.css';
import './downloads-fixture.css';
const books: Series[] = [
  'The Last Train',
  'Summer Postcards',
  'Blue Hour',
  'Letters from Home',
].map((title, i) => ({
  id: `book-${i}`,
  title,
  numberUnread: 43,
  extensionId: 'sample',
  sourceId: `sample-${i}`,
  authors: ['Sample author'],
  artists: [],
  altTitles: [],
  description: 'Fictional offline review series.',
  tags: [],
  categories: [],
  status: SeriesStatus.ONGOING,
  originalLanguageKey: LanguageKey.JAPANESE,
  remoteCoverUrl: '',
}));
const chapters = (series: Series): Chapter[] =>
  Array.from({ length: 48 }, (_, i) => ({
    id: `${series.id}-ch-${i + 1}`,
    sourceId: String(i + 1),
    chapterNumber: String(i + 1),
    volumeNumber: '1',
    title: [
      'A letter without a name',
      'The last train home',
      'A familiar platform',
      'A promise in the rain',
    ][i % 4],
    languageKey: LanguageKey.ENGLISH,
    groupName: 'Sample group',
    time: 0,
    read: i < 5,
  }));
let pendingImage: (() => void) | undefined;
let automaticChapter = '';
let imageChapter = '';
const files = new Set<string>();
const disk: Record<string, Set<string>> = {};
const review = {
  calls: [] as { channel: string; args: unknown[] }[],
  pathname: '',
  failScan: false,
  failDelete: [] as string[],
  holdScan: false,
  pendingScans: [] as (() => void)[],
  holdDelete: false,
  pendingDeletes: [] as (() => void)[],
  scenario: async (_value: string) => {},
  navigate: (_value: string) => {},
  setDirectory: (_dir: string) => {},
  advance: () => {
    pendingImage?.();
  },
  complete: () => {
    automaticChapter = imageChapter;
    pendingImage?.();
  },
  state: () => ({}),
  saved: () => library.fetchSeriesList(),
  chapters: () => library.fetchChapters('book-0'),
  disk: () => Object.fromEntries(Object.entries(disk).map(([dir, ids]) => [dir, [...ids]])),
  flushScans: () => {
    review.pendingScans.splice(0).forEach((resolve) => resolve());
  },
  flushDeletes: () => {
    review.pendingDeletes.splice(0).forEach((resolve) => resolve());
  },
};
Object.assign(window, {
  review,
  require: (name: string) => {
    if (name === 'fs')
      return {
        existsSync: (p: string) => p === '/offline-review' || files.has(p),
        mkdirSync() {},
        writeFileSync: (p: string) => {
          files.add(p);
        },
        unlinkSync: (p: string) => {
          files.delete(p);
          const [, dir, id] = p.split('/');
          (disk[`/${dir}`] ||= new Set()).add(id);
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
            case ipc.FILESYSTEM.GET_ALL_DOWNLOADED_CHAPTER_IDS: {
              const snapshot = [...(disk[args[0] as string] || [])];
              if (review.holdScan)
                await new Promise<void>((resolve) => review.pendingScans.push(resolve));
              if (review.failScan) throw Error('Synthetic scan failure');
              return snapshot;
            }
            case ipc.FILESYSTEM.DELETE_DOWNLOADED_CHAPTER:
              if (review.holdDelete)
                await new Promise<void>((resolve) => review.pendingDeletes.push(resolve));
              if (review.failDelete.includes((args[1] as Chapter).id!)) throw Error('Synthetic deletion failure');
              disk[args[2] as string]?.delete((args[1] as Chapter).id!);
              return;
            case ipc.FILESYSTEM.GET_CHAPTER_DOWNLOAD_PATH:
              return `${args[2]}/${(args[1] as Chapter).id!}`;
            case ipc.EXTENSION.GET_PAGE_REQUESTER_DATA:
              return {};
            case ipc.EXTENSION.GET_PAGE_URLS:
              return Array.from({ length: 48 }, (_, i) => `https://synthetic.invalid/${i + 1}.png`);
            case ipc.EXTENSION.GET_IMAGE:
              if (automaticChapter !== imageChapter)
                await new Promise<void>((resolve) => {
                  pendingImage = () => {
                    pendingImage = undefined;
                    resolve();
                  };
                });
              return new Uint8Array([1, 2, 3]);
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
  function Controls() {
    const navigate = useNavigate();
    const location = useLocation();
    const setSeries = useSetRecoilState(seriesListState);
    const setDirectory = useSetRecoilState(customDownloadsDirState);
    const setRunning = useSetRecoilState(runningState);
    const setQueue = useSetRecoilState(queueState);
    const setCurrent = useSetRecoilState(currentTaskState);
    const setErrors = useSetRecoilState(downloadErrorsState);
    const [scenario, setScenario] = useState('standard');
    const changeScenario = async (value: string) => {
      downloaderClient.pause();
      pendingImage?.();
      while (downloaderClient.currentTask) await new Promise((resolve) => setTimeout(resolve, 10));
      automaticChapter = '';
      review.failScan = value === 'scan-error';
      review.failDelete = [];
      review.holdScan = false;
      review.flushScans();
      review.holdDelete = false;
      review.flushDeletes();
      setScenario(value);
      setDirectory('');
      files.clear();
      library.fetchSeriesList().forEach((series) => library.removeSeries(series.id!));
      books.forEach((series) => {
        library.upsertSeries(series);
        library.upsertChapters(chapters(series), series);
      });
      disk['/offline-review'] = new Set(
        value === 'empty'
          ? []
          : books.flatMap((series) =>
              chapters(series)
                .slice(0, 12)
                .map((ch) => ch.id!),
            ),
      );
      disk['/alternate-review'] = new Set(
        chapters(books[3])
          .slice(12, 14)
          .map((ch) => ch.id!),
      );
      const task = (number: number) => ({
        series: books[0],
        chapter: chapters(books[0])[number - 1],
        downloadsDir: '/offline-review',
      });
      downloaderClient.setCurrentTask(null);
      downloaderClient.setQueue(
        value === 'empty' ? [] : Array.from({ length: 12 }, (_, i) => task(i + 23)),
      );
      downloaderClient.setDownloadErrors(
        value === 'empty'
          ? []
          : [35, 36].map((number) => ({
              ...task(number),
              errorStr: 'Could not download this chapter. Try again.',
            })),
      );
      setSeries(library.fetchSeriesList());
      navigate('/downloads');
      if (value === 'standard') {
        downloaderClient.setQueue([{ ...task(22), page: 24 }, ...downloaderClient.queue]);
        downloaderClient.start();
      }
    };
    useEffect(() => {
      downloaderClient.setStateFunctions(
        setRunning,
        setQueue,
        (task) => {
          imageChapter = task?.chapter.id || '';
          setCurrent(task);
        },
        setErrors,
      );
      review.state = () => ({
        queue: downloaderClient.queue,
        current: downloaderClient.currentTask,
        running: downloaderClient.running,
        errors: downloaderClient.downloadErrors,
      });
      review.setDirectory = setDirectory;
      changeScenario('standard');
    }, []);
    useEffect(() => {
      review.pathname = location.pathname;
      review.navigate = navigate;
      review.scenario = changeScenario;
    });
    return (
      <aside className="downloads-review-nav">
        <a className="text-section-title" href="./index.html">
          Rensai
        </a>
        <p className="text-caption text-muted-foreground">Offline page review</p>
        <nav className="flex flex-col gap-4 mt-8">
          <a href="./library.html">Library</a>
          <a href="./search.html">Add series</a>
          <a href="./series.html">Series details</a>
          <span>Downloads</span>
        </nav>
        <div className="downloads-review-tools">
          <button onClick={() => document.documentElement.classList.toggle('dark')}>
            Switch theme
          </button>
          <select
            aria-label="Review scenario"
            className="bg-background border rounded-control p-2"
            value={scenario}
            onChange={(e) => changeScenario(e.target.value)}
          >
            <option value="standard">Downloading</option>
            <option value="paused">Paused queue</option>
            <option value="scan-error">Scan error</option>
            <option value="empty">Empty</option>
          </select>
          <button onClick={() => review.advance()}>Advance sample</button>
          <p className="text-caption text-muted-foreground">
            Production page with fictional chapters. No source connections or user file changes.
          </p>
        </div>
      </aside>
    );
  }
  const { default: Downloads } = await import('../src/renderer/components/downloads/Downloads');
  createRoot(document.getElementById('root')!).render(
    <RecoilRoot>
      <MemoryRouter initialEntries={['/downloads']}>
        <div className="downloads-live-fixture">
          <Controls />
          <main className="min-w-0 min-h-0">
            <Routes>
              <Route path="/downloads" element={<Downloads />} />
              <Route
                path="*"
                element={
                  <div className="p-6">
                    <h1>Navigation preview</h1>
                    <Link to="/downloads">Back to downloads</Link>
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
