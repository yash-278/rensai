import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { MemoryRouter, Route, Routes, Link, useLocation } from 'react-router-dom';
import { LanguageKey, SettingType } from '@tiyo/common';
import ipc from '../src/common/constants/ipcChannels.json';
import keys from '../src/common/constants/storeKeys.json';
import { FS_METADATA } from '../src/common/temp_fs_metadata';
import {
  NHENTAI_ID,
  KOMGA_ID,
  MANGADEX_ID,
} from '../src/renderer/components/plugins/sourcePresentation';
import './style.css';
import './sources-fixture.css';
type Field = {
  key: string;
  label: string;
  kind: 'text' | 'secret' | 'boolean';
  help: string;
  example?: string;
};
type Source = {
  id: string;
  name: string;
  domain: string;
  language: string;
  fields: Field[];
  values: Record<string, string | boolean>;
};
const seed: Source[] = [
  {
    id: 'nhentai',
    name: 'nhentai',
    domain: 'nhentai.net',
    language: 'Multiple languages',
    fields: [
      {
        key: 'key',
        label: 'API key',
        kind: 'secret',
        help: 'Use a key issued by nhentai when the source requests authenticated access. Enter a sample value here; this preview does not connect to the source.',
        example: 'Sample key',
      },
    ],
    values: { key: '' },
  },
  {
    id: 'mangadex',
    name: 'MangaDex',
    domain: 'mangadex.org',
    language: 'Multiple languages',
    fields: [
      {
        key: 'dataSaver',
        label: 'Data saver',
        kind: 'boolean',
        help: 'Request smaller page images to reduce data use.',
      },
    ],
    values: { dataSaver: false },
  },
  {
    id: 'komga',
    name: 'Komga',
    domain: 'Your server',
    language: 'Multiple languages',
    fields: [
      {
        key: 'address',
        label: 'Server address',
        kind: 'text',
        example: 'https://komga.example:25600',
        help: 'Enter the server address, including its port when needed.',
      },
      {
        key: 'username',
        label: 'Username',
        kind: 'text',
        example: 'Sample user',
        help: 'The username for your Komga account.',
      },
      {
        key: 'password',
        label: 'Password',
        kind: 'secret',
        example: 'Sample password',
        help: 'The password for your Komga account. Use a sample value in this preview.',
      },
    ],
    values: { address: '', username: '', password: '' },
  },
  ...[
    ['mangapill', 'MangaPill', 'mangapill.com', 'English'],
    ['guya', 'Guya', 'guya.moe', 'English'],
    ['mangakatana', 'MangaKatana', 'mangakatana.com', 'English'],
    ['tcb', 'TCB Scans', 'tcbscans.com', 'English'],
    ['sensescans', 'Sense-Scans', 'sensescans.com', 'English'],
    ['lupiteam', 'LupiTeam', 'lupiteam.net', 'Italian'],
    ['hniscantrad', 'HNI Scantrad', 'hni-scantrad.com', 'French'],
  ].map(([id, name, domain, language]) => ({ id, name, domain, language, fields: [], values: {} })),
];

const ids: Record<string, string> = { nhentai: NHENTAI_ID, komga: KOMGA_ID, mangadex: MANGADEX_ID };
const settingKeys: Record<string, string> = {
  key: 'API Key',
  address: 'Address (with port)',
  username: 'Username',
  password: 'Password',
  dataSaver: 'Use data saver',
};
const metadata = seed.map((s) => ({
  id: ids[s.id] || s.id,
  name: s.name,
  url: s.id === 'komga' ? 'https://komga.org' : `https://${s.domain}`,
  translatedLanguage:
    s.language === 'French'
      ? LanguageKey.FRENCH
      : s.language === 'Italian'
        ? LanguageKey.ITALIAN
        : s.language === 'English'
          ? LanguageKey.ENGLISH
          : LanguageKey.MULTI,
}));
const defaults = () =>
  Object.fromEntries(
    seed.map((s) => [
      ids[s.id] || s.id,
      Object.fromEntries(
        Object.entries(s.values).map(([key, value]) => [settingKeys[key] || key, value]),
      ),
    ]),
  );
