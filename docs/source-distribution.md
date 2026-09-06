# Source updates and desktop packaging

Rensai Sources remains a separate repository with its own versioned releases. The desktop carries a bootstrap copy and installs updates in `<userData>/rensai-sources`. Routine website fixes need a source release, not a new desktop release.

## Use a source update

Open **Sources → Update sources**. The app downloads the latest stable bundle from `yash-278/rensai-sources`, verifies it, and stages it for use. Finish any active downloads, then choose **Reload sources**, or restart the app. Saved source settings stay in the existing profile and are restored on reload/startup.

A local `RENSAI_SOURCES_PATH` override remains available in development. It takes precedence over installed bundles, and the update action directs developers to rebuild that checkout instead of replacing it.

The app accepts provider API version 1. A release with an incompatible API asks for a desktop update. Failed downloads or validation leave the previous version selected. Source bundles are trusted JavaScript; the fixed GitHub repository is the distribution authority. Checksums check integrity, not a separate publisher signature.

## Package a desktop build

Build the provider with `pnpm bundle` in the source repository. Then, from the app repository:

```sh
RENSAI_SOURCES_BUNDLE=/absolute/path/to/rensai-sources/dist/release pnpm --filter @houdoku/desktop pack:mac
```

Without `RENSAI_SOURCES_BUNDLE`, preparation downloads the latest published provider bundle. Before the first source release, use the explicit local bundle directory. The provider includes its own locked runtime dependencies; desktop dependencies do not supply its runtime.

The `dist:mac`, `dist:win`, and `dist:linux` commands also prepare sources before packaging. Direct electron-builder invocation checks that preparation was performed. The app installs the bootstrap provider under `resources/rensai-sources`.

Run a packaged smoke check with:

```sh
pnpm --filter @houdoku/desktop smoke:packaged /absolute/path/to/Rensai.app/Contents/MacOS/Rensai
```

This uses a disposable profile and synthetic local pages. It checks bundled sources through renderer IPC, reload, local reading, and backup export/restore. The existing downloader tests cover queue behavior and failure recovery. These checks do not certify every live website, tracker authentication, Discord, or an actual app-update installation.

## Identity and release boundary

The application ID is `com.yashkadam.rensai`; display name is Rensai. The existing `Houdoku` profile directory is retained so libraries and browser sessions remain available. `RENSAI_USER_DATA_DIR` accepts an absolute path for isolated validation.

Desktop update assets point to `yash-278/rensai`. macOS targets include both DMG and ZIP, the latter needed for updater distribution. Signing remains disabled in the inherited development configuration. A public signed release still needs signing/notarization setup and a real update-path test. Packaging or pushing these changes does not publish a desktop release.

The workspace-root `@electron/rebuild` override fixes the observed Python `distutils` failure during native-module packaging. Its former nested placement was ignored by pnpm.

## Verification on 6 September 2026

- Provider: 25 tests passed; the standalone bundle initialized 34 sources outside either checkout.
- Desktop: 22 tests passed, including the real built provider, updater failure cases, source settings, downloads, and profile identity. Build, lint, and type checks passed.
- An unsigned macOS arm64 app built both in a clean temporary checkout and in the working checkout.
- The packaged smoke passed against the working-checkout artifact. It loaded 34 website sources plus local files, installed a synthetic next provider version without replacing the desktop executable, restored source settings on reload, read synthetic local pages, and exported/restored a library backup.
- The packaged application ID is `com.yashkadam.rensai`. No source or desktop release was published by these checks. Live website compatibility and signed desktop update installation were not tested.
