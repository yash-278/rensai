# Dependency and toolchain targets for the Houdoku successor

**Researched:** 2026-08-29
**Question:** What current, supported dependency and toolchain baseline should the successor adopt before product-roadmap work begins?

## Decision

Modernize to a deliberately current baseline, but do not mechanically install every package's `latest` tag.

- Use **Node 24 LTS, pnpm 11, Electron 44, electron-vite 5, Vite 7, TypeScript 6, React 19, Biome 2, and Tailwind CSS 4** as the modernization destination.
- Keep **Vite 8, TypeScript 7, pnpm 12, and TanStack Table 9** out of this baseline. Each is either incompatible with another chosen tool or too new to combine safely with an already large migration.
- Remove the inherited online-source, executable-plugin, tracker, Discord, and updater dependency trees before upgrading the retained application. They are outside the Personal Alpha and are responsible for substantial runtime and audit surface.
- Replace Recoil rather than “upgrading” it. Its repository is archived, and `0.7.7` remains its final release.
- Treat a clean install, a green build/typecheck/lint suite, a launchable macOS arm64 package, and **zero known critical/high production vulnerabilities** as modernization gates. A dependency bump alone does not make the application usable or secure.

This is a **current-supported** target, not a promise to freeze these exact patches forever. Resolve patch versions again when implementation begins, commit them in the single root lockfile, and review changelogs for any package that moved after this research date.

## Why “current-supported” is not “blindly latest”

