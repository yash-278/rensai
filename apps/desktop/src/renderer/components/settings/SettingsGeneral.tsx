import { useState } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { Check, Moon, Sun } from 'lucide-react';
import { Button } from '@houdoku/ui/components/Button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@houdoku/ui/components/Dialog';
import { ApplicationTheme } from '@/common/models/types';
import ipc from '@/common/constants/ipcChannels.json';
import { createBackup, restoreBackup } from '@/renderer/util/backup';
import {
  autoBackupState,
  autoBackupCountState,
  themeState,
  autoCheckForUpdatesState,
} from '@/renderer/state/settingStates';
import { NumberPreference, togglePreference, type Preference } from './SettingsFields';
import library from '@/renderer/services/library';
import { seriesListState, seriesState, chapterListState } from '@/renderer/state/libraryStates';
const { ipcRenderer } = require('electron');
function ThemePreference() {
  const [theme, setTheme] = useRecoilState(themeState);
  return (
    <div className="settings-theme-options" role="group" aria-labelledby="appearance-label">
      {[ApplicationTheme.Light, ApplicationTheme.Dark].map((value) => (
        <button
          key={value}
          type="button"
          className={`settings-theme-choice ${value === ApplicationTheme.Dark ? 'theme-dark' : 'theme-light'}`}
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
        >
          <span className="settings-theme-sample" aria-hidden="true">
            <span className="sample-sidebar" />
            <span className="sample-content">
              <i />
              <i />
              <i />
            </span>
          </span>
          <span className="settings-theme-label">
            {value === ApplicationTheme.Dark ? <Moon size={16} /> : <Sun size={16} />}{' '}
            {value === ApplicationTheme.Dark ? 'Dark' : 'Light'}
            {theme === value && <Check size={16} />}
          </span>
        </button>
      ))}
    </div>
  );
}
function BackupCount() {
  const enabled = useRecoilValue(autoBackupState);
  const [value, setValue] = useRecoilState(autoBackupCountState);
  return (
    <NumberPreference
      id="backupCount"
      value={value}
      onChange={setValue}
      min={1}
      disabled={!enabled}
    />
  );
}
function BackupActions() {
  const setSeriesList = useSetRecoilState(seriesListState);
  const [selectedSeries, setSelectedSeries] = useRecoilState(seriesState);
  const setChapters = useSetRecoilState(chapterListState);
  const [confirmation, setConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const restore = async () => {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      const paths: string[] = await ipcRenderer.invoke(
        ipc.APP.SHOW_OPEN_DIALOG,
        false,
        [{ name: 'Houdoku Backup', extensions: ['json'] }],
        'Select backup file',
      );
      if (!Array.isArray(paths)) throw Error('Picker failed');
      if (paths.length) {
        const content: string = await ipcRenderer.invoke(ipc.APP.READ_ENTIRE_FILE, paths[0]);
        restoreBackup(content);
        setSeriesList(library.fetchSeriesList());
        if (selectedSeries?.id) {
          setSelectedSeries(library.fetchSeries(selectedSeries.id) || undefined);
          setChapters(library.fetchChapters(selectedSeries.id));
        }
        setStatus('Library backup restored.');
      }
      setConfirmation(false);
    } catch {
      setError(
        'Could not restore the backup. Check that the file is a valid Houdoku backup and try again.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="settings-operation">
      <div className="settings-inline-actions">
        <Button
          variant="outline"
          disabled={busy}
          onClick={async () => {
            setError('');
            setStatus('');
            try {
              await createBackup();
              setStatus('Backup download started.');
            } catch {
              setError('Could not create a backup. Try again.');
            }
          }}
        >
          Create backup
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setError('');
            setConfirmation(true);
          }}
        >
          Restore…
        </Button>
      </div>
      {status && <p role="status">{status}</p>}
      {error && !confirmation && <p role="alert">{error}</p>}
      <Dialog
        open={confirmation}
        onOpenChange={(value) => {
          if (!busy) setConfirmation(value);
        }}
      >
        <DialogContent
          className="settings-action-dialog"
          onEscapeKeyDown={(e) => {
            if (busy) e.preventDefault();
          }}
        >
          <DialogTitle>Restore a backup?</DialogTitle>
          <DialogDescription>
            Choose a backup file to restore series and chapters. Read progress is retained from both
            libraries. Application preferences are not restored.
          </DialogDescription>
          {error && <p role="alert">{error}</p>}
          <div className="settings-inline-actions settings-confirm-actions">
            <Button variant="outline" disabled={busy} onClick={() => setConfirmation(false)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={restore}>
              {busy ? 'Restoring…' : 'Choose backup and restore'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export const generalPreferences: Preference[] = [
  {
    id: 'appearance',
    section: 'general',
    group: 'Appearance',
    title: 'Theme',
    description: 'Choose a light or dark appearance.',
    keywords: 'color colour mode',
    wide: true,
    control: <ThemePreference />,
  },
  togglePreference(
    'updates',
    'general',
    'Application',
    'Check for updates automatically',
    'Check for a new application version when Rensai starts.',
    autoCheckForUpdatesState,
  ),
  togglePreference(
    'autoBackup',
    'general',
    'Backups',
    'Daily backups',
    'Keep a local backup on days you use the app.',
    autoBackupState,
  ),
  {
    id: 'backupCount',
    section: 'general',
    group: 'Backups',
    title: 'Backups to keep',
    description: 'Older daily backups are removed at this limit. Turn on daily backups to edit.',
    control: <BackupCount />,
  },
  {
    id: 'backup',
    section: 'general',
    group: 'Backups',
    title: 'Manual backup',
    description: 'Export a backup or restore library data from an existing file.',
    control: <BackupActions />,
  },
];
