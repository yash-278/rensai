import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@houdoku/ui/components/Button';
import { Input } from '@houdoku/ui/components/Input';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@houdoku/ui/components/Dialog';
import ipc from '@/common/constants/ipcChannels.json';
import keys from '@/common/constants/storeKeys.json';
import store from '@/renderer/util/persistantStore';
import type { TrackerMetadata } from '@/common/models/types';
const { ipcRenderer } = require('electron');

export function TrackerAccount({
  metadata,
  passwordAuth = false,
}: { metadata: TrackerMetadata; passwordAuth?: boolean }) {
  const [username, setUsername] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    Promise.all([
      ipcRenderer.invoke(ipc.TRACKER.GET_USERNAME, metadata.id),
      passwordAuth ? Promise.resolve({}) : ipcRenderer.invoke(ipc.TRACKER.GET_AUTH_URLS),
    ])
      .then(([name, urls]: [string | null, Record<string, string>]) => {
        if (active) {
          setUsername(name);
          setUrl(urls[metadata.id] || '');
        }
      })
      .catch(() => {
        if (active) setLoadError('Could not load account details.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [metadata.id, passwordAuth, attempt]);
  const close = () => {
    setOpen(false);
    setCode('');
    setPassword('');
    setUser('');
    setError('');
  };
  const submit = async () => {
    setBusy(true);
    setError('');
    const storageKey = `${keys.TRACKER_ACCESS_TOKEN_PREFIX}${metadata.id}`;
    let previous: string | null = null;
    let changed = false;
    try {
      previous = store.read(storageKey);
      const token: string | null = username
        ? ''
        : await ipcRenderer.invoke(
            ipc.TRACKER.GET_TOKEN,
            metadata.id,
            passwordAuth ? JSON.stringify({ username: user.trim(), password }) : code.trim(),
          );
      if (!username && !token) throw Error('Authentication failed');
      changed = true;
      await ipcRenderer.invoke(ipc.TRACKER.SET_ACCESS_TOKEN, metadata.id, token);
      const name: string | null = username
        ? null
        : await ipcRenderer.invoke(ipc.TRACKER.GET_USERNAME, metadata.id);
      if (!username && !name) throw Error('Authentication failed');
      store.write(storageKey, token);
      setUsername(name);
      close();
    } catch {
      let restored = true;
      if (changed) {
        try {
          await ipcRenderer.invoke(ipc.TRACKER.SET_ACCESS_TOKEN, metadata.id, previous || '');
        } catch {
          restored = false;
        }
      }
      setError(
        restored
          ? username
            ? 'Could not disconnect. Try again.'
            : 'Could not connect. Check your credentials and try again.'
          : 'Could not update the account. Close Settings and reopen it to check the connection before retrying.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="settings-account">
      <span role="status">
        {loading
          ? 'Loading account…'
          : loadError || (username ? `Connected as ${username}` : 'Not connected')}
      </span>
      {loadError ? (
        <Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>
          Retry
        </Button>
      ) : (
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => {
            setError('');
            setOpen(true);
          }}
        >
          {username ? 'Disconnect' : 'Connect'}
        </Button>
      )}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy && !value) close();
        }}
      >
        <DialogContent
          className="settings-action-dialog"
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <DialogTitle>
            {username ? 'Disconnect' : 'Connect'} {metadata.name}
            {username ? '?' : ''}
          </DialogTitle>
          <DialogDescription>
            {username
              ? 'Reading progress will stop syncing to this account.'
              : passwordAuth
                ? 'Sign in with your MangaUpdates account.'
                : 'Authorize Rensai in your browser, then paste the access code provided by the tracker.'}
          </DialogDescription>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!busy) void submit();
            }}
          >
            {!username &&
              (passwordAuth ? (
                <div className="settings-account-fields">
                  <label htmlFor={`tracker-user-${metadata.id}`}>Username</label>
                  <Input
                    id={`tracker-user-${metadata.id}`}
                    autoComplete="username"
                    value={user}
                    disabled={busy}
                    onChange={(event) => setUser(event.target.value)}
                  />
                  <label htmlFor={`tracker-password-${metadata.id}`}>Password</label>
                  <Input
                    id={`tracker-password-${metadata.id}`}
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    disabled={busy}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
              ) : (
                <div className="settings-account-fields">
                  {url ? (
                    <Button variant="outline" asChild>
                      <a href={url} target="_blank" rel="noreferrer">
                        Authorize on {metadata.name}
                        <ExternalLink size={16} />
                      </a>
                    </Button>
                  ) : (
                    <p role="alert">
                      Authorization link unavailable. Close this dialog and reopen Settings to
                      retry.
                    </p>
                  )}
                  <label htmlFor={`tracker-code-${metadata.id}`}>Access code</label>
                  <Input
                    id={`tracker-code-${metadata.id}`}
                    type="password"
                    autoComplete="off"
                    value={code}
                    disabled={busy}
                    onChange={(event) => setCode(event.target.value)}
                  />
                </div>
              ))}
            {error && <p role="alert">{error}</p>}
            <div className="settings-inline-actions settings-confirm-actions">
              <Button type="button" variant="outline" disabled={busy} onClick={close}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  busy || (!username && (passwordAuth ? !user.trim() || !password : !code.trim()))
                }
              >
                {busy ? 'Updating…' : username ? 'Disconnect account' : 'Connect account'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
