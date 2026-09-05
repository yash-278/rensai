> **Superseded as an execution plan on 2026-09-04.** Preserve the inherited feature set and fix demonstrated development blockers. See [current project direction](../../../PROJECT_DIRECTION.md). Do not execute removal tickets or impose the old migration gates. Research, fixtures, and retained identity decisions are historical reference. Original documents are preserved on `implementation/local-only-graph` at `f68b148`.

# Choose the Electron and Extension security boundary

Type: grilling
Status: superseded — historical reference only
Blocked by: 02

## Question

What target Electron process, preload, IPC, filesystem, navigation, protocol, archive, and update boundary should the Personal Alpha enforce; and should inherited executable Extension code be deleted, quarantined outside the build, or retained only as migration reference?

## Comments

- Resolve exact opaque file-capability semantics, custom-protocol behavior, sender/origin validation, navigation/network denial, archive limits, and whether RAR/CBR can meet the same safety gate as folders and ZIP/CBZ.
- Architecture asset: [`electron-and-local-content-security-boundary.md`](../research/electron-and-local-content-security-boundary.md).

## Answer

Use one hardened Electron window with a sandboxed Node-free renderer, context isolation, a statically declared preload, and main-owned SQLite/filesystem/archive/backup operations. The bridge exposes runtime-validated use cases only—never generic IPC, SQL, paths, URLs, or file primitives—and every handler validates the exact webContents, top frame, packaged origin, payload limits, and result schema.

Native selection creates a main-owned opaque source grant. The renderer sees IDs and safe labels, while main canonicalizes every candidate, refuses symlinks and root escapes, and applies bounded read-only jobs. Serve pages through expiring session-bound opaque tokens on a dedicated page scheme; never encode paths in URLs. Lock navigation to the packaged app origin, deny permissions and packaged network requests, use a restrictive CSP, and allow only explicit compile-time HTTPS attribution links through a typed user-gesture action.

Use bounded signature-validated streaming ZIP/CBZ handling with isolated per-job temporary storage and collision/link/traversal rejection. RAR/CBR is included only if a maintained parser passes the identical limits and hostile corpus on packaged macOS arm64; do not fall back to the inherited unbounded extractor.

Delete executable plugins, loaders/installers, the spoof window, Tiyo/Online Source dispatch, trackers, Discord, updater, telemetry, remote download/cover paths, and their dependencies from the active tree. Keep historical reference in Git, and never scan or copy an inherited plugin directory.