let values: Record<string, Record<string, unknown>> = defaults();
let failRead = false;
let failSave = false;
let providerError = false;
let long = false;
const review = {
  calls: [] as { channel: string; id?: string }[],
  pathname: '',
  holdRead: false,
  pendingReads: [] as (() => void)[],
  holdSave: false,
  pendingSaves: [] as (() => void)[],
  failPersist: false,
  scenario: (_value: string) => {},
  persisted: (id: string) => localStorage.getItem(`${keys.EXTENSION_SETTINGS_PREFIX}${id}`),
  values: () => values,
  ids,
  flushReads: () => review.pendingReads.splice(0).forEach((resolve) => resolve()),
  flushSaves: () => review.pendingSaves.splice(0).forEach((resolve) => resolve()),
};
const originalSetItem = Storage.prototype.setItem;
Storage.prototype.setItem = function (key, value) {
  if (review.failPersist && key.startsWith(keys.EXTENSION_SETTINGS_PREFIX))
    throw Error('Synthetic storage failure');
  originalSetItem.call(this, key, value);
};
Object.assign(window, {
  review,
  require: (name: string) => {
    if (name !== 'electron') throw Error('Unmocked module');
    return {
      ipcRenderer: {
        invoke: async (channel: string, ...args: unknown[]) => {
          const id = args[0] as string;
          review.calls.push({ channel, id }); // Values are deliberately absent from diagnostics.
          switch (channel) {
            case ipc.EXTENSION_MANAGER.GET_LOCAL_PROVIDER_STATUS:
              return providerError
                ? { error: 'Synthetic provider failure' }
                : { version: '0.1.0-dev.0', sourceCount: metadata.length };
            case ipc.EXTENSION_MANAGER.GET_ALL:
              return [FS_METADATA, ...metadata];
            case ipc.EXTENSION_MANAGER.GET:
              return metadata.find((m) => m.id === id);
            case ipc.EXTENSION_MANAGER.RELOAD:
              providerError = false;
              values = defaults();
              return;
            case ipc.EXTENSION.GET_SETTING_TYPES: {
              const source = seed.find((s) => (ids[s.id] || s.id) === id)!;
              const fields = Object.fromEntries(
                source.fields.map((f) => [
                  settingKeys[f.key] || f.key,
                  f.kind === 'boolean' ? SettingType.BOOLEAN : SettingType.STRING,
                ]),
              );
              if (long && id === KOMGA_ID)
                for (let index = 0; index < 24; index++)
                  fields[`Sample setting ${index + 1}`] = SettingType.STRING;
              return fields;
            }
            case ipc.EXTENSION.GET_SETTINGS: {
              const snapshot = { ...values[id] };
              if (review.holdRead)
                await new Promise<void>((resolve) => review.pendingReads.push(resolve));
              if (failRead && id === NHENTAI_ID) {
                failRead = false;
                throw Error('Synthetic settings failure');
              }
              return snapshot;
            }
            case ipc.EXTENSION.SET_SETTINGS:
              if (review.holdSave)
                await new Promise<void>((resolve) => review.pendingSaves.push(resolve));
              if (failSave) {
                failSave = false;
                throw Error('Synthetic save failure');
              }
              values[id] = { ...(args[1] as Record<string, unknown>) };
              if (id === NHENTAI_ID)
                values[id]['API Key'] = String(values[id]['API Key'] || '').trim();
              return;
            default:
              throw Error(`Unmocked IPC ${channel}`);
          }
        },
      },
    };
  },
});
async function mount() {
  const { default: Plugins } = await import('../src/renderer/components/plugins/Plugins');
  function Fixture() {
    const [scenario, setScenario] = useState('standard');
    const [revision, setRevision] = useState(0);
    const location = useLocation();
    const changeScenario = (next: string) => {
      review.failPersist = false;
      review.holdRead = false;
      review.flushReads();
      review.holdSave = false;
      review.flushSaves();
      for (const source of metadata)
        localStorage.removeItem(`${keys.EXTENSION_SETTINGS_PREFIX}${source.id}`);
      values = defaults();
      failRead = next === 'settings-error';
      failSave = next === 'save-error';
      providerError = next === 'provider-error';
      long = next === 'long';
      setScenario(next);
      setRevision((r) => r + 1);
    };
    useEffect(() => {
      review.scenario = changeScenario;
      review.pathname = location.pathname;
    });
    return (
      <div className="sources-review-shell">
        <aside className="sources-review-nav">
          <a className="text-section-title" href="./index.html">
            Rensai
          </a>
          <p className="text-caption text-muted-foreground">Offline page review</p>
          <nav>
            <a href="./library.html">Library</a>
            <a href="./search.html">Add series</a>
            <a href="./downloads.html">Downloads</a>
            <span aria-current="page">Sources</span>
          </nav>
          <div className="sources-review-tools">
            <button onClick={() => document.documentElement.classList.toggle('dark')}>
              Switch theme
            </button>
            <select
              aria-label="Review scenario"
              value={scenario}
              onChange={(e) => changeScenario(e.target.value)}
              className="bg-background border rounded-control p-2"
            >
              <option value="standard">Loaded sources</option>
              <option value="provider-error">Provider error</option>
              <option value="settings-error">Settings error</option>
              <option value="save-error">Save error</option>
              <option value="long">Long settings</option>
            </select>
            <p className="text-caption text-muted-foreground">
              Production page with sample settings. No source connections or user credential
              changes.
            </p>
          </div>
        </aside>
        <Routes>
          <Route path="/plugins" element={<Plugins key={revision} />} />
          <Route
            path="*"
            element={
              <div className="p-6">
                <h1>Navigation preview</h1>
                <Link to="/plugins">Back to sources</Link>
              </div>
            }
          />
        </Routes>
      </div>
    );
  }
  createRoot(document.getElementById('root')!).render(
    <MemoryRouter initialEntries={['/plugins']}>
      <Fixture />
    </MemoryRouter>,
  );
}
mount().catch(() => console.error('Could not mount Sources fixture.'));
