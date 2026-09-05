> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Electron and Local Content security boundary

Status: superseded — historical reference only
Captured: 2026-08-29

## Decision

Rensai Personal Alpha uses a conventional hardened Electron split: the main process owns windows, SQLite, native dialogs, filesystem grants, archive ingestion, backups, and lifecycle; a context-isolated preload exposes a small typed capability API; and the renderer is a sandboxed web application with no Node, Electron, SQL, path, shell, or generic IPC access.

Delete the inherited executable Extension system and every deferred integration from the active product. Git history and the pinned upstream commit are sufficient migration reference. Do not retain dormant loaders, package installers, Online Source clients, tracker/updater/Discord handlers, the spoof window, or writable plugin directories in the shipping tree.

## Process and window model

- One visible `BrowserWindow` for Personal Alpha. Remove the hidden spoof/plugin window.
- `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, `webSecurity: true`.
- A single statically declared preload bundle using `contextBridge`.
- No remote module, Node polyfills, renderer `require`, renderer filesystem access, or renderer-native database binding.
- Main-process work uses asynchronous APIs. Large discovery/archive/image checks run through bounded jobs off the event loop; workers receive only the minimum job input and cannot communicate with the renderer directly.
- Production renderer content comes only from the packaged successor origin. Development loopback access is an explicit development-only exception and never enters packaged policy.

## Typed preload surface

The bridge exposes versioned, use-case-shaped methods such as:

```ts
type RensaiApi = {
  app: { getInfo(): Promise<AppInfo> };
  library: {
    chooseImportRoot(mode: 'series' | 'collection'): Promise<ImportPreview | null>;
    commitImport(previewId: string): Promise<ImportResult>;
    listSeries(query: LibraryQuery): Promise<SeriesSummary[]>;
    getSeries(id: SeriesId): Promise<SeriesDetail>;
    refreshSeries(id: SeriesId): Promise<RefreshResult>;
    relinkSeries(id: SeriesId): Promise<RelinkResult | null>;
    updateSeries(command: UpdateSeriesCommand): Promise<SeriesDetail>;
    removeSeries(id: SeriesId): Promise<void>;
    markChapters(command: MarkChaptersCommand): Promise<void>;
  };
  reader: {
    openChapter(chapterId: ChapterId): Promise<ReaderManifest>;
    checkpoint(command: ProgressCheckpoint): Promise<void>;
    closeSession(sessionId: string): Promise<void>;
  };
  categories: { list(): Promise<Category[]>; upsert(command: CategoryCommand): Promise<Category>; remove(id: CategoryId): Promise<void> };
  settings: { get(): Promise<Settings>; update(command: SettingsPatch): Promise<Settings> };
  data: {
    exportPortable(): Promise<ExportResult | null>;
    restorePortable(): Promise<RestorePreview | null>;
    importHoudoku(): Promise<LegacyImportPreview | null>;
    commitReplacement(previewId: string): Promise<ReplacementResult>;
    createSnapshot(reason: SnapshotReason): Promise<SnapshotInfo>;
  };
};
```

Exact names may change with the domain model, but the shape cannot degrade into `send(channel, payload)`, raw SQL, arbitrary paths, arbitrary URLs, or generic read/write/list/delete methods. All DTOs use successor-owned types and runtime schemas. Renderer validation improves UX; main validation is authoritative.

## Sender and payload validation

Every IPC handler must:

- Be registered once through a central capability registry.
- Accept only the main window's exact `webContents` identity.
- Require the top frame (`event.senderFrame === event.sender.mainFrame`).
- Require the exact packaged application origin; in development, require the configured loopback origin and development mode.
- Parse request and response DTOs through runtime schemas with unknown keys rejected where appropriate.
- Apply length/count/range/enum constraints before work begins.
- Return typed safe errors without stack traces, tokens, or full private paths.
- Support cancellation and tie long-running jobs to the invoking window/session.

Tests call every handler from an unexpected window/frame/origin and with malformed, oversized, and unknown-key payloads.

## Opaque Local Content authority

The native picker is the only way to introduce a source root. Main canonicalizes the selection, checks it, assigns a random `SourceGrantId`, and stores the absolute path plus any required macOS access material in main-owned persistence. The renderer receives only the grant ID, display basename, status, and safe relative labels.

All library operations accept series/chapter/source IDs. Main resolves them through SQLite and then:

1. Canonicalizes the stored root and candidate with `realpath`.
2. Uses `lstat`; symlinks are not followed during discovery.
3. Confirms the candidate is the root or a descendant using path-segment-safe comparison.
4. Applies the Personal Alpha depth/count/size/time limits.
5. Performs a read-only operation unless the use case is an app-owned database/temp/backup write.

The application never modifies or deletes user source files. Remove-library operations change SQLite only. A moved root becomes `missing`; relink requires another native-picker grant and an identity preview before update.

Portable export may include a user-readable source hint, but it cannot contain a reusable filesystem capability. Restore requires regranting paths.

## Reader asset protocol

Use separate packaged UI and page-asset schemes:

- `app://rensai/...` serves only bundled renderer assets from a fixed map and behaves as a secure standard origin.
- `rensai-page://<session>/<page-token>` serves only page bytes. URLs contain random opaque tokens, never paths.

