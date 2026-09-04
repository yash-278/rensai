> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Inherited security boundary and advisory remediation

**Research date:** 2026-08-29

**Scope:** Local Content Personal Alpha

**Repository baseline:** `a0c69348d5d3cf018bb6d127de86c63434913d14`

## Decision summary

The inherited application is not a safe base to feature-build on. Dependency modernization must be a **pre-roadmap stabilization gate**, but version bumps alone are insufficient: the current renderer is an unsandboxed Node process, privileged IPC accepts renderer-supplied paths without sender or argument validation, the custom content protocol can resolve arbitrary paths, and downloaded packages are evaluated in the main process. The Personal Alpha should first become a local-only application with a sandboxed renderer, a small typed preload API, main-owned file capabilities, bounded archive handling, no executable plugins, no trackers/Discord/online sources, and no updater.

The active product should keep the local reader behavior, not the Tiyo execution model. Delete the plugin installer/loader and its UI/dependencies from the shipping tree. Refactor the filesystem “extension” into a first-party local-library service and replace `@tiyo/common` types with local domain types. Preserve the old online-source implementation only through the upstream repository and an immutable commit reference; leaving disabled executable code in the active tree creates an attractive path for accidental reactivation.

As of 2026-08-29, Electron 44.0.0 is the latest stable release, while this repository resolves Electron 32.x. Electron supports only the latest three stable majors; therefore 32 is far outside support. Upgrade one major at a time for migration/testing, but do not declare the gate complete until the app runs on the current supported stable line and the exact version is locked. [Electron 44 release](https://www.electronjs.org/blog/electron-44-0), [Electron support policy](https://www.electronjs.org/docs/latest/tutorial/electron-timelines), [current release list](https://releases.electronjs.org/)

## Security objective and trust model

The Personal Alpha is an offline desktop reader for user-selected folders and archives. “Local” does not mean trusted: a CBZ/CBR/ZIP/RAR may have been downloaded from an untrusted source, filenames and metadata are attacker-controlled bytes, and a legacy Houdoku backup may contain unexpected fields. The design should treat these as untrusted inputs even when the user explicitly selects them.

Trust zones:

1. **Trusted:** signed packaged main/preload code, the app-owned data directory, and explicit in-memory capability records created by a native file picker.
2. **Untrusted:** renderer DOM/state, all local content and archives, imported backup JSON, filenames/symlinks, and any URL or text inherited from old data.
3. **Absent from the Personal Alpha:** remote content sources, trackers, Discord, telemetry, background requests, automatic updates, and executable third-party plugins.
4. **Development-only:** a loopback Vite server may be allowed by an explicit development policy. Production must not inherit that network allowance.

Security goals:

- Compromise of renderer JavaScript must not yield Node/Electron access or arbitrary IPC.
- Opening malformed or hostile local content must not read/write outside the user-selected root or app-owned cache, execute code, or consume unbounded memory/disk/CPU.
- The Personal Alpha must make no network request unless a later decision explicitly introduces one.
- Legacy plugin code and tracker credentials must never be executed or imported into the successor.
- A distributed public release is a later gate and must be signed, notarized where required, and use a successor-owned update channel.

## Reachable inherited attack surfaces

| Surface | Current evidence and reachability | Risk | Required disposition |
| --- | --- | --- | --- |
| Renderer privilege | The main window explicitly sets `nodeIntegration: true` and `contextIsolation: false`; enabling Node integration also disables renderer sandboxing. The nominal preload is an empty placeholder and is not configured on the window. Renderer modules directly import `electron` and `fs`. [window configuration](../../../apps/desktop/src/main/index.ts#L59), [empty preload](../../../apps/desktop/src/preload/index.ts#L1), [renderer IPC import](../../../apps/desktop/src/renderer/services/ipc.tsx#L1), [renderer filesystem writes](../../../apps/desktop/src/renderer/services/downloader.ts#L1) | **Critical.** Any renderer code execution becomes host code execution with the user’s privileges. | Set `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`; remove Node polyfills and every renderer `require`; expose only narrow methods through `contextBridge`. Electron recommends context isolation and sandboxing and warns that Node integration disables the sandbox. [Electron security checklist](https://www.electronjs.org/docs/latest/tutorial/security), [sandboxing](https://www.electronjs.org/docs/latest/tutorial/sandbox), [context isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation) |
| IPC boundary | Handlers do not validate `event.sender`/`senderFrame` or input shapes. Several accept arbitrary paths or path-influencing objects: recursive walk and whole-file read, list/delete/write operations, and renderer-selected download roots. [generic file handlers](../../../apps/desktop/src/main/index.ts#L192), [filesystem handlers](../../../apps/desktop/src/main/services/filesystem.ts#L17), [path-derived delete](../../../apps/desktop/src/main/util/filesystem.ts#L139) | **Critical after any renderer compromise; high as an architectural defect.** The renderer can read, write, enumerate, or recursively delete outside intended roots. | Validate the exact top-frame app origin and `webContents` identity for every call; validate all payloads; expose use-case methods instead of raw IPC or paths. Electron says all IPC senders should be validated because frames and child windows can send messages. [Electron security checklist](https://www.electronjs.org/docs/latest/tutorial/security#17-validate-the-sender-of-all-ipc-messages) |
| Local content protocol | `atom` is registered with `supportFetchAPI` but no `corsEnabled`; its handler decodes caller-controlled URL text and turns it into `file://...`. Reader page URLs embed absolute paths in `atom://`. [scheme registration and handler](../../../apps/desktop/src/main/index.ts#L42), [reader path URLs](../../../apps/desktop/src/renderer/components/reader/ReaderPage.tsx#L176) | **High.** It is an arbitrary-path file broker with no root check or opaque capability. Electron <39.8.10 is also affected by a 2026 cross-origin read advisory for precisely the `supportFetchAPI` without `corsEnabled` configuration when untrusted content is loaded. [Electron advisory GHSA-v3j7-r9gq-3gjw](https://github.com/electron/electron/security/advisories/GHSA-v3j7-r9gq-3gjw) | Replace it. Serve the UI from a secure standard `app://` origin. Serve reader assets from a separate scheme using opaque library/chapter/page IDs resolved by the main process under an authorized root. Do not put paths in URLs; do not enable `supportFetchAPI` unless required; if enabled, set `corsEnabled` and validate origin. [Electron protocol API](https://www.electronjs.org/docs/latest/api/protocol), [custom scheme flags](https://www.electronjs.org/docs/latest/api/structures/custom-scheme) |
| Navigation and external launch | New windows are denied, but every requested URL is first passed to `shell.openExternal`; there is no protocol/host allowlist and no `will-navigate`/`will-frame-navigate` denial. Tracker-provided URLs reach a `_blank` anchor. [window-open handler](../../../apps/desktop/src/main/index.ts#L107), [tracker URL anchor](../../../apps/desktop/src/renderer/components/library/tracker/SeriesTrackerPage.tsx#L226) | **High.** Untrusted schemes can reach OS protocol handlers, and the main frame is not locked to the app origin. | Deny all navigation away from the application origin, including frame navigation. External opening must be a typed preload method accepting only parsed `https:` URLs on a small allowlist; reject credentials, non-default ports unless required, and every other scheme. Electron explicitly warns against passing untrusted URLs to `shell.openExternal`. [Electron security checklist](https://www.electronjs.org/docs/latest/tutorial/security#15-do-not-use-shellopenexternal-with-untrusted-content), [navigation events](https://www.electronjs.org/docs/latest/api/web-contents#event-will-navigate) |
| Runtime plugin installation and execution | The renderer can request an arbitrary package name/version for installation. Startup scans the writable plugins directory and invokes `aki.load(..., eval('require'))`; loaded code constructs `TiyoClient` in the main process. [loader](../../../apps/desktop/src/main/services/extension.ts#L24), [installer IPC](../../../apps/desktop/src/main/services/extension.ts#L298) | **Critical by design.** Installed package code executes with full main-process Node privileges. Package compromise, registry compromise, or local plugin-directory tampering is host code execution. | Delete from the active product; see “Plugin disposition.” Do not attempt to sandbox this model inside the Personal Alpha. |
| Updater and distribution identity | `electron-updater` is active and targets the original `xgi/houdoku` GitHub repository. macOS builds explicitly disable hardened runtime, identity, signing, and Gatekeeper assessment. [updater handlers](../../../apps/desktop/src/main/services/updater.ts#L6), [build/publish configuration](../../../apps/desktop/package.json#L17) | **High/critical if enabled.** The successor could trust the original update channel; the resolved old updater has known signing/redirect advisories; unsigned builds have no publisher integrity. | Remove updater code, dependency, settings, and manifest from Personal Alpha. Do not publish binaries. Reintroduce only after successor identity, signed artifacts, notarization, protected release provenance, and an owned update endpoint are decided. Electron recommends signing distributed apps and notes auto-update signing requirements. [Electron code signing](https://www.electronjs.org/docs/latest/tutorial/code-signing), [electron-updater signing bypass](https://github.com/electron-userland/electron-builder/security/advisories/GHSA-9jxc-qjr9-vjxq) |
| Archive parsing | ZIP is read fully before extraction; all entries are streamed in parallel with no count/size/ratio limits. RAR is read fully and extracted into memory. Both flatten names to `basename`, allowing collisions/overwrites inside the job directory; extension, not file signature, selects the parser. [archive implementation](../../../apps/desktop/src/main/util/archives.ts#L10) | **High availability risk; medium integrity risk.** A chosen archive can exhaust memory/disk/CPU or cause ambiguous page replacement. `basename` limits direct traversal in this implementation but is not a resource or collision defense. | Enforce file magic, compressed-size, entry-count, per-entry, cumulative uncompressed-byte, ratio, depth, and time limits; reject encrypted, link, special, duplicate/colliding, and unsupported entries; use one job directory and deterministic generated filenames; clean it after use. Prefer a maintained streaming parser. If RAR cannot meet the same limits, defer RAR/CBR rather than weakening the gate. |
| Filesystem traversal | `walk()` uses synchronous recursion and `stat`, follows directory symlinks, and has no depth/file-count limit. IPC exposes arbitrary directory listing and deletion paths. [walk/list](../../../apps/desktop/src/main/util/filesystem.ts#L11), [filesystem IPC](../../../apps/desktop/src/main/services/filesystem.ts#L17) | **High.** Symlink escape/cycles and large trees can cross roots or freeze the main process; arbitrary path IPC magnifies impact. | Keep path ownership in main. Canonicalize both root and candidate with `realpath`, reject anything outside the authorized root, use `lstat` and do not follow symlinks by default, apply traversal limits, and move blocking work off the main event loop. Deletes must accept an opaque library/chapter ID and resolve the path internally. |
| Backup and legacy credentials | Backup serializes all of `localStorage`, while tracker tokens are also stored and read from renderer storage. Restore parses unbounded JSON and spreads legacy objects into current domain objects. [backup](../../../apps/desktop/src/renderer/util/backup.ts#L8), [tracker token load](../../../apps/desktop/src/renderer/services/ipc.tsx#L32) | **High confidentiality risk for inherited tracker credentials; medium integrity/availability risk.** | Import only an explicit schema of library/progress/settings fields with size and item-count limits. Drop extension settings, plugin records, tracker tokens, updater state, and unknown keys. Export the same allowlist, never the browser storage wholesale. |
| CSP and permissions | Renderer HTML has no CSP. No permission request/check handlers are installed. [renderer HTML](../../../apps/desktop/src/renderer/index.html#L1) | **Medium defense gap that compounds all renderer defects.** | Production CSP should default-deny (`default-src 'self'`; no object/frame/form/base; narrowly allow local image scheme and data/blob only if needed). Deny all Chromium permission requests/checks for the offline alpha. Keep any Vite development exceptions separate. [Electron security checklist](https://www.electronjs.org/docs/latest/tutorial/security) |

## Live dependency/advisory snapshot

Commands were run in the isolated worktree on 2026-08-29 against the npm registry:

```text
pnpm audit --prod
pnpm audit --prod --json
pnpm view electron version
pnpm view electron-updater version
pnpm view jszip version
pnpm view node-unrar-js version
pnpm view aki-plugin-manager version
pnpm view vite version
```

The workspace production audit reported **160 advisories: 6 critical, 65 high, 72 moderate, 17 low**. Filtering advisory paths to `apps__desktop` left **121 advisories: 5 critical, 49 high, 55 moderate, 12 low**. These are inventory counts, not 121 independently proven runtime exploits: build tools and type packages are incorrectly listed as production dependencies, and audit paths do not prove a bundled function is exercised. The result is still a release blocker, and several buckets map directly to reachable code:

| Desktop dependency path | Advisory count | Reachability judgment and remediation |
| --- | ---: | --- |
| `browserslist-config-erb > electron` | 33 (8 high) | Electron 32 is both obsolete and used to run the app. Delete the obsolete ERB configuration and upgrade the direct Electron dependency to the current supported stable line. The 2026 audit includes advisories directly relevant to this design, including custom-protocol cross-origin reads and context-isolation bypasses. Upgrading fixes framework defects; boundary changes are still mandatory. [Electron advisories](https://github.com/electron/electron/security/advisories) |
| `vite-plugin-node-polyfills` | 32 (3 critical, 7 high) | The plugin exists to support Node-shaped imports in the renderer, exactly the architecture being removed. Delete it and renderer `fs/path` usage rather than patching its large browserify graph. Audit highlights include `pbkdf2` and `sha.js`; reachability of each algorithm is not established, so do not overstate them as current exploits. |
| `aki-plugin-manager` | 20 (1 critical, 14 high) | Directly reachable by install/reload and unnecessary for Personal Alpha. Delete it. Its `tar` chain contains multiple traversal/overwrite/DoS advisories, including the current critical unbounded decompression advisory. [node-tar advisories](https://github.com/isaacs/node-tar/security/advisories), [GHSA-23hp-3jrh-7fpw](https://github.com/advisories/GHSA-23hp-3jrh-7fpw) |
| `electron-updater` | 6 (4 high, 2 moderate) | Directly reachable from settings/startup. Remove for Personal Alpha. The installed `^4.6.1` line is covered by the Windows code-signing bypass fixed in 6.3.0+; later advisories also exist in its utility chain, so a future reintroduction must use a current audited version and signed artifacts. [manifest](../../../apps/desktop/package.json#L165), [GHSA-9jxc-qjr9-vjxq](https://github.com/electron-userland/electron-builder/security/advisories/GHSA-9jxc-qjr9-vjxq) |
| `form-data`, `jsdom`, `discord-rpc` and tracker/network chains | Multiple critical/high | Their active use belongs to online integrations excluded from Personal Alpha. Delete unused runtime paths and packages first; update any genuinely retained build/test package afterward. |
| Vite/electron-vite/build chains | Multiple high/moderate | Build-time, not packaged runtime, once dependencies are classified correctly. Upgrade them, move them to `devDependencies`, bind the development server to loopback, and audit the full graph as a CI gate. Vite advisories include dev-server file-read/request issues, which matter on developer machines. |

The manifest currently mixes application runtime, build tooling, types, test remnants, online integrations, and unused packages in `dependencies`, and the repository tracks both a root and desktop lockfile. [dependency manifest](../../../apps/desktop/package.json#L117), [desktop lockfile](../../../apps/desktop/pnpm-lock.yaml), [root lockfile](../../../pnpm-lock.yaml). Modernization should establish one root lockfile, classify dependencies correctly, remove unused packages, regenerate from a clean install, and then audit the resulting graph. Do not use a blanket forced audit fix: delete excluded capabilities and upgrade direct owners intentionally.

Current registry checks returned Electron `44.0.0`, electron-updater `6.8.9`, JSZip `3.10.1`, node-unrar-js `2.0.2`, aki-plugin-manager `1.3.3`, and Vite `8.2.2`. These numbers are a dated snapshot, not a permanent target. Electron’s policy is the latest three stable major lines and only the latest minor within each line; the project therefore needs a recurring update cadence rather than another one-time pin. [Electron support policy](https://www.electronjs.org/docs/latest/tutorial/electron-timelines)

## Plugin disposition

### Delete from the active tree

- `aki-plugin-manager`, the runtime `eval('require')` loader, install/uninstall/list/reload IPC, the hidden spoof window, plugin settings/UI, plugin directory path IPC, and all automatic startup scanning.
- Tiyo-specific manager/client dispatch and online extension calls/channels.
- The updater, tracker, Discord, online downloader/source paths, and associated renderer settings/components for Personal Alpha.
- Node polyfills and renderer Node/Electron imports.

### Retain by refactoring, not by keeping the plugin system

- Local folder/archive discovery, chapter ordering, and page reading are first-party product behavior. Move them out of `FSExtensionClient` into a local library/import module with successor-owned domain types and the file/archive constraints above. [current filesystem extension](../../../apps/desktop/src/main/services/extensions/filesystem.ts#L27)

### Quarantine legacy user data

- A successor identity should use a new application ID and new `userData` location, so old Houdoku plugins are not discovered automatically.
- If migration encounters an old `plugins` directory, never enumerate it through a package manager and never `require` anything from it. Leave it in place or move it atomically to a clearly named `legacy-plugins-quarantine` location only after explicit user confirmation; record that it was ignored. Do not copy it into the successor profile.
- Do not import extension settings or tracker credentials from backups. Report them as intentionally skipped.

### Reference only

Use the upstream repository at commit `a0c69348d5d3cf018bb6d127de86c63434913d14` (and normal Git history) as the executable-code reference. If future product planning needs a capability inventory, write a non-executable design note that links to upstream files. Do not keep a disabled plugin subtree in the production source graph.

## Remediation baseline before the product roadmap

The order matters because later work must not be built on the current privilege model.

1. **Freeze the Personal Alpha boundary.** Remove/disable all network startup work immediately. Delete plugin execution and updater entry points before running or importing legacy data. Establish the new product/app ID so it gets a clean profile.
2. **Prune the active product.** Remove online sources, trackers, Discord, downloads, updater, executable plugin UI/services, and their dependencies. Refactor the local filesystem reader out of Tiyo types. Keep attribution to Houdoku in README/license documentation; attribution does not require preserving its runtime identity or update channel.
3. **Upgrade the foundation.** Move through Electron majors with the official breaking-change notes and finish on the current supported stable line (44.x at this snapshot). Upgrade Node/pnpm/tooling and every retained direct dependency, eliminate the nested lockfile, and make a clean immutable install/build reproducible. Electron explicitly recommends migrating one major at a time. [Electron security guidance](https://www.electronjs.org/docs/latest/tutorial/security#16-use-a-current-version-of-electron)
4. **Install the privilege boundary.** Use a secure custom app origin; sandboxed, context-isolated, Node-free renderer; narrow typed preload; sender/top-frame/origin validation; payload schemas and bounds; deny-by-default permissions/navigation/network; and a production CSP. Never expose `ipcRenderer` itself through `contextBridge`. [contextBridge warning](https://www.electronjs.org/docs/latest/tutorial/context-isolation#security-considerations)
5. **Install file capabilities.** Native picker grants a main-owned opaque library ID. Renderer sees display metadata and IDs, not absolute paths. Main resolves every read/delete under the canonical authorized root, rejects symlinks/escapes, and applies traversal limits. App-owned cache writes are resolved internally.
6. **Harden archive and migration ingestion.** Apply magic/type and resource limits; reject risky entries; isolate each job; schema-validate and bound backups; import only local library/progress/settings fields; explicitly skip credentials/plugins.
7. **Establish security gates.** After a clean install, require `pnpm audit --prod` to report zero known production advisories and the full audit to report zero unreviewed high/critical advisories. Any exception must name the package, reachability, owner, expiry, and compensating control. Add automated dependency updates, lockfile integrity checks, an SBOM, and secret scanning.
8. **Defer distribution trust.** Personal Alpha may run locally from source. Public binaries wait for successor-owned signing identities, macOS hardened runtime/notarization, Windows signing, protected CI provenance, tamper-resistant packaging, and a separately reviewed update design. For packaged releases, evaluate Electron fuses including disabling `RunAsNode` and `NodeCliInspect`, enabling embedded ASAR integrity validation, and only loading the app from ASAR. [Electron fuses](https://www.electronjs.org/docs/latest/tutorial/fuses), [Electron code signing](https://www.electronjs.org/docs/latest/tutorial/code-signing)

## Acceptance tests for the stabilization gate

- Production renderer has no `require`, `process`, `ipcRenderer`, Node built-ins, or arbitrary filesystem API; its exposed API matches a reviewed key list.
- An iframe, unexpected frame/origin, or second window cannot invoke any privileged operation. Unknown IPC methods and malformed/oversized arguments fail closed.
- Main and frame navigation remain on the packaged app origin. `file:`, `javascript:`, `data:`, custom, credential-bearing, and non-allowlisted external URLs are denied. The application makes no production network requests.
- Attempts to turn `/etc/passwd`, a sibling temporary directory, a symlink escape, `..`, encoded separators, or a raw absolute path into a reader URL or IPC argument fail. Tests use disposable synthetic paths, not real user data.
- Archive corpus covers traversal names, absolute names, links, duplicate/case/Unicode collisions, encrypted entries, excessive depth/count/size/ratio, truncated inputs, and parser crashes. Failure cleans only that job directory and keeps the UI/main process responsive.
- Legacy backup tests prove plugin settings, updater state, unknown keys, and tracker tokens are rejected/skipped while library/progress fields migrate.
- A clean production install/build from the single lockfile passes type/lint/build/smoke checks and the advisory gates. The packaged dependency inventory contains no build/test-only packages.
- Security settings are asserted at runtime or integration-test level: sandbox enabled, context isolation enabled, Node integration disabled, permissions denied, CSP present, and production DevTools/debug switches off.

## Residual decisions and explicit non-goals

- Exact archive limits (compressed bytes, expanded bytes, entry count, ratio, depth, and timeout) need a product/data-size decision; the security requirement is that every dimension has a finite tested bound.
- RAR/CBR support is conditional on proving equivalent limits and failure isolation. It is acceptable to ship ZIP/CBZ plus folders first if the current RAR library cannot provide them safely.
- This research does not select the durable library database, backup format, successor name, signing provider, or future online-source architecture.
- “Zero known advisories” is a dated release condition, not a claim that software is vulnerability-free. Staying current requires automated checks and an owner/cadence after the modernization gate closes.

## Primary sources

- Inherited repository code/configuration linked inline, baseline commit `a0c69348d5d3cf018bb6d127de86c63434913d14`.
- Live npm registry audit and version metadata, queried 2026-08-29 with the commands above.
- [Electron security checklist](https://www.electronjs.org/docs/latest/tutorial/security)
- [Electron release/support policy](https://www.electronjs.org/docs/latest/tutorial/electron-timelines) and [release schedule](https://releases.electronjs.org/schedule)
- [Electron 44.0.0 release](https://releases.electronjs.org/release/v44.0.0)
- [Electron protocol API](https://www.electronjs.org/docs/latest/api/protocol) and [custom-scheme flags](https://www.electronjs.org/docs/latest/api/structures/custom-scheme)
- [Electron custom-protocol advisory GHSA-v3j7-r9gq-3gjw](https://github.com/electron/electron/security/advisories/GHSA-v3j7-r9gq-3gjw)
- [Electron/electron advisories](https://github.com/electron/electron/security/advisories)
- [electron-updater advisory GHSA-9jxc-qjr9-vjxq](https://github.com/electron-userland/electron-builder/security/advisories/GHSA-9jxc-qjr9-vjxq)
- [node-tar advisories](https://github.com/isaacs/node-tar/security/advisories)
- [Electron code-signing guidance](https://www.electronjs.org/docs/latest/tutorial/code-signing) and [fuses](https://www.electronjs.org/docs/latest/tutorial/fuses)
