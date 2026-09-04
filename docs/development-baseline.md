# Feature-preserving development baseline

As of 2026-09-04. Starting commit: `7125630`, branch: `revival-bootstrap`.

## Scope

Every inherited application capability remains in scope. This repair addresses failed typechecking without removing reader, library, source, download, tracker, Discord, backup, or updater functionality. The former local-only tickets do not govern this work.

## Verified checks

Local environment: macOS arm64, Node `24.19.0`, pnpm `9.0.0`. CI remains configured for Node 22. Hosted CI has not run for this change.

| Check | Before repair | After repair |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | Pass | Pass |
| `pnpm build --force` | Desktop and docs pass | Desktop and docs pass |
| `pnpm lint --force` | Desktop and UI pass | Desktop and UI pass |
| Desktop `pnpm exec tsc --noEmit --pretty false` | 384 TypeScript diagnostics | Pass |
| UI `pnpm exec tsc --noEmit --pretty false` | Pass | Pass |
| Root `pnpm check-types --force` | No script | Both TypeScript packages pass |

The host's default pnpm wrapper is version 11. These checks used `pnpm dlx pnpm@9.0.0` with Node available on `PATH`. Installs used the existing store at `/Users/yash/Library/pnpm/store/v3`.

No package defines a test script, and no automated test suite was found. Compiler checks provide the regression signal for this repair. They do not prove reader or provider behavior.

## Repaired blocker

Typechecking failed while builds passed because the build only transpiles TypeScript. CI did not run the compiler check.

- Unused Enzyme declarations pulled React 16 declarations into the React 18 app. Only `@types/enzyme` and `@types/enzyme-adapter-react-16` were removed. No Enzyme tests or imports were present.
- Desktop and shared UI now use the same `@types/react` version, `18.3.18`, which already existed in the lockfile. This removes duplicate React 18 declarations too.
- The fullscreen shortcut still invokes the same IPC handler. Its callback now returns `void`, as Mousetrap requires, instead of returning the IPC promise.
- The download queue no longer has an unused `@ts-expect-error`. TypeScript already narrows the filtered queue. Filtering and sorting behavior are unchanged.
- `patches/builder-util-runtime@8.9.2.patch` corrects the updater helper's `RequestHeaders` index type to `OutgoingHttpHeader | undefined`, matching Node's `OutgoingHttpHeaders`. The same declaration exists in the installed `builder-util-runtime@9.2.10`. The patch changes no JavaScript. All 11 helper JavaScript files match the original package byte for byte.
- `pnpm check-types` now checks desktop and UI sources through Turbo. CI runs it after a frozen install. No compiler strictness setting changed, and no declaration checks were disabled.

The updater patch is a temporary compatibility repair, not a security upgrade. A future updater upgrade must preserve update behavior and remove the patch once its declarations no longer need it.

## Dependency scope

pnpm regenerated the lockfile and pruned entries for the already absent `apps/docs-new` and `apps/docs-old` workspaces. No application or docs source directory was deleted.

For all current workspace importers, the only direct version change is `@types/react`, from `18.3.1` to `18.3.18`. No new package versions were introduced. Peer-resolution keys and the updater patch hash changed. Direct runtime dependency versions are unchanged.

## Startup evidence and limits

`pnpm --filter @houdoku/desktop dev --rendererOnly` started the renderer server and Electron. In electron-vite `2.3.0`, this flag skips main and preload compilation but still launches the app.

Logs confirmed main-process startup, IPC registration, filesystem-extension initialization, and the development-mode update-check skip. No Tiyo plugin load was reported. The process was stopped, and a process check found no remaining Electron process for this checkout.

This run used the default profile, not an isolated test profile. It is startup evidence only. No reading journey, saved-data comparison, plugin install, tracker login, Discord session, or update download was tested.

## Remaining work

- A controlled baseline of inherited features is still pending. It needs an isolated app profile and checks for local reading, imports, downloads, backup, sources, trackers, Discord, and updates. Provider-dependent checks must be reported separately.
- The install reports a Discord dependency peer mismatch: `ws@7.5.10` expects `utf-8-validate@^5.0.2`, but the app has `6.0.5`. A runtime failure has not been demonstrated.
- The nested desktop `pnpm.overrides` setting is ignored by pnpm. Whether the intended rebuild override remains necessary is unverified.
- Existing build warnings remain: plugin `eval`, ignored client directives, sourcemap reporting, stale browser data, and missing Turbo output configuration for docs. These did not fail the build.
- No fresh vulnerability audit or security remediation occurred in this repair. Electron, plugin trust, and upstream updater identity still need assessment before any release. No push, deployment, or publishing occurred.
