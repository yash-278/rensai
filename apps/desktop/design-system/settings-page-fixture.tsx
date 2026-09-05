// Production Settings with synthetic IPC, storage and account responses.
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { RecoilRoot, useRecoilValue } from 'recoil';
import { MemoryRouter, useLocation, Link } from 'react-router-dom';
import path from 'path';
import { Button } from '@houdoku/ui/components/Button';
import { Dialog, DialogTrigger } from '@houdoku/ui/components/Dialog';
import ipc from '../src/common/constants/ipcChannels.json';
import keys from '../src/common/constants/storeKeys.json';
import { GeneralSetting, ApplicationTheme } from '../src/common/models/types';
import './style.css';
import './settings-fixture.css';

const review = {
  failNext: '',
  cancelPicker: false,
  invalidBackup: false,
  calls: [] as string[],
  exports: 0,
  pathname: '/',
  tokens: {} as Record<string, string>,
};
if (!sessionStorage.getItem('settings-production-seeded')) {
  localStorage.setItem(`${keys.SETTINGS.GENERAL_PREFIX}${GeneralSetting.autoBackup}`, 'true');
  localStorage.setItem(`${keys.SETTINGS.GENERAL_PREFIX}${GeneralSetting.autoBackupCount}`, '7');
  localStorage.setItem(
    `${keys.SETTINGS.GENERAL_PREFIX}${GeneralSetting.ApplicationTheme}`,
    ApplicationTheme.Dark,
  );
  localStorage.setItem(`${keys.TRACKER_ACCESS_TOKEN_PREFIX}AniList`, 'sample-token');
  sessionStorage.setItem('settings-production-seeded', 'true');
}
for (const id of ['AniList', 'MyAnimeList', 'MangaUpdates'])
  review.tokens[id] = localStorage.getItem(`${keys.TRACKER_ACCESS_TOKEN_PREFIX}${id}`) || '';
const sampleSeries = {
  id: 'settings-restored-series',
  sourceId: 'sample',
  extensionId: 'sample',
  title: 'A Quiet Orbit',
  authors: [],
  artists: [],
  tags: [],
  description: 'Offline backup fixture',
};
const backup = JSON.stringify({
  [keys.LIBRARY.SERIES_LIST]: JSON.stringify([sampleSeries]),
  [`${keys.LIBRARY.CHAPTER_LIST_PREFIX}${sampleSeries.id}`]: JSON.stringify([
    { id: 'restored-chapter', title: 'Chapter 1', chapterNumber: '1', read: true },
  ]),
});
Object.assign(window, {
  review,
  require: (name: string) => {
    if (name === 'path') return path;
    if (name === 'fs') return { existsSync: () => true };
    if (name !== 'electron') throw Error(`Unmocked module ${name}`);
    return {
      ipcRenderer: {
        invoke: async (channel: string, ...args: unknown[]) => {
          review.calls.push(channel);
          if (review.failNext === channel) {
            review.failNext = '';
            throw Error('Synthetic operation failure');
          }
          switch (channel) {
            case ipc.GET_PATH.DEFAULT_DOWNLOADS_DIR:
              return '/Users/sample/Library/Application Support/Houdoku/downloads';
            case ipc.APP.SHOW_OPEN_DIALOG:
              if (review.cancelPicker) {
                review.cancelPicker = false;
                return [];
              }
              return [
                args[0]
                  ? '/Volumes/Reading archive/Collections/Translated editions/Downloaded chapters'
                  : '/offline-review/backup.json',
              ];
            case ipc.APP.READ_ENTIRE_FILE:
              return review.invalidBackup ? 'invalid JSON' : backup;
            case ipc.FILESYSTEM.GET_THUMBNAIL_PATH:
              return null;
            case ipc.TRACKER.GET_AUTH_URLS:
              return {
                AniList: 'https://example.invalid/anilist-authorize',
                MyAnimeList: 'https://example.invalid/mal-authorize',
              };
            case ipc.TRACKER.GET_USERNAME:
              return review.tokens[String(args[0])] ? 'sample_reader' : null;
            case ipc.TRACKER.GET_TOKEN:
              return args[1] === 'bad' ? null : 'sample-issued-token';
            case ipc.TRACKER.SET_ACCESS_TOKEN:
              review.tokens[String(args[0])] = String(args[1]);
              return;
            default:
              throw Error(`Unmocked IPC ${channel}`);
          }
        },
      },
    };
  },
});
// Observe the export intent without creating a real downloaded file.
document.addEventListener(
  'click',
  (event) => {
    const link = (event.target as Element).closest('a[download]');
    if (link) {
      event.preventDefault();
      review.exports++;
    }
  },
  true,
);
Promise.all([
  import('../src/renderer/components/settings/SettingsDialogContent'),
  import('../src/renderer/state/settingStates'),
]).then(([{ SettingsDialogContent, SettingsPage }, { themeState }]) => {
  function SettingsFixture() {
    const [open, setOpen] = useState(true);
    const [page, setPage] = useState(SettingsPage.General);
    const theme = useRecoilValue(themeState);
    const location = useLocation();
    useEffect(() => {
      document.documentElement.classList.toggle('dark', theme === ApplicationTheme.Dark);
    }, [theme]);
    useEffect(() => {
      review.pathname = location.pathname;
    }, [location]);
    return (
      <main className="settings-review-stage">
        <aside className="settings-review-sidebar">
          <strong>Rensai</strong>
          <nav aria-label="Review pages">
            <a href="./library.html">Library</a>
            <a href="./search.html">Add series</a>
            <a href="./sources.html">Sources</a>
            <a href="./downloads.html">Downloads</a>
            <span aria-current="page">Settings</span>
          </nav>
          <p>
            Production settings.
            <br />
            Synthetic accounts and files.
          </p>
        </aside>
        <div className="settings-review-intro">
          <h1>Settings</h1>
          <p>Offline review. Preferences are stored only in this browser profile.</p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setPage(SettingsPage.General)}>Open settings</Button>
            </DialogTrigger>
            {open && <SettingsDialogContent defaultPage={page} />}
          </Dialog>
          <Button
            variant="outline"
            onClick={() => {
              setPage(SettingsPage.Reader);
              setOpen(true);
            }}
          >
            Open reader settings
          </Button>
          {location.pathname === '/plugins' && (
            <p>
              Sources navigation reached. <Link to="/">Return</Link>
            </p>
          )}
        </div>
      </main>
    );
  }
  createRoot(document.getElementById('root')!).render(
    <RecoilRoot>
      <MemoryRouter>
        <SettingsFixture />
      </MemoryRouter>
    </RecoilRoot>,
  );
});
