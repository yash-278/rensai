# Sources

Status: the approved design is implemented in the production Sources page. The sidebar label changed from Plugins to Sources; the existing route and source IDs remain unchanged.

Run `pnpm --filter @houdoku/desktop design:preview` and open `/sources.html`. The review renders the real component and settings service with synthetic provider IPC and sample settings in the browser's review profile. It does not connect to websites or use the desktop application's credentials. Use sample values when reviewing.

## Layout and interactions

The searchable catalog and selected source's settings share one workspace. Both scroll independently. Save/Cancel remains outside the settings scroll area. Below 1050 pixels, settings open in a dialog with the same fixed actions. The first text field receives focus without automatically opening help.

Search matches name, domain, and language. Filters show all sources, sources with settings, or sources needing setup. API keys and passwords have explicit secret-field descriptors and are masked by default. Reveal resets after saving, cancelling, or switching sources. Help beside the field label remains available after typing.

Save changes applies only the selected source. Cancel restores its last loaded values. Switching sources, closing the settings dialog, or reloading sources prompts before discarding unsaved edits. Those prompts cover actions inside this page; general app navigation is unchanged.

Settings-load errors remain visible on the affected source and offer retry. Save failures retain the draft. Provider errors give recovery guidance, and providers with no website sources get an explicit empty state. Sources without settings explain that no configuration is needed and link to Add series.

## Provider and persistence behavior

Rensai remains the sole website provider. Filesystem import stays outside the website-source catalog. Provider loading is separate from website availability, and a configured API key is not proof of successful authentication. No connection-test operation or online-status claim was added.

Known source IDs map nhentai's API key, Komga's address/account fields, and MangaDex's data-saver setting to their presentation. Other string and boolean fields retain their original labels and values; unsupported types are identified rather than silently hidden. Missing nhentai keys are neutral because the current client sends a key only when configured. Komga's missing server address identifies incomplete setup.

Startup and the page share a restoration promise that waits for all setting writes. Reload first reloads the provider, then restores saved settings, then reads the catalog and values. A failed restoration marks the affected source's settings unavailable while keeping other sources accessible. Retrying settings reads the provider's current values for review.

Saving applies settings through IPC, reads back provider normalization, and writes the selected source to its existing local-storage key. A rejected provider save never persists the draft. If settings apply but local persistence fails, the UI explains that they apply only for this session and offers another save. Masking inputs does not change the inherited local-storage persistence mechanism or imply encryption.

Main-process setting operations now reject on failure with generic messages instead of swallowing errors. The renderer does not log setting values. Pending loads are invalidated on unmount or replacement so stale responses cannot replace the current page. Provider reload no longer fires an unawaited settings-restoration event.

## Verification

```sh
pnpm --filter @houdoku/desktop test:source-settings
pnpm --filter @houdoku/desktop test:sources
pnpm --filter @houdoku/desktop check-types
pnpm --filter @houdoku/desktop build
pnpm --filter @houdoku/desktop design:check
```

Four settings-service tests cover shared restoration, awaiting writes, isolation of corrupt/rejected settings, selected-source persistence, provider normalization, and rejection/storage failures. All three loader tests also passed with `RENSAI_SOURCES_PATH` set to the existing local provider build, including loading its 34 sources.

The rendered Sources check covers real persistence with synthetic values, reload restoration, per-source writes, storage failure, masking/help, save/cancel, unsaved-edit prompts, search/filters, provider/settings/save errors, retry, fixed actions, and 640/360-pixel dialogs. It runs in hidden Electron with a disposable profile and blocks remote requests. All six rendered design checks passed, along with preview/application types, the desktop build, and targeted lint.

These checks do not validate live website access or the user's API key. General Settings remains the next page migration.
