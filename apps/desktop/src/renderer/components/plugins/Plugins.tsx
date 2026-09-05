import { useEffect, useRef, useState } from 'react';
import {
  Search,
  Settings2,
  ChevronRight,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  RefreshCw,
  Puzzle,
} from 'lucide-react';
import { Button } from '@houdoku/ui/components/Button';
import { Input } from '@houdoku/ui/components/Input';
import { Switch } from '@houdoku/ui/components/Switch';
import { FieldHelp } from '@houdoku/ui/components/FieldHelp';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@houdoku/ui/components/Dialog';
import './sources.css';
import { Link } from 'react-router-dom';
import { ExtensionMetadata, SettingType } from '@tiyo/common';
import ipc from '@/common/constants/ipcChannels.json';
import { FS_METADATA } from '@/common/temp_fs_metadata';
import { LocalSourceProviderStatus } from '@/common/models/LocalSourceProviderStatus';
import {
  restoreSourceSettings,
  saveSourceSettings,
  SourceValues,
} from '@/renderer/services/sourceSettings';
import { Source, presentSource, setupNeeded, NHENTAI_ID, KOMGA_ID } from './sourcePresentation';
import routes from '@/common/constants/routes.json';
const { ipcRenderer } = require('electron');
type Action = { kind: 'select'; id: string } | { kind: 'close' | 'reload' };
export default function Plugins() {
  const [sources, setSources] = useState<Source[]>([]);
  const [selected, setSelected] = useState('');
  const source = sources.find((s) => s.id === selected);
  const [draft, setDraft] = useState<SourceValues>({});
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [revealed, setRevealed] = useState<string[]>([]);
  const [provider, setProvider] = useState<'loaded' | 'loading' | 'error'>('loading');
  const [status, setStatus] = useState<LocalSourceProviderStatus>({});
  const [providerError, setProviderError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [readingSettings, setReadingSettings] = useState(false);
  const [notice, setNotice] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [pending, setPending] = useState<Action | null>(null);
  const [narrow, setNarrow] = useState(() => matchMedia('(max-width: 1050px)').matches);
  const generation = useRef(0);
  const alive = useRef(true);
  const dirty = !!source && JSON.stringify(draft) !== JSON.stringify(source.values);
  const settingsError = source?.settingsError;
  const busy = saving || readingSettings || provider === 'loading';
  const readSource = async (metadata: ExtensionMetadata): Promise<Source> => {
    let types: Record<string, SettingType> = {};
    try {
      types = await ipcRenderer.invoke(ipc.EXTENSION.GET_SETTING_TYPES, metadata.id);
      const values: SourceValues = Object.keys(types).length
        ? await ipcRenderer.invoke(ipc.EXTENSION.GET_SETTINGS, metadata.id)
        : {};
      return presentSource(metadata, types, values);
    } catch {
      return { ...presentSource(metadata, types, {}), settingsError: true };
    }
  };
  const load = async (reload = false) => {
    const revision = ++generation.current;
    setProvider('loading');
    setNotice('');
    setSaveError('');
    setDetailOpen(false);
    try {
      if (reload) await ipcRenderer.invoke(ipc.EXTENSION_MANAGER.RELOAD);
      const currentStatus: LocalSourceProviderStatus | undefined = await ipcRenderer.invoke(
        ipc.EXTENSION_MANAGER.GET_LOCAL_PROVIDER_STATUS,
      );
      if (revision !== generation.current) return;
      setStatus(currentStatus || {});
      if (!currentStatus?.version || currentStatus.error)
        throw Error('The source provider could not be loaded. Check its setup, then try again.');
      const failedRestores = new Set(await restoreSourceSettings());
      const metadata: ExtensionMetadata[] = await ipcRenderer.invoke(ipc.EXTENSION_MANAGER.GET_ALL);
      const loaded = await Promise.all(
        metadata.filter((item) => item.id !== FS_METADATA.id).map(readSource),
      );
      if (revision !== generation.current) return;
      loaded.forEach((item) => {
        if (failedRestores.has(item.id)) item.settingsError = true;
      });
      setSources(loaded);
      const chosen =
        loaded.find((s) => s.id === selected) ||
        loaded.find((s) => s.id === NHENTAI_ID) ||
        loaded[0];
      setSelected(chosen?.id || '');
      setDraft(chosen?.values || {});
      setRevealed([]);
      setProvider('loaded');
      setProviderError('');
      if (reload) setNotice('Sources reloaded.');
    } catch {
      if (revision !== generation.current) return;
      setProvider('error');
      setProviderError(
        'The source provider or its settings could not be loaded. Check its setup, then try again.',
      );
    }
  };
  useEffect(() => {
    alive.current = true;
    load();
    return () => {
      alive.current = false;
      generation.current += 1;
    };
  }, []);
  useEffect(() => {
    const media = matchMedia('(max-width: 1050px)');
    const update = () => setNarrow(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const shown = sources.filter(
    (s) =>
      `${s.name} ${s.domain} ${s.language}`.toLowerCase().includes(query.toLowerCase().trim()) &&
      (filter === 'all' || (filter === 'settings' ? s.fields.length > 0 : setupNeeded(s))),
  );
  const perform = (action: Action) => {
    setRevealed([]);
    setSaveError('');
    setNotice('');
    if (action.kind === 'select') {
      const next = sources.find((s) => s.id === action.id);
      if (!next) return;
      setSelected(next.id);
      setDraft(next.values);
      setDetailOpen(true);
    } else if (action.kind === 'close') {
      setDraft(source?.values || {});
      setDetailOpen(false);
    } else load(true);
  };
  const request = (action: Action) => {
    if (busy) return;
    if (dirty) setPending(action);
    else perform(action);
  };
  const retrySettings = async () => {
    if (!source || busy) return;
    const revision = generation.current;
    setReadingSettings(true);
    try {
      const metadata: ExtensionMetadata = await ipcRenderer.invoke(
        ipc.EXTENSION_MANAGER.GET,
        source.id,
      );
      const loaded = await readSource(metadata);
      if (!alive.current || revision !== generation.current) return;
      setSources((old) => old.map((s) => (s.id === loaded.id ? loaded : s)));
      setDraft(loaded.values);
    } catch {
      /* Keep the visible settings error and its retry action. */
    } finally {
      if (alive.current) setReadingSettings(false);
    }
  };
  const save = async () => {
    if (!source || busy || !dirty) return;
    const id = source.id;
    setSaving(true);
    setNotice('');
    setSaveError('');
    try {
      const applied = await saveSourceSettings(id, draft);
      if (!alive.current) return;
      setSources((old) => old.map((s) => (s.id === id ? { ...s, values: applied } : s)));
      setDraft(applied);
      setRevealed([]);
      setNotice('Settings saved.');
    } catch (error) {
      if (!alive.current) return;
      setSaveError(
        error instanceof Error && error.message.startsWith('Settings applied for this session,')
          ? error.message
          : 'Your edits are still here. Try saving again.',
      );
    } finally {
      if (alive.current) setSaving(false);
    }
  };
  const details = () =>
    source ? (
      <>
        <header className="sources-detail-header">
          <div className="sources-detail-heading">
            <div>
              {narrow ? (
                <DialogTitle className="text-section-title">{source.name}</DialogTitle>
              ) : (
                <h2 className="text-section-title" id="source-heading">
                  {source.name}
                </h2>
              )}
              <p className="text-caption text-muted-foreground mt-1">{source.domain}</p>
            </div>
            <span className="sources-tag">
              {source.fields.length ? 'Source settings' : 'Source details'}
            </span>
          </div>
          {narrow && (
            <DialogDescription className="sr-only">
              Settings for {source.name}. Changes apply when you save.
            </DialogDescription>
          )}
        </header>
        <div className="sources-detail-scroll">
          <div className="sources-availability">
            <Check size={16} />
            <span>Source loaded</span>
            <span className="text-muted-foreground">Website not checked</span>
          </div>
          {settingsError ? (
            <div className="sources-message is-error" role="alert">
              <CircleAlert />
              <div>
                <h3 className="font-medium">Settings could not be loaded</h3>
                <p>Try loading this source's settings again.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retrySettings}
                  disabled={readingSettings}
                >
                  Retry settings
                </Button>
              </div>
            </div>
          ) : source.fields.length ? (
            <>
              {source.id === NHENTAI_ID && (
                <div className="sources-context">
                  <h3 className="font-medium">Access to nhentai</h3>
                  <p className="text-muted-foreground mt-1">
                    Add your API key here if the source asks you to authenticate.
                  </p>
                  <p className="sources-key-state">
                    {source.values['API Key']
                      ? 'Key saved. Access has not been verified.'
                      : 'No API key saved.'}
                  </p>
                </div>
              )}
              {source.id === KOMGA_ID && (
                <div className="sources-context">
                  <h3 className="font-medium">Connect your library server</h3>
                  <p className="text-muted-foreground mt-1">
                    Add your server address and account details to browse your collection.
                  </p>
                </div>
              )}
              <div className="sources-fields">
                {source.fields.map((field) => (
                  <div
                    key={field.key}
                    className={`sources-field ${field.kind === 'boolean' ? 'is-toggle' : ''}`}
                  >
                    <div className="sources-field-label">
                      <label htmlFor={field.inputId}>{field.label}</label>
                      {field.help && (
                        <FieldHelp
                          label={field.label}
                          descriptionId={`help-${field.inputId}`}
                          text={field.help}
                        />
                      )}
                    </div>
                    {field.kind === 'unsupported' ? (
                      <p className="text-muted-foreground">
                        This setting type is not supported by this app.
                      </p>
                    ) : field.kind === 'boolean' ? (
                      <Switch
                        id={field.inputId}
                        checked={!!draft[field.key]}
                        onCheckedChange={(value) =>
                          setDraft((old) => ({ ...old, [field.key]: value }))
                        }
                        aria-describedby={field.help ? `help-${field.inputId}` : undefined}
                        disabled={busy}
                      />
                    ) : (
                      <div className="sources-input-row">
                        <Input
                          id={field.inputId}
                          type={
                            field.kind === 'secret' && !revealed.includes(field.key)
                              ? 'password'
                              : 'text'
                          }
                          value={String(draft[field.key] || '')}
                          placeholder={field.example}
                          autoComplete="off"
                          spellCheck={false}
                          aria-describedby={field.help ? `help-${field.inputId}` : undefined}
                          disabled={busy}
                          onChange={(e) =>
                            setDraft((old) => ({ ...old, [field.key]: e.target.value }))
                          }
                        />
                        {field.kind === 'secret' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`${revealed.includes(field.key) ? 'Hide' : 'Show'} ${field.label.toLowerCase()}`}
                            onClick={() =>
                              setRevealed((old) =>
                                old.includes(field.key)
                                  ? old.filter((k) => k !== field.key)
                                  : [...old, field.key],
                              )
                            }
                          >
                            {revealed.includes(field.key) ? <EyeOff /> : <Eye />}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="sources-no-settings">
              <Settings2 />
              <h3 className="text-section-title">No settings needed</h3>
              <p>This source has no configurable options. You can browse it from Add series.</p>
              <Button asChild variant="outline">
                <Link to={routes.SEARCH}>Go to Add series</Link>
              </Button>
            </div>
          )}
          <dl className="sources-facts">
            <div>
              <dt>Language</dt>
              <dd>{source.language}</dd>
            </div>
            <div>
              <dt>Provider</dt>
              <dd>Rensai Sources</dd>
            </div>
          </dl>
          {saveError && (
            <div className="sources-message is-error" role="alert">
              <CircleAlert />
              <div>
                <h3 className="font-medium">Changes could not be saved</h3>
                <p>{saveError}</p>
              </div>
            </div>
          )}
        </div>
        <footer className="sources-detail-footer">
          <p role="status" className="text-caption text-muted-foreground">
            {saving
              ? 'Saving settings…'
              : dirty
                ? 'Unsaved changes'
                : notice ||
                  (source.fields.length
                    ? 'Changes apply when you save.'
                    : 'No configuration required.')}
          </p>
          {source.fields.length > 0 && !settingsError && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={!dirty || busy}
                onClick={() => {
                  setDraft(source.values);
                  setRevealed([]);
                  setSaveError('');
                }}
              >
                Cancel
              </Button>
              <Button disabled={!dirty || busy} onClick={save}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          )}
        </footer>
      </>
    ) : null;
  return (
    <>
      <main className="sources-page">
        <header className="sources-page-header">
          <div>
            <h1 className="text-page-title">Sources</h1>
            <p className="text-muted-foreground mt-1">Find a source and manage how you connect.</p>
          </div>
          <Button variant="outline" disabled={busy} onClick={() => request({ kind: 'reload' })}>
            <RefreshCw className={provider === 'loading' ? 'animate-spin' : ''} />
            {provider === 'loading' ? 'Reloading…' : 'Reload sources'}
          </Button>
        </header>
        <section
          className={`sources-provider ${provider === 'error' ? 'is-error' : ''}`}
          aria-label="Source provider"
        >
          <div className="sources-provider-icon">
            {provider === 'error' ? <CircleAlert /> : <Puzzle />}
          </div>
          <div>
            <p className="font-medium">
              Rensai Sources{' '}
              <span className="text-caption text-muted-foreground">
                {status.version || 'Not loaded'}
              </span>
            </p>
            <p className="text-caption text-muted-foreground">
              {provider === 'error'
                ? providerError
                : provider === 'loading'
                  ? 'Loading sources and saved settings…'
                  : `${sources.length} sources loaded. Website availability is checked when you browse.`}
            </p>
          </div>
          <span className="sources-provider-state">
            {provider === 'loading' ? (
              'Loading…'
            ) : provider === 'error' ? (
              'Needs attention'
            ) : (
              <>
                <Check size={16} />
                Loaded
              </>
            )}
          </span>
        </section>
        {provider === 'error' ? (
          <section className="sources-provider-error" role="alert">
            <h2 className="text-section-title">Load your sources to continue</h2>
            <p>Your library and downloaded chapters are still available.</p>
            <details>
              <summary>Setup details</summary>
              <p>
                Development startup could not find Rensai Sources. Run the source-enabled
                development command, then reload.
              </p>
              <code>pnpm --dir apps/desktop dev:sources</code>
            </details>
            <Button onClick={() => load(true)}>Try again</Button>
          </section>
        ) : provider === 'loading' ? (
          <div className="sources-provider-error" role="status">
            Loading sources…
          </div>
        ) : !sources.length ? (
          <div className="sources-provider-error">
            <h2 className="text-section-title">No sources available</h2>
            <p>The provider loaded without any website sources.</p>
            <Button onClick={() => load(true)}>Reload sources</Button>
          </div>
        ) : (
          <div className="sources-workspace" aria-busy={readingSettings}>
            <section className="sources-catalog" aria-label="Source catalog">
              <div className="sources-catalog-controls">
                <div className="sources-search">
                  <Search size={16} />
                  <Input
                    aria-label="Search sources"
                    placeholder="Name or language…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className="sources-filters" aria-label="Source filters" role="group">
                  {[
                    ['all', 'All'],
                    ['settings', 'With settings'],
                    ['setup', 'Needs setup'],
                  ].map(([key, label]) => (
                    <button key={key} aria-pressed={key === filter} onClick={() => setFilter(key)}>
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-caption text-muted-foreground">{shown.length} sources</p>
              </div>
              <div className="sources-list" tabIndex={0} aria-label="Sources">
                {shown.length ? (
                  shown.map((s) => (
                    <button
                      className="sources-row"
                      key={s.id}
                      aria-label={`Configure ${s.name}`}
                      aria-pressed={selected === s.id}
                      disabled={busy}
                      onClick={() => {
                        if (s.id !== selected || narrow) request({ kind: 'select', id: s.id });
                      }}
                    >
                      <span className="sources-monogram" aria-hidden="true">
                        {s.name.slice(0, 1)}
                      </span>
                      <span className="sources-row-copy">
                        <strong>{s.name}</strong>
                        <span>{s.language}</span>
                        <small className={setupNeeded(s) ? 'text-warning' : ''}>
                          {s.settingsError
                            ? 'Settings unavailable'
                            : setupNeeded(s)
                              ? 'Server address needed'
                              : s.id === NHENTAI_ID
                                ? s.values['API Key']
                                  ? 'API key saved'
                                  : 'API key not set'
                                : s.fields.length
                                  ? 'Settings available'
                                  : 'No settings needed'}
                        </small>
                      </span>
                      <ChevronRight size={16} />
                    </button>
                  ))
                ) : (
                  <div className="sources-empty">
                    <h2 className="font-medium">No matching sources</h2>
                    <p>Try another name or language.</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQuery('');
                        setFilter('all');
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </div>
            </section>
            {!narrow && (
              <section className="sources-detail" aria-labelledby="source-heading">
                {details()}
              </section>
            )}
          </div>
        )}
      </main>
      {narrow && (
        <Dialog
          open={detailOpen && provider !== 'error'}
          onOpenChange={(open) => {
            if (!open && !busy) request({ kind: 'close' });
          }}
        >
          <DialogContent
            className="sources-mobile-detail"
            onOpenAutoFocus={(event) => {
              const input = document.querySelector<HTMLInputElement>(
                '.sources-mobile-detail input',
              );
              if (input) {
                event.preventDefault();
                input.focus();
              }
            }}
            onInteractOutside={(e) => e.preventDefault()}
          >
            {details()}
          </DialogContent>
        </Dialog>
      )}
      <Dialog
        open={!!pending}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
      >
        <DialogContent className="sources-discard">
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription>Your edits to {source?.name} have not been saved.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Keep editing
            </Button>
            <Button
              onClick={() => {
                const action = pending!;
                setPending(null);
                perform(action);
              }}
            >
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