Opening a chapter creates a main-owned reader session bound to the main window and a fixed ordered page manifest. Each token maps to one canonical authorized file or one bounded archive member. Tokens expire when the chapter/session closes and on app restart. The handler accepts read-only `GET`/`HEAD`, validates window/session/token, sets a recognized image content type plus `nosniff`, and rejects directories, ranges outside the file, queries, fragments, unknown tokens, and non-image payloads.

Do not expose a path-decoding protocol. Do not enable fetch/CORS privileges unless the concrete image-loading implementation proves they are required; if required, restrict them to the exact packaged origin and test cross-origin denial.

## Navigation, external opening, permissions, and network

- Deny `will-navigate`, `will-frame-navigate`, and all window creation away from `app://rensai`.
- No generic `shell.openExternal` bridge. An About action may open only a small compile-time allowlist of exact `https:` project/attribution URLs after a direct user gesture; reject credentials, fragments used as data, non-default ports, and every other scheme.
- Deny every Chromium permission request/check in Personal Alpha.
- Use a production CSP based on `default-src 'self'`, with scripts/styles limited to packaged assets and images limited to the page scheme plus only the minimal safe placeholders required. No `unsafe-eval`, remote scripts, objects, frames, forms, workers, or connections.
- At the session layer, deny all `http:`, `https:`, `ws:`, and `wss:` requests in the packaged alpha. Tests run with network interception and fail on any attempt.

## Archive boundary

Folders and ZIP/CBZ use a maintained parser that supports entry-by-entry inspection without loading or expanding the entire archive first. Validate file signature rather than suffix alone. Apply the limits frozen in the Personal Alpha contract.

Reject encrypted entries, symlinks/hardlinks/special files, traversal/absolute paths, duplicate normalized names, Unicode/case normalization collisions, nested archives, unsupported content, and a changed archive during a reader session. Give extracted/decoded pages deterministic internal IDs rather than flattened attacker-controlled filenames.

Each job owns a unique app-temp directory, cleans only that directory, and cleans it on success, cancellation, failure, and next-start recovery. No shared-root sweeping. Prefer streaming a member to the reader protocol; if extraction is necessary, write with exclusive creation and never place output under the user source root.

RAR/CBR is absent unless a maintained parser can enforce the identical signature, entry, link, collision, byte, ratio, time, cancellation, isolation, and hostile-corpus gates on macOS arm64. Failing that gate results in a clear unsupported-format error, not fallback to `node-unrar-js`.

## Legacy and removed capability disposition

- Delete `aki-plugin-manager`, runtime `eval/require`, plugin install/list/reload IPC and UI, startup plugin scanning, plugin settings, Tiyo manager/client dispatch, and `@tiyo/common` after local domain types replace it.
- Delete Online Source, tracker, Discord, updater, remote cover/download, telemetry, and their packages/UI/channels.
- The new application identity never scans the old Houdoku profile. An explicit legacy import reads only validated allowlisted data.
- If a selected legacy location contains `plugins`, leave it untouched and report that executable plugins were ignored. Do not copy or quarantine it automatically.
- Keep historical code accessible through Git/upstream commit reference, not a compiled `legacy/` subtree.

## Boundary acceptance

- Runtime assertion proves the window flags and exact exposed bridge keys.
- Package inspection proves removed code/packages are absent.
- Every IPC method rejects unexpected sender/frame/origin and malformed/oversized data.
- Renderer compromise simulation cannot reach Node, Electron, paths, SQL, shell, generic IPC, or a page outside an active session.
- Navigation, permissions, remote requests, and cross-origin page fetches are denied.
- Hostile filesystem/archive corpus reaches every limit and escape case without partial DB mutation, source writes, external reads, or leaked temp files.
- Offline packaged macOS arm64 acceptance journey passes.
