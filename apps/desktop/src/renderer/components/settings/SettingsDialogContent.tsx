import { useEffect, useRef, useState } from 'react';
import { BookOpen, Check, Keyboard, Library, Link2, Search, Settings2, X } from 'lucide-react';
import { Button } from '@houdoku/ui/components/Button';
import { Input } from '@houdoku/ui/components/Input';
import {
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@houdoku/ui/components/Dialog';
import { generalPreferences } from './SettingsGeneral';
import { libraryPreferences } from './SettingsLibrary';
import { readerPreferences } from './SettingsReader';
import { shortcutPreferences } from './SettingsKeybinds';
import { trackerPreferences } from './SettingsTrackers';
import { integrationPreferences } from './SettingsIntegrations';
import './settings.css';
export enum SettingsPage {
  General = 'General',
  Library = 'Library',
  Reader = 'Reader',
  Keybinds = 'Keybinds',
  Trackers = 'Trackers',
  Integrations = 'Integrations',
}
const sections = [
  {
    id: 'general',
    page: SettingsPage.General,
    name: 'General',
    icon: Settings2,
    intro: 'Make Rensai feel at home.',
  },
  {
    id: 'library',
    page: SettingsPage.Library,
    name: 'Library',
    icon: Library,
    intro: 'Manage your collection and where downloads live.',
  },
  {
    id: 'reader',
    page: SettingsPage.Reader,
    name: 'Reader',
    icon: BookOpen,
    intro: 'Choose how pages fit, flow, and turn.',
  },
  {
    id: 'shortcuts',
    page: SettingsPage.Keybinds,
    name: 'Shortcuts',
    icon: Keyboard,
    intro: 'Select a shortcut, then press a key combination. Escape cancels editing.',
  },
  {
    id: 'trackers',
    page: SettingsPage.Trackers,
    name: 'Trackers',
    icon: Check,
    intro: 'Connect a list service, then link individual series from their Trackers menu.',
  },
  {
    id: 'integrations',
    page: SettingsPage.Integrations,
    name: 'Integrations',
    icon: Link2,
    intro: 'Choose what Rensai shares with other apps.',
  },
];
const fields = [
  ...generalPreferences,
  ...libraryPreferences,
  ...readerPreferences,
  ...shortcutPreferences,
  ...trackerPreferences,
  ...integrationPreferences,
];
export function SettingsDialogContent({
  defaultPage = SettingsPage.General,
}: { defaultPage?: SettingsPage }) {
  const [section, setSection] = useState(sections.find((item) => item.page === defaultPage)!.id);
  const [query, setQuery] = useState('');
  const body = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (body.current) body.current.scrollTop = 0;
  }, [section, query]);
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const searching = terms.length > 0;
  const visible = fields.filter((field) =>
    searching
      ? terms.every((term) =>
          `${field.title} ${field.description || ''} ${field.keywords || ''} ${field.group} ${sections.find((s) => s.id === field.section)?.name}`
            .toLocaleLowerCase()
            .includes(term),
        )
      : field.section === section,
  );
  const groups = [...new Set(visible.map((field) => `${field.section}:${field.group}`))];
  const active = sections.find((item) => item.id === section)!;
  const go = (id: string) => {
    setSection(id);
    setQuery('');
  };
  return (
    <DialogContent
      className="settings-dialog"
      onOpenAutoFocus={(e) => {
        e.preventDefault();
        search.current?.focus();
      }}
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      onKeyPress={(e) => e.stopPropagation()}
      onEscapeKeyDown={(e) => {
        if (
          document.activeElement?.getAttribute('data-recording') === 'true' ||
          document.activeElement?.matches('.settings-number input')
        )
          e.preventDefault();
      }}
    >
      <header className="settings-header">
        <div>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Set up your reading experience.</DialogDescription>
        </div>
        <div className="settings-search">
          <Search size={16} aria-hidden="true" />
          <Input
            ref={search}
            aria-label="Search settings"
            placeholder="Search settings…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Clear settings search"
              onClick={() => {
                setQuery('');
                search.current?.focus();
              }}
            >
              <X size={16} />
            </Button>
          )}
        </div>
      </header>
      <div className="settings-layout">
        <nav className="settings-navigation" aria-label="Settings sections">
          {sections.map(({ id, name, icon: Icon }) => (
            <button
              type="button"
              key={id}
              aria-current={!searching && section === id ? 'page' : undefined}
              onClick={() => go(id)}
            >
              <Icon size={17} />
              <span>{name}</span>
              {searching && <small>{visible.filter((field) => field.section === id).length}</small>}
            </button>
          ))}
          <p>
            Preferences apply
            <br />
            automatically.
          </p>
        </nav>
        <div className="settings-mobile-nav">
          <label htmlFor="settings-section">Section</label>
          <select
            id="settings-section"
            className="settings-select"
            value={searching ? 'results' : section}
            onChange={(e) => go(e.target.value)}
          >
            {searching && <option value="results">Search results</option>}
            {sections.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div
          className="settings-scroll"
          ref={body}
          tabIndex={0}
          role="region"
          aria-label={searching ? 'Settings search results' : `${active.name} preferences`}
        >
          <div className="settings-section-heading">
            <h2>{searching ? 'Search results' : active.name}</h2>
            <p>
              {searching
                ? `${visible.length} ${visible.length === 1 ? 'setting' : 'settings'} matching “${query.trim()}”`
                : active.intro}
            </p>
          </div>
          {visible.length === 0 ? (
            <div className="settings-empty">
              <Search size={24} />
              <h3>No settings found</h3>
              <p>Try a preference such as “backups”, “page width”, or “shortcuts”.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setQuery('');
                  search.current?.focus();
                }}
              >
                Clear search
              </Button>
            </div>
          ) : (
            groups.map((group) => (
              <section className="settings-group" key={group} aria-label={group.split(':')[1]}>
                <h3>
                  {searching
                    ? `${sections.find((item) => item.id === group.split(':')[0])?.name} / `
                    : ''}
                  {group.split(':')[1]}
                </h3>
                {visible
                  .filter((field) => `${field.section}:${field.group}` === group)
                  .map((field) => (
                    <div
                      className={`settings-row ${field.wide ? 'settings-row-wide' : ''}`}
                      key={field.id}
                      data-preference={field.id}
                    >
                      <div className="settings-row-copy">
                        <div className="settings-row-title" id={`${field.id}-label`}>
                          {field.title}
                        </div>
                        {field.description && (
                          <p id={`${field.id}-description`}>{field.description}</p>
                        )}
                      </div>
                      <div className="settings-row-control">{field.control}</div>
                    </div>
                  ))}
              </section>
            ))
          )}
        </div>
      </div>
      <footer className="settings-footer">
        <div>Preferences apply automatically.</div>
        <DialogClose asChild>
          <Button>Done</Button>
        </DialogClose>
      </footer>
    </DialogContent>
  );
}
