# Local source provider

As of 2026-09-06, Rensai Sources is the app's only website-source provider. This is a development integration, not a public package release or a website-compatibility claim.

## Checkouts

- App: `/Users/yash/Personal/houdoku`, branch `rensai`.
- Provider: `/Users/yash/Personal/rensai-sources`, branch `rensai-provider`, based on Tiyo commit `84e75a3d6afe73cc698da86a45f45f81f50e067a`.
- Provider package: `@rensai/sources@0.1.0`, distributed as an independent bundle. It is not published to npm.

The provider retains Tiyo's history, MIT license, and source interfaces. It now has 34 source entries after the ten approved deletion candidates were removed. The remaining source IDs are unchanged; registration alone does not certify website compatibility.

## Loading rules

`pnpm --filter @houdoku/desktop dev:sources` loads the built sibling provider. `RENSAI_SOURCES_PATH` can specify another absolute build directory. See the provider's `docs/local-development.md` for build instructions.

The app loads only the Rensai provider and the filesystem source. It does not discover, install, update, or load the original provider. Saved library entries and source settings keep their inherited source IDs. The loader does not overwrite an old provider package or user data.

Reload clears the selected provider build from the module cache and asks the renderer to restore saved source settings. The app snapshots each provider's registry so source clients survive repeated reads.

An invalid or missing build appears as an error in Extensions. The filesystem source remains available. Development startup requires `dev:sources` or an explicit `RENSAI_SOURCES_PATH`. A packaged app includes a bootstrap provider at `resources/rensai-sources`. Independently installed source releases take precedence. See [source distribution](source-distribution.md) for packaging and update commands.

Loading this provider executes trusted local JavaScript in the main process. The integration does not add a sandbox or resolve inherited plugin-trust, package-installation, update, or dependency-security issues.

## Verification

The local checks passed with Node 24.19.0 and Electron 32.2.7:

- Provider build and two tests covering the inherited registry and settings retention.
- Three application tests covering the Rensai registry snapshot, reload cache scope, invalid paths, and the real built provider.
- Desktop typecheck and production build.
- Targeted lint for the changed TypeScript and React files.
- An Electron smoke check using a temporary profile and a hidden window. The actual source service and handler functions returned 44 provider entries plus local files, retained settings, reloaded, requested settings restoration, and returned to filesystem-only operation after opt-out.

The smoke check invokes the registered handler functions directly. It confirms that opting out leaves only the filesystem source and reports the missing Rensai provider. It does not exercise renderer transport, visible UI interactions, live websites, or a user's library.

Run the application checks from its checkout:

```sh
RENSAI_SOURCES_PATH=/Users/yash/Personal/rensai-sources/dist/libs/core pnpm --filter @houdoku/desktop test:sources
pnpm --filter @houdoku/desktop smoke:sources
pnpm --filter @houdoku/desktop check-types
pnpm --filter @houdoku/desktop build
```

The smoke command creates and removes a disposable profile. The `dev:sources` command uses the normal development profile.

## Next work

The provider now includes website repairs from the [5 September 2026 source audit](../../rensai-sources/docs/source-audit-2026-09-05.md). The audit covers all 44 inherited entries and records 13 sampled HTTP passes. At the user's request, the ten deletion candidates and their implementations have been removed, leaving 34 sources. Existing library data was not deleted or migrated. The provider build and 21 tests, plus the three application loader tests, passed after these repairs. Remaining site-access blockers are listed in the audit.

Rebuild the sibling provider and select **Reload sources** to load the changes. Bundling and explicit source updates are implemented. Dependency auditing and unattended source updates remain separate work.

nhentai now uses its official v2 API. Generate a key in [nhentai account settings](https://nhentai.net/user/settings#apikeys), then enter it under **Source settings → nhentai → API Key** and select **Save settings**. See the provider’s [setup and verification notes](../../rensai-sources/docs/nhentai-api.md).
