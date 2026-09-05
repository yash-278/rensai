# Settings implementation

Settings now uses the approved dialog layout in production. The dashboard and reader retain their existing entry points, including the reader's default Reader section.

Open `/settings.html` on the design preview server to review the real Settings dialog with synthetic filesystem and tracker IPC. Preference changes use the real Recoil persistence path in the isolated review profile. No user application profile, live account, or downloaded file is accessed.

## Layout and behavior

The header, search, section navigation, and Done button remain outside the scrolling preferences. Narrow windows use a section selector. Long download paths wrap in full. The layout uses the existing tokens and shared Button, Input, Switch, and Dialog components.

Search finds editable preferences across all six sections, including section names and useful synonyms. Selecting a section clears search. Search does not call source APIs. Tracker account details load only when their controls are rendered.

| Section | Preferences |
| --- | --- |
| General | Light/dark theme, update checks, daily backup retention, create and restore backup |
| Library | Startup refresh, removal confirmation, cover cropping, download folder and reset |
| Reader | Single/double/long-strip pages, gaps, offsets, direction, image sizing, width limit and unit, contrast |
| Shortcuts | All 14 reader bindings, explicit capture and individual reset |
| Trackers | Automatic progress, AniList, MyAnimeList, MangaUpdates |
| Integrations | Discord Rich Presence and navigation to Sources |

Existing preference atoms, storage keys, defaults, and enum values are preserved. Ordinary choices save immediately. Numeric values commit on blur or Enter only when valid; Escape restores the last value. Shortcut capture starts with an explicit click. Escape cancels, Tab moves on, and combinations retain the reader's Mousetrap encoding. Keyboard events inside Settings do not trigger underlying reader shortcuts.

Reader dependencies remain intact: page gaps require double pages or long strips, offsets require double pages, and stretching requires at least one fit option. Changing width units clamps the current value to the supported range.

## File and account operations

Create backup calls the existing export function. Restore asks for confirmation before opening the native JSON picker, then invokes the existing library restoration function and refreshes library state. Restoration merges series and chapters and retains read progress from both libraries. It does not restore application preferences. Invalid or unreadable files show a retryable message.

The download folder uses the existing native directory picker and default-path IPC. Cancel retains the current setting. Selection errors are visible and retryable. Changing folders does not move downloaded files.

AniList and MyAnimeList retain browser authorization plus access-code entry. MangaUpdates retains username/password authentication. Account credentials are masked and cleared when the dialog closes. Connection completion waits for token assignment and username verification before persisting the token. Failed verification restores the previous token in the main process. Disconnect requires confirmation. Account-loading and action errors have visible retry paths; errors do not print credentials.

Source credentials remain on Sources. The link closes Settings and navigates through the existing router.

## Verification

The desktop and design preview type checks and builds pass, along with targeted lint. The hidden Electron check uses a disposable profile and blocks HTTP/HTTPS requests. It covers:

- Editable cross-section search, themes, empty results, and preference persistence across renderer reload.
- Numeric validation, reader dependencies, shortcut capture/cancel/reset, and the Reader entry point.
- Fixed header/footer geometry and internal scrolling at desktop, 640 × 480, and 360 × 420 sizes.
- Native picker responses, cancellation, error/retry, long paths, backup export intent, invalid restore and successful synthetic library restoration.
- Tracker connection, disconnect, invalid token, failed username verification and rollback, and both authentication methods.
- Sources navigation through the actual router.

Screenshots are written under the OS temporary directory in `rensai-design-review`. The check is included in `design:check`:

```sh
pnpm --filter @houdoku/desktop design:build
pnpm --filter @houdoku/desktop exec electron design-system/check-settings.cjs
```

These checks validate application behavior against synthetic IPC responses. They do not verify live tracker availability, native OS dialogs, or a real backup on disk. Existing backup format and storage behavior are retained; this migration does not add transactional restore or change automatic backup scheduling.
