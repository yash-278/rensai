import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { Folder } from 'lucide-react';
import { Button } from '@houdoku/ui/components/Button';
import ipc from '@/common/constants/ipcChannels.json';
import {
  confirmRemoveSeriesState,
  customDownloadsDirState,
  libraryCropCoversState,
  refreshOnStartState,
} from '@/renderer/state/settingStates';
import { togglePreference, type Preference } from './SettingsFields';
const { ipcRenderer } = require('electron');
function DownloadFolder() {
  const [custom, setCustom] = useRecoilState(customDownloadsDirState);
  const [defaultPath, setDefaultPath] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    ipcRenderer
      .invoke(ipc.GET_PATH.DEFAULT_DOWNLOADS_DIR)
      .then((value: string) => {
        if (active) {
          setDefaultPath(value);
          setError('');
        }
      })
      .catch(() => {
        if (active) setError('Could not load the default download folder.');
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  const choose = async () => {
    setBusy(true);
    setError('');
    try {
      const paths: string[] = await ipcRenderer.invoke(
        ipc.APP.SHOW_OPEN_DIALOG,
        true,
        [],
        'Select Downloads Directory',
      );
      if (!Array.isArray(paths)) throw Error('Picker failed');
      if (paths.length) setCustom(paths[0]);
    } catch {
      setError('Could not select a folder. Try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="settings-folder">
      <div>
        <Folder size={18} aria-hidden="true" />
        <span>{custom || defaultPath || 'Loading default folder…'}</span>
      </div>
      <div className="settings-inline-actions">
        <Button variant="outline" disabled={busy} onClick={choose}>
          {busy ? 'Choosing…' : 'Choose folder…'}
        </Button>
        <Button variant="ghost" disabled={!custom || busy} onClick={() => setCustom('')}>
          Use default
        </Button>
        {!defaultPath && error && (
          <Button variant="outline" onClick={() => setAttempt((n) => n + 1)}>
            Retry
          </Button>
        )}
      </div>
      <p>Changing this folder does not move existing downloads.</p>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
export const libraryPreferences: Preference[] = [
  togglePreference(
    'refresh',
    'library',
    'Collection',
    'Refresh library on startup',
    'Check your saved series for new chapters when the app opens.',
    refreshOnStartState,
  ),
  togglePreference(
    'confirm',
    'library',
    'Collection',
    'Confirm series removal',
    'Ask before removing a series from your library.',
    confirmRemoveSeriesState,
  ),
  togglePreference(
    'crop',
    'library',
    'Covers',
    'Crop covers to fill the grid',
    'Fill each cover frame. Some edges of the artwork may be cropped.',
    libraryCropCoversState,
  ),
  {
    id: 'directory',
    section: 'library',
    group: 'Downloads',
    title: 'Download folder',
    description: 'Choose where new chapter downloads are saved.',
    keywords: 'directory location storage path',
    wide: true,
    control: <DownloadFolder />,
  },
];