- Node says production applications should use an Active or Maintenance LTS line. Node 24 is Active LTS through 2026-10-20 and supported through 2028-04-30; Node 26 is still Current. The appropriate development runtime is therefore **Node 24.20.0**, not Node 26. ([Node release policy and schedule](https://nodejs.org/en/about/previous-releases), [Release Working Group schedule](https://github.com/nodejs/Release#release-schedule))
- Electron supports only its latest three stable majors. As of the research date those are 42, 43, and 44; Electron 44 is stable and Electron 45 is alpha. Target the latest patched **44.x** release, currently `44.0.0`, while migrating one major at a time from 32. ([Electron release schedule](https://releases.electronjs.org/schedule), [Electron 44 release notes](https://www.electronjs.org/blog/electron-44-0), [Electron support policy](https://www.electronjs.org/docs/latest/tutorial/electron-timelines))
- `electron-vite@5.0.0` declares Vite peers only for Vite 5, 6, or 7. Vite 8 is therefore not a valid target until electron-vite declares compatibility. Use **Vite 7.3.6**. ([electron-vite 5 package metadata](https://www.npmjs.com/package/electron-vite/v/5.0.0), [electron-vite prerequisites](https://electron-vite.org/guide/), [Vite 8 migration](https://vite.dev/guide/migration.html))
- TypeScript 6 is explicitly the transition release for TypeScript 7. It keeps 5.9 API compatibility while surfacing deprecations that TypeScript 7 removes, including `baseUrl`, which this repository currently uses. Use **TypeScript 6.0.3**, remove the deprecated configuration, and only then assess TypeScript 7. ([TypeScript 6 release and migration notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html), [desktop tsconfig](../../../apps/desktop/tsconfig.json))
- pnpm 12 became stable on 2026-08-26 as a Rust rewrite, but the maintainers still leave npm's `latest` tag on pnpm 11 and document pnpm 12 separately. Use **pnpm 11.24.0** for this baseline; reassess 12 after the application is green. pnpm 11 requires Node 22 or newer, which Node 24 satisfies. ([pnpm installation and compatibility](https://pnpm.io/installation))
- TanStack Table `9.2.3` was published on 2026-08-28, one day before this research. Keep the mature **8.21.3** line during the modernization; Table 9 can be a later isolated decision if it offers a concrete benefit. ([TanStack Table package](https://www.npmjs.com/package/@tanstack/react-table))

## Repository baseline

The repository is approximately two years behind its platform baseline: Node is declared as `>=18`, pnpm is pinned to `9.0.0`, Electron to `^32.1.2`, electron-vite to `^2.3.0`, Vite to `^5.4.10`, TypeScript to 5.5/5.4, React to 18, and Biome to 1.9.4. ([root manifest](../../../package.json), [desktop manifest](../../../apps/desktop/package.json))

The dependency graph is also not canonical:

- [`apps/desktop/pnpm-lock.yaml`](../../../apps/desktop/pnpm-lock.yaml) is a second, desktop-only lockfile inside a pnpm workspace. It resolves different patch versions than the root lockfile and must be removed.
- The root [`pnpm-lock.yaml`](../../../pnpm-lock.yaml) still has importers for deleted `apps/docs-new` and `apps/docs-old`. These ghost importers add packages and vulnerabilities that cannot be reached from the current workspace.
- Build-only packages (`@biomejs/biome`, electron-vite, Vite, TypeScript) and type packages are listed as desktop runtime dependencies. React/Radix dependencies are duplicated between the desktop and UI packages. Dependency ownership should be corrected before the lockfile is regenerated.
- `packages/ui` should declare React and React DOM as peer dependencies (plus development copies for its own checking), while the desktop owns the runtime. Radix primitives belong in `packages/ui`; the desktop currently has no direct Radix imports.

The renderer currently depends on its unsafe legacy architecture: 34 renderer files directly `require('electron')`, seven require `fs` or `path`, and the Vite config injects Node polyfills for `fs`, `path`, streams, and zlib. The main window explicitly enables `nodeIntegration` and disables `contextIsolation`. This means removal of `vite-plugin-node-polyfills` is coupled to the typed preload/IPC migration, not a standalone version bump. ([electron-vite config](../../../apps/desktop/electron.vite.config.ts), [main window construction](../../../apps/desktop/src/main/index.ts), [Electron security checklist](https://www.electronjs.org/docs/latest/tutorial/security))

### Current audit baseline

An authoritative `pnpm audit --json` against the root lockfile on 2026-08-29 reported **6 critical, 75 high, 83 moderate, and 22 low** advisories. This is a contaminated count because the root lock still contains deleted workspace importers, but it establishes that the current lock cannot be accepted.

Confirmed direct/high-impact examples include:

- `electron-updater@4.6.5` is affected by a Windows code-signing bypass fixed in 6.3.0. The updater is outside the Personal Alpha, so removal is preferable to upgrading it now. ([GHSA-9jxc-qjr9-vjxq](https://github.com/advisories/GHSA-9jxc-qjr9-vjxq))
- Electron 32 is affected by multiple high-severity issues; examples are fixed only on much later supported lines, including a context-isolation bypass fixed in 39.8.9. ([GHSA-h7rp-cf8h-j98x](https://github.com/advisories/GHSA-h7rp-cf8h-j98x))
- `form-data@4.0.1` is affected by a critical unsafe-boundary advisory fixed in 4.0.4 and a high CRLF-injection advisory fixed in 4.0.6. The retained application can use the platform `FormData` instead. ([GHSA-fjxv-7rqg-78g4](https://github.com/advisories/GHSA-fjxv-7rqg-78g4), [GHSA-hmw2-7cc7-3qxx](https://github.com/advisories/GHSA-hmw2-7cc7-3qxx))
- The executable plugin/build tree pulls vulnerable `tar`; a critical decompression denial-of-service is fixed in 7.5.19. Removing `aki-plugin-manager` removes the Personal Alpha's direct plugin path. ([GHSA-23hp-3jrh-7fpw](https://github.com/advisories/GHSA-23hp-3jrh-7fpw))
- One critical Next.js advisory comes only from the deleted `apps/docs-old` lockfile importer, demonstrating why the lockfile must be rebuilt before audit findings are triaged. ([GHSA-f82v-jwr5-mffw](https://github.com/advisories/GHSA-f82v-jwr5-mffw))

## Target matrix

Versions are registry state observed on 2026-08-29.

| Area | Current | Modernization target | Rationale / migration constraint |
|---|---:|---:|---|
| Development Node | `>=18` | `24.20.0`, engines `>=24.20 <25` | Active LTS; aligns with Electron 44's Node 24 family and every selected tool. |
| pnpm | `9.0.0` | `11.24.0` | Stable npm `latest`; do not combine the new pnpm 12 rewrite with this migration. |
| Turbo | `2.3.3` | `2.10.12` | Current stable within the existing major; update schema/config and preserve task semantics. |
| Electron | `32.2.7` locked | latest patched `44.x` (`44.0.0` now) | Current stable security line; cross majors sequentially using Electron's breaking-change ledger. |
| electron-builder | `25.1.8` | `26.15.3` | Current builder line; remove the hard-coded `@electron/rebuild@3.7.0` override unless a reproduced native-module failure still requires one. |
| electron-vite | `2.3.0` | `5.0.0` | Current; `externalizeDepsPlugin()` is deprecated and default behavior replaces it. ([migration guide](https://electron-vite.org/guide/migration)) |
| Vite | `5.4.11` locked | `7.3.6` | Highest major accepted by electron-vite 5; Node 20.19+/22.12+ requirement is satisfied. Vite 8 is deferred. ([Vite 7 migration](https://v7.vite.dev/guide/migration)) |
| TypeScript | `5.5.4` locked | `6.0.3` | Transitional step that exposes config removals before TypeScript 7. |
| Biome | `1.9.4` | `2.5.11` | Upgrade first to Biome 2.0, run its migration, then advance to current 2.x; do not copy old v1 recommended-rule behavior blindly. ([Biome 2 migration](https://biomejs.dev/blog/biome-v2/), [Biome 2.1 sequencing note](https://biomejs.dev/internals/changelog/version/2-1-0/)) |
| Prettier | `3.3.3` locked | `3.9.6` or remove | Keep only if it formats file types Biome does not own; otherwise one formatter is simpler. |
| React / React DOM | `18.3.1` locked | `19.2.8` | First run on 18.3 warnings, replace Recoil, then use the official React 19 and types codemods. ([React 19 upgrade guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)) |
| React Router DOM | `6.28.0` locked | `7.18.2` | Adopt v7 future behavior on the latest v6 first, then move to v7 declarative mode; do not adopt framework mode without a product need. ([React Router v6 future flags](https://reactrouter.com/6.30.3/upgrading/future)) |
| Recoil | `0.7.7` | **replace; no target** | The owner archived the repository on 2025-01-01. Its 46 renderer import sites make this a migration, not a package update. ([archived Recoil repository/releases](https://github.com/facebookexperimental/Recoil/releases)) |
| TanStack React Table | `8.20.6` locked | `8.21.3` | Mature supported line; defer the one-day-old v9 major. |
| Tailwind CSS | `3.4.17` locked | `4.3.3` + `@tailwindcss/vite@4.3.3` | Use the Vite plugin; remove direct Autoprefixer/PostCSS if nothing else consumes them. Tailwind 4 changes config, utilities, defaults, and browser floor, so migrate separately with visual checks. ([Tailwind 4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide)) |
| UI helpers | older patches | Radix current 1.x/2.x set; `cmdk@1.1.1`; `lucide-react@1.37.0`; `tailwind-merge@3.6.0`; `clsx@2.1.1`; CVA `0.7.1` | Upgrade after React 19. Radix exact targets are listed below so one lock update can be reviewed. |
| Documentation app | VitePress `1.5.0`, Vue `3.5.13`, tabs `0.5.0` | Defer; if retained: `1.6.4`, `3.5.42`, `0.9.1` | The public docs site is outside the Personal Alpha. It must not block the desktop modernization. |

### Radix target set

The exact current stable set is: accordion `1.2.20`, alert-dialog `1.1.23`, checkbox `1.3.11`, collapsible `1.1.20`, context-menu `2.3.7`, dialog `1.1.23`, dropdown-menu `2.1.24`, label `2.1.15`, popover `1.1.23`, progress `1.1.16`, radio-group `1.4.7`, scroll-area `1.2.18`, select `2.3.7`, separator `1.1.15`, slider `1.4.7`, slot `1.3.3`, switch `1.3.7`, tabs `1.1.21`, toast `1.2.23`, toggle `1.1.18`, and tooltip `1.2.16`. These are registry targets, not a reason to change component behavior; review Radix release notes and run keyboard/focus regression checks. ([Radix packages](https://www.npmjs.com/org/radix-ui))

## Direct dependency disposition

### Retain and update

| Package | Target | Notes |
|---|---:|---|
| `electron-log` | `5.4.4` | Retain main-process logging; verify path and redaction behavior. |
| `jszip` | `3.10.1` | Retain ZIP/CBZ support and test malformed archives plus a representative fixture corpus. |
| `node-unrar-js` | `2.0.2` | No newer release exists. Isolate it behind the archive interface and treat it as a maintenance risk; test RAR fixtures and resource limits. |
| `mousetrap` | `1.6.5` | Current release; retain only for reader shortcuts unless native React keyboard handling can replace it cleanly. |
| `uuid` | `14.0.2` | Current package is ESM with conditional exports; update imports/build configuration together and remove `@types/uuid` because the package ships types. |
| `@tanstack/react-table` | `8.21.3` | Retain the mature v8 line for chapter tables. |
| Radix, `cmdk`, CVA, `clsx`, `lucide-react`, `tailwind-merge` | targets above | Keep in the UI package (except direct desktop icon usage) and eliminate duplicate declarations. |

Registry pages for the retained archive/runtime packages: [`electron-log`](https://www.npmjs.com/package/electron-log), [`jszip`](https://www.npmjs.com/package/jszip), [`node-unrar-js`](https://www.npmjs.com/package/node-unrar-js), [`mousetrap`](https://www.npmjs.com/package/mousetrap), [`uuid`](https://www.npmjs.com/package/uuid).

### Replace with platform functionality

- Replace `node-fetch` and `form-data` with Node 24/Electron's standards-compatible `fetch`, `Request`, `Response`, `Headers`, `FormData`, and `Blob`. Remove `@types/node-fetch` and `formdata-node`. Node documents global `fetch` as stable. ([Node globals](https://nodejs.org/api/globals.html#fetch))
- Replace `rimraf` in application code with `fs.promises.rm(path, { recursive: true, force: true })`; keep any transitive build-tool copy out of application ownership.
- Remove `core-js` and `regenerator-runtime`: the app targets a fixed current Chromium/Node runtime rather than legacy browsers.
- Remove `source-map-support` after verifying electron-vite production sourcemaps and Node/Electron source-map behavior; do not carry an application runtime shim solely because the old bootstrap imports it.
- Remove `electron-debug` unless a concrete development workflow still needs it; built-in Electron/Chromium developer tooling covers the baseline need.

### Remove with out-of-scope Personal Alpha features

- `aki-plugin-manager`, `@tiyo/common`, and `semver`: remove executable plugin installation and replace the 59 `@tiyo/common` import sites with successor-owned domain types. `aki-plugin-manager@1.3.3` was last published in 2022; it should not define the successor's security boundary. ([aki-plugin-manager repository](https://github.com/xgi/aki-plugin-manager))
- `discord-rpc` and `@types/discord-rpc`: Discord integration is out of scope.
- `electron-updater`: publishing/updating binaries is out of scope until the Public Release decision.
- `pkce-challenge`: tracker authentication is out of scope with trackers removed.
- `dmg-license`: no signed/public DMG is required for the Personal Alpha.

### Remove because unused or incorrectly owned

Repository import scanning found no source use for `browserslist-config-erb`, `bufferutil`, `formdata-node`, `history`, `html-react-parser`, `jsdom`, `utf-8-validate`, or `vite-plugin-electron-renderer`; remove them and their now-unneeded `@types/*` packages. Remove the Enzyme/React-16 types as well—there are no Enzyme tests in the repository. `@types/history` and `@types/uuid` are themselves deprecated registry packages because their libraries ship types.

`@biomejs/biome`, electron-vite, Vite, TypeScript, Electron, electron-builder, Tailwind tooling, and all `@types/*` packages are development dependencies, not packaged application dependencies. Only modules imported by built main/preload output should remain production dependencies; electron-vite's packaging guidance explicitly depends on getting that boundary right. ([electron-vite troubleshooting](https://electron-vite.org/guide/troubleshooting))

## Breaking migrations that must be planned, not hidden in one lockfile diff

1. **Electron 32 to 44:** migrate one Electron major at a time and consult the official ledger at each step. Electron explicitly recommends this method. Electron 44 also removes synchronous renderer clipboard access; expose narrow preload capabilities only where necessary. ([Electron breaking changes](https://www.electronjs.org/docs/latest/breaking-changes/))
2. **Renderer privilege removal:** `nodeIntegration: false`, `contextIsolation: true`, sandboxed renderers, a typed `contextBridge`, validated IPC senders/arguments, and no Node polyfills. This changes 34 direct Electron and seven direct filesystem/path renderer consumers.
3. **electron-vite 2 to 5:** remove `externalizeDepsPlugin()` because v5 externalizes by default; move the config to unambiguous ESM; use v5's isolated build where it supports sandbox-compatible preload output. ([electron-vite 5 release](https://electron-vite.org/blog/), [v5 migration](https://electron-vite.org/guide/migration))
4. **TypeScript 5 to 6:** remove deprecated `baseUrl`, examine changed defaults, and make module/target choices explicit. TypeScript 7 must wait until the 6.0 deprecation set is clean.
5. **Recoil replacement before React 19:** preserve observable library/reader/settings behavior and persistence semantics, then remove Recoil. React's own guide recommends using React 18.3 warnings before installing 19 and updating React types/codemods together.
6. **React Router 6 to 7:** update to the last v6, enable compatible future behavior, and then switch majors. Keep declarative routing; framework mode would add architecture without solving a Personal Alpha requirement.
7. **Tailwind 3 to 4:** run the official upgrade tool on an isolated change, move from JavaScript-first config to CSS/Vite integration, and visually test renamed utilities, border/ring defaults, Preflight, and interaction states.
8. **Native/ESM-sensitive packages:** rebuild and package-test `node-unrar-js`; update UUID's ESM imports; verify archive extraction on macOS arm64 before removing any rebuild override.

## Evidence-backed upgrade order

1. **Capture a behavior baseline.** Record smoke checks for local folder/archive import, library rendering, series/chapter navigation, reader layouts, reading progress, settings, and backup/restore. Add representative ZIP/CBZ/RAR and Houdoku backup fixtures before changing dependencies.
2. **Make the dependency graph truthful.** Remove the nested desktop lockfile, ghost root importers, duplicate declarations, unused packages, and incorrect dependency types. Regenerate only the root lockfile with a frozen package-manager pin.
3. **Cut out deferred product trees.** Remove executable extensions, online sources/downloads, trackers, Discord, updater, and public-docs build participation. Replace `@tiyo/common` with local domain contracts. Re-run audit; this gives the real retained surface.
4. **Secure the existing renderer boundary on the current stack.** Introduce the typed preload facade, move filesystem/Electron access out of the renderer, enable context isolation and sandboxing, disable Node integration, and remove renderer Node polyfills. This is a prerequisite for calling the upgraded Electron app secure.
5. **Upgrade the development foundation.** Node 24.20, pnpm 11.24, Turbo 2.10, Biome 2 (through its migration sequence), TypeScript 6.0.3, and manifest ownership cleanup. Make build, lint, and typecheck green before framework changes.
6. **Upgrade Electron/build tooling.** Walk Electron 33 through 44 one major at a time, then settle on electron-vite 5 + Vite 7 and electron-builder 26. Validate development launch and packaged launch at every meaningful breakpoint.
7. **Replace state/persistence, then upgrade React.** Use React 18.3 warnings, replace Recoil under behavioral tests, then move React/DOM/types to 19.2.8 and React Router to 7.18.2.
8. **Upgrade UI packages.** Radix patches, cmdk, Lucide, Tailwind Merge, and TanStack Table 8; then migrate Tailwind 4 in its own visually reviewed change. Do not mix this with the Electron security cutover.
9. **Update retained runtime packages and remove shims.** Move to platform fetch/FormData/fs APIs, update logging/archive/UUID dependencies, and prove archive and backup compatibility.
10. **Regenerate and attest the final baseline.** Run clean frozen install, full and production audits, lint, typecheck, build, unit/integration checks, offline core-flow smoke tests, and a packaged macOS arm64 launch. Record any remaining moderate/low development-only advisory with reachability and owner; accept no critical/high production advisory.

## Modernization completion gates

The application is ready for its actual product roadmap only when all of the following are true:

- One root `pnpm-lock.yaml`, no deleted importers, and `pnpm install --frozen-lockfile` succeeds from a clean checkout.
- Node and pnpm are explicitly pinned to the selected supported lines; package manifests agree on TypeScript/React versions and dependency ownership.
- `pnpm audit --prod` reports zero critical/high vulnerabilities; the full audit has no unexplained critical/high result.
- Renderer code has no direct Electron/Node/filesystem import, no Node-polyfill plugin, and the BrowserWindow uses context isolation, sandboxing, and no Node integration.
- Lint, typecheck, desktop build, and packaging are green with no deprecated-config suppression used as a permanent fix.
- The macOS arm64 Personal Alpha launches, works offline, and passes the captured local import/library/reader/progress/settings/backup smoke checks.
- ZIP/CBZ/RAR extraction and Houdoku backup import are verified against fixtures, with malformed inputs failing safely.
- No executable plugin, tracker, Discord, updater, telemetry, or required background-network dependency remains in the Personal Alpha bundle.

## Sources and method

Repository facts come from the checked-out manifests, both lockfiles, build configuration, and source import scan on branch `research/dependency-toolchain`. Version/deprecation metadata came from the authoritative npm registry via `pnpm outdated -r --format json` and `pnpm view ...`; vulnerability counts and paths came from the npm advisory service via `pnpm audit --json`. External compatibility and migration claims link directly to the owning projects' documentation, release notes, repositories, or advisories above.
